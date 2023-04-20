import {
  AbstractUtxoChain,
  AssetBalance,
  BoxInfo,
  ChainUtils,
  ConfirmationStatus,
  EventTrigger,
  PaymentOrder,
  PaymentTransaction,
  SinglePayment,
  TransactionAssetBalance,
} from '@rosen-chains/abstract-chain';
import { Fee } from '@rosen-bridge/minimum-fee';
import AbstractCardanoNetwork from './network/AbstractCardanoNetwork';
import { AbstractLogger } from '@rosen-bridge/logger-interface';
import { AddressUtxo, Asset, CardanoConfigs } from './types';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import { TokenMap } from '@rosen-bridge/tokens';
import { txBuilderConfig } from './constants';
import CardanoUtils from './CardanoUtils';
import CardanoTransaction from './CardanoTransaction';
import Serializer from './Serializer';

class CardanoChain extends AbstractUtxoChain {
  declare network: AbstractCardanoNetwork;
  declare configs: CardanoConfigs;
  tokenMap: TokenMap;

  constructor(
    network: AbstractCardanoNetwork,
    configs: CardanoConfigs,
    tokenMap: TokenMap,
    logger?: AbstractLogger
  ) {
    super(network, configs, logger);
    this.tokenMap = tokenMap;
  }

  /**
   * extracts payment order of a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns the transaction payment order (list of single payments)
   */
  extractTransactionOrder = (transaction: PaymentTransaction): PaymentOrder => {
    const tx = Serializer.deserialize(transaction.txBytes);

    const order: PaymentOrder = [];
    for (let i = 0; i < tx.body().outputs().len(); i++) {
      const output = tx.body().outputs().get(i);

      // skip change box
      if (output.address().to_bech32() === this.configs.lockAddress) continue;

      const payment: SinglePayment = {
        address: output.address().to_bech32(),
        assets: CardanoUtils.getBoxAssets(output),
      };
      order.push(payment);
    }
    return order;
  };

  /**
   * generates unsigned payment transaction for payment order
   * @param eventId the id of event
   * @param txType transaction type
   * @param order the payment order (list of single payments)
   * @param bankBoxes the input bank boxes
   * @returns the generated payment transaction
   */
  generateTransaction = async (
    eventId: string,
    txType: string,
    order: PaymentOrder,
    bankBoxes: AddressUtxo[]
  ): Promise<PaymentTransaction> => {
    if (order.length > 1) {
      throw new Error(
        'Cardano does not support multiple outputs in a transaction'
      );
    }
    const cardanoOrder = order[0];
    const txBuilder = CardanoWasm.TransactionBuilder.new(txBuilderConfig);

    // add inputs
    bankBoxes.forEach((box) => {
      const txHash = CardanoWasm.TransactionHash.from_bytes(
        Buffer.from(box.tx_hash, 'hex')
      );
      const inputBox = CardanoWasm.TransactionInput.new(txHash, box.tx_index);
      txBuilder.add_input(
        CardanoWasm.Address.from_bech32(this.configs.lockAddress),
        inputBox,
        CardanoWasm.Value.new(
          CardanoUtils.bigIntToBigNum(cardanoOrder.assets.nativeToken)
        )
      );
    });

    // create order output
    const address = CardanoWasm.Address.from_bech32(cardanoOrder.address);
    const value = CardanoWasm.Value.new(
      CardanoUtils.bigIntToBigNum(cardanoOrder.assets.nativeToken)
    );
    const paymentMultiAsset = CardanoWasm.MultiAsset.new();
    if (cardanoOrder.assets.tokens.length > 1) {
      throw new Error('Can not send more than one token in an order');
    }
    let paymentAsset: Partial<Asset> = {};
    if (cardanoOrder.assets.tokens.length === 1) {
      const token = cardanoOrder.assets.tokens[0];
      const paymentAssetInfo = CardanoUtils.getCardanoAssetInfo(
        token.id,
        this.tokenMap
      );
      const paymentAssetPolicyId: CardanoWasm.ScriptHash =
        CardanoWasm.ScriptHash.from_bytes(paymentAssetInfo.policyId);
      const paymentAssetAssetName: CardanoWasm.AssetName =
        CardanoWasm.AssetName.new(paymentAssetInfo.assetName);
      const paymentAssets = CardanoWasm.Assets.new();
      paymentAssets.insert(
        paymentAssetAssetName,
        CardanoUtils.bigIntToBigNum(token.value)
      );
      paymentMultiAsset.insert(paymentAssetPolicyId, paymentAssets);
      paymentAsset = {
        policy_id: paymentAssetPolicyId.to_hex(),
        asset_name: paymentAssetAssetName.to_hex(),
        quantity: token.value.toString(),
      };
    }

    value.set_multiasset(paymentMultiAsset);
    const orderBox = CardanoWasm.TransactionOutput.new(address, value);
    txBuilder.add_output(orderBox);

    // create change output
    const changeBoxAssets = CardanoUtils.calculateInputBoxesAssets(bankBoxes);
    const changeBoxMultiAsset = changeBoxAssets.assets;
    let changeBoxLovelace: CardanoWasm.BigNum = changeBoxAssets.lovelace;
    changeBoxLovelace = changeBoxLovelace
      .checked_sub(CardanoUtils.bigIntToBigNum(this.configs.fee))
      .checked_sub(
        CardanoUtils.bigIntToBigNum(cardanoOrder.assets.nativeToken)
      );

    // check if payment has assets
    if (Object.keys(paymentAsset).length !== 0) {
      const paymentAssetPolicyId: CardanoWasm.ScriptHash =
        CardanoWasm.ScriptHash.from_hex(paymentAsset.policy_id!);
      const paymentAssetAssetName: CardanoWasm.AssetName =
        CardanoWasm.AssetName.from_hex(paymentAsset.asset_name!);
      const assetPaymentAmount: CardanoWasm.BigNum =
        CardanoWasm.BigNum.from_str(paymentAsset.quantity!);
      const paymentAssetAmount: CardanoWasm.BigNum =
        changeBoxMultiAsset.get_asset(
          paymentAssetPolicyId,
          paymentAssetAssetName
        );
      changeBoxMultiAsset.set_asset(
        paymentAssetPolicyId,
        paymentAssetAssetName,
        paymentAssetAmount.checked_sub(assetPaymentAmount)
      );
    }
    const changeAmount: CardanoWasm.Value =
      CardanoWasm.Value.new(changeBoxLovelace);
    changeAmount.set_multiasset(changeBoxMultiAsset);
    const changeBox = CardanoWasm.TransactionOutput.new(
      CardanoWasm.Address.from_bech32(this.configs.lockAddress),
      changeAmount
    );
    txBuilder.add_output(changeBox);

    // set ttl and fee
    txBuilder.set_ttl((await this.network.currentSlot()) + this.configs.txTtl);
    txBuilder.set_fee(CardanoUtils.bigIntToBigNum(this.configs.fee));

    // create the transaction
    const txBody = txBuilder.build();
    const tx = CardanoWasm.Transaction.new(
      txBody,
      CardanoWasm.TransactionWitnessSet.new(),
      undefined
    );
    const txBytes = Serializer.serialize(tx);
    const txId = Buffer.from(
      CardanoWasm.hash_transaction(txBody).to_bytes()
    ).toString('hex');
    const cardanoTx = new CardanoTransaction(eventId, txBytes, txId, txType);

    this.logger.info(
      `Cardano transaction [${txId}] as type [${txType}] generated for event [${eventId}]`
    );
    return cardanoTx;
  };

  /**
   * extracts box id and assets of a box
   * @param serializedBox the serialized string of the box
   * @returns an object containing the box id and assets
   */
  getBoxInfo = (serializedBox: string): BoxInfo => {
    const box = CardanoWasm.TransactionInput.from_bytes(
      Buffer.from(serializedBox, 'hex')
    );

    return {
      id: CardanoUtils.getBoxId(box),
      assets: null as any, //TODO: How to get?
    };
  };

  /**
   * gets the amount of each asset in the lock address
   * @returns an object containing the amount of each asset
   */
  getLockAddressAssets = (): Promise<AssetBalance> => {
    return this.network.getAddressAssets(this.configs.lockAddress);
  };

  /**
   * submits a transaction to the blockchain
   * @param transaction the transaction
   */
  submitTransaction = async (
    transaction: PaymentTransaction
  ): Promise<void> => {
    // deserialize transaction
    const tx = Serializer.deserialize(transaction.txBytes);

    // send transaction
    try {
      const response = await this.network.submitTransaction(tx.to_json());
      this.logger.info(
        `Cardano Transaction [${transaction.txId}] submitted. Response: ${response}`
      );
    } catch (e) {
      this.logger.warn(
        `An error occurred while submitting Cardano transaction [${transaction.txId}]: ${e}`
      );
      if (e instanceof Error && e.stack) {
        this.logger.warn(e.stack);
      }
    }
  };

  /**
   * requests the corresponding signer service to sign the transaction
   * @param transaction the transaction
   * @param requiredSign the required number of sign
   * @param signFunction the function to sign transaction
   * @returns the signed transaction
   */
  signTransaction = (
    transaction: PaymentTransaction,
    requiredSign: number,
    signFunction: (
      tx: CardanoWasm.Transaction,
      requiredSign: number
    ) => Promise<CardanoWasm.Transaction>
  ): Promise<PaymentTransaction> => {
    const tx = Serializer.deserialize(transaction.txBytes);

    return signFunction(tx, requiredSign).then(
      (signedTx: CardanoWasm.Transaction) => {
        const signedTxBytes = Serializer.serialize(signedTx);
        const signedTxId = Buffer.from(
          CardanoWasm.hash_transaction(signedTx.body()).to_bytes()
        ).toString('hex');
        const signedCardanoTx = new CardanoTransaction(
          transaction.eventId,
          signedTxBytes,
          signedTxId,
          transaction.txType
        );
        return signedCardanoTx;
      }
    );
  };

  /**
   * gets input and output assets of a payment transaction
   * @param transaction the payment transaction
   * @returns true if the transaction verified
   */
  getTransactionAssets = (
    transaction: PaymentTransaction
  ): TransactionAssetBalance => {
    const tx = Serializer.deserialize(transaction.txBytes);
    const txBody = tx.body();

    let inputAssets: AssetBalance = {
      nativeToken: 0n,
      tokens: [],
    };
    // extract input box assets
    for (let i = 0; i < txBody.inputs().len(); i++) {
      const input = txBody.inputs().get(i);
      const boxAssets = this.getBoxInfo(input.to_hex()).assets;
      inputAssets = ChainUtils.sumAssetBalance(inputAssets, boxAssets);
    }

    let outputAssets: AssetBalance = {
      nativeToken: 0n,
      tokens: [],
    };
    for (let i = 0; i < txBody.inputs().len(); i++) {
      const output = txBody.outputs().get(i);
      const boxAssets = CardanoUtils.getBoxAssets(output);
      outputAssets = ChainUtils.sumAssetBalance(outputAssets, boxAssets);
    }

    return {
      inputAssets,
      outputAssets,
    };
  };

  /**
   * generates mapping from input box id to serialized string of output box (filtered by address, containing the token)
   * @param address the address
   * @param tokenId the token id
   * @returns a Map from input box id to serialized string of output box
   */
  getMempoolBoxMapping = async (
    address: string,
    tokenId: string | undefined
  ): Promise<Map<string, string | undefined>> => {
    const trackMap = new Map<string, string | undefined>();

    const mempoolTxs = await this.network.getMempoolTransactions();
    mempoolTxs.forEach((serializedTx) => {
      const tx = CardanoWasm.Transaction.from_bytes(
        Buffer.from(serializedTx, 'hex')
      );
      const txBody = tx.body();
      for (let i = 0; i < txBody.inputs().len(); i++) {
        let trackedBox: CardanoWasm.TransactionOutput | undefined;
        const input = txBody.inputs().get(i);
        const box = this.getBoxInfo(input.to_hex());
        if (box.assets && box.assets.tokens) {
          const token = box.assets.tokens.find((t) => t.id === tokenId);
          if (token) {
            const output = txBody.outputs().get(i);
            if (output.address().to_js_value() === address) {
              trackedBox = output;
            }
          }
        }
        trackMap.set(box.id, trackedBox ? trackedBox.to_hex() : undefined);
      }
    });

    return trackMap;
  };

  /**
   * checks if a transaction is in mempool (returns false if the chain has no mempool)
   * @param transactionId the transaction id
   * @returns true if the transaction is in mempool
   */
  isTxInMempool = async (transactionId: string): Promise<boolean> => {
    const mempoolTxs = await this.network.getMempoolTransactions();
    const mempoolTxIds = mempoolTxs.map((serializedTx) => {
      const tx = CardanoWasm.Transaction.from_bytes(
        Buffer.from(serializedTx, 'hex')
      );
      const txId = Buffer.from(
        CardanoWasm.hash_transaction(tx.body()).to_bytes()
      ).toString('hex');
      return txId;
    });

    return mempoolTxIds.includes(transactionId);
  };

  /**
   * checks if a transaction is still valid and can be sent to the network
   * @param transaction the transaction
   * @returns true if the transaction is still valid
   */
  isTxValid = async (transaction: PaymentTransaction): Promise<boolean> => {
    const tx = Serializer.deserialize(transaction.txBytes);
    const txBody = tx.body();

    let valid = true;
    for (let i = 0; i < txBody.inputs().len(); i++) {
      const box = txBody.inputs().get(i);
      valid =
        valid &&
        (await this.network.isBoxUnspentAndValid(CardanoUtils.getBoxId(box)));
    }
    return valid;
  };

  verifyEvent = (
    event: EventTrigger,
    RwtId: string,
    feeConfig: Fee
  ): Promise<boolean> => {
    return Promise.resolve(false);
  };

  verifyTransactionFee = (transaction: PaymentTransaction): boolean => {
    return false;
  };

  getTxConfirmationStatus = (
    transactionId: string,
    transactionType: string
  ): Promise<ConfirmationStatus> => {
    return {} as any;
  };
}

export default CardanoChain;
