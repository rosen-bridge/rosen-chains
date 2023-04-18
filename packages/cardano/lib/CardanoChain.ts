import {
  AbstractUtxoChain,
  AssetBalance,
  BoxInfo,
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
import {
  Address,
  AssetName,
  Assets,
  BigNum,
  hash_transaction,
  MultiAsset,
  ScriptHash,
  Transaction,
  TransactionBuilder,
  TransactionHash,
  TransactionInput,
  TransactionOutput,
  TransactionWitnessSet,
  Value,
} from '@emurgo/cardano-serialization-lib-nodejs';
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
    const txBuilder = TransactionBuilder.new(txBuilderConfig);

    // add inputs
    bankBoxes.forEach((box) => {
      const txHash = TransactionHash.from_bytes(
        Buffer.from(box.tx_hash, 'hex')
      );
      const inputBox = TransactionInput.new(txHash, box.tx_index);
      txBuilder.add_input(
        Address.from_bech32(this.configs.lockAddress),
        inputBox,
        Value.new(CardanoUtils.bigIntToBigNum(cardanoOrder.assets.nativeToken))
      );
    });

    // create order output
    const address = Address.from_bech32(cardanoOrder.address);
    const value = Value.new(
      CardanoUtils.bigIntToBigNum(cardanoOrder.assets.nativeToken)
    );
    const paymentMultiAsset = MultiAsset.new();
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
      const paymentAssetPolicyId: ScriptHash = ScriptHash.from_bytes(
        paymentAssetInfo.policyId
      );
      const paymentAssetAssetName: AssetName = AssetName.new(
        paymentAssetInfo.assetName
      );
      const paymentAssets = Assets.new();
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
    const orderBox = TransactionOutput.new(address, value);
    txBuilder.add_output(orderBox);

    // create change output
    const changeBoxAssets = CardanoUtils.calculateInputBoxesAssets(bankBoxes);
    const changeBoxMultiAsset = changeBoxAssets.assets;
    let changeBoxLovelace: BigNum = changeBoxAssets.lovelace;
    changeBoxLovelace = changeBoxLovelace
      .checked_sub(CardanoUtils.bigIntToBigNum(this.configs.fee))
      .checked_sub(
        CardanoUtils.bigIntToBigNum(cardanoOrder.assets.nativeToken)
      );

    // check if payment has assets
    if (Object.keys(paymentAsset).length !== 0) {
      const paymentAssetPolicyId: ScriptHash = ScriptHash.from_hex(
        paymentAsset.policy_id!
      );
      const paymentAssetAssetName: AssetName = AssetName.from_hex(
        paymentAsset.asset_name!
      );
      const assetPaymentAmount: BigNum = BigNum.from_str(
        paymentAsset.quantity!
      );
      const paymentAssetAmount: BigNum = changeBoxMultiAsset.get_asset(
        paymentAssetPolicyId,
        paymentAssetAssetName
      );
      changeBoxMultiAsset.set_asset(
        paymentAssetPolicyId,
        paymentAssetAssetName,
        paymentAssetAmount.checked_sub(assetPaymentAmount)
      );
    }
    const changeAmount: Value = Value.new(changeBoxLovelace);
    changeAmount.set_multiasset(changeBoxMultiAsset);
    const changeBox = TransactionOutput.new(
      Address.from_bech32(this.configs.lockAddress),
      changeAmount
    );
    txBuilder.add_output(changeBox);

    // set ttl and fee
    txBuilder.set_ttl((await this.network.currentSlot()) + this.configs.txTtl);
    txBuilder.set_fee(CardanoUtils.bigIntToBigNum(this.configs.fee));

    // create the transaction
    const txBody = txBuilder.build();
    const tx = Transaction.new(txBody, TransactionWitnessSet.new(), undefined);
    const txBytes = Serializer.serialize(tx);
    const txId = Buffer.from(hash_transaction(txBody).to_bytes()).toString(
      'hex'
    );
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
    const box = TransactionOutput.from_bytes(Buffer.from(serializedBox, 'hex'));

    return {
      id: '1', // TODO: How to get box id?
      assets: CardanoUtils.getBoxAssets(box),
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
    signFunction: (...arg: any[]) => any
  ): Promise<PaymentTransaction> => {
    return {} as any;
  };

  getColdStorageTxConfirmationStatus = (
    transactionId: string
  ): Promise<ConfirmationStatus> => {
    return {} as any;
  };

  getMempoolBoxMapping = (
    address: string,
    tokenId: string | undefined
  ): Promise<Map<string, string | undefined>> => {
    return {} as any;
  };

  getPaymentTxConfirmationStatus = (
    transactionId: string
  ): Promise<ConfirmationStatus> => {
    return {} as any;
  };

  getTransactionAssets = (
    transaction: PaymentTransaction
  ): TransactionAssetBalance => {
    return {} as any;
  };

  isTxInMempool = (transactionId: string): Promise<boolean> => {
    return {} as any;
  };

  isTxValid = (transaction: PaymentTransaction): Promise<boolean> => {
    return {} as any;
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
}

export default CardanoChain;
