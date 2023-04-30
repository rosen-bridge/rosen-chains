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
  TokenInfo,
  TransactionAssetBalance,
} from '@rosen-chains/abstract-chain';
import { Fee } from '@rosen-bridge/minimum-fee';
import AbstractCardanoNetwork from './network/AbstractCardanoNetwork';
import { AbstractLogger } from '@rosen-bridge/logger-interface';
import {
  CardanoUtxo,
  CardanoAsset,
  CardanoConfigs,
  CardanoTx,
  SignedCardanoTx,
  CardanoBoxCandidate,
} from './types';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import { TokenMap } from '@rosen-bridge/tokens';
import { txBuilderConfig } from './constants';
import CardanoUtils from './CardanoUtils';
import CardanoTransaction from './CardanoTransaction';
import Serializer from './Serializer';
import { BigNum } from '@emurgo/cardano-serialization-lib-nodejs';
import cardanoUtils from './CardanoUtils';

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
    for (let i = 0; i < tx.outputs.length; i++) {
      const output = tx.outputs[i];

      // skip change box
      if (output.address === this.configs.lockAddress) continue;

      const payment: SinglePayment = {
        address: output.address,
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
    unsignedTransactions: PaymentTransaction[],
    serializedSignedTransactions: string[]
  ): Promise<PaymentTransaction> => {
    // const txBuilder = CardanoWasm.TransactionBuilder.new(txBuilderConfig);
    // let orderValue = BigNum.zero();
    // const orderAssets: Map<string, bigint> = new Map();
    //
    // // add outputs
    // order.forEach((order) => {
    //   if (order.extra) {
    //     throw Error('Cardano does not support extra data in payment order');
    //   }
    //   // accumulate value
    //   orderValue = orderValue.checked_add(
    //     CardanoUtils.bigIntToBigNum(order.assets.nativeToken)
    //   );
    //
    //   // create order output
    //   const address = CardanoWasm.Address.from_bech32(order.address);
    //   const value = CardanoWasm.Value.new(
    //     CardanoUtils.bigIntToBigNum(order.assets.nativeToken)
    //   );
    //   // inserting assets
    //   const paymentMultiAsset = CardanoWasm.MultiAsset.new();
    //   order.assets.tokens.forEach((asset) => {
    //     // accumulate assets
    //     if (orderAssets.has(asset.id)) {
    //       orderAssets.set(asset.id, orderAssets.get(asset.id)! + asset.value);
    //     } else {
    //       orderAssets.set(asset.id, asset.value);
    //     }
    //     const paymentAssetInfo = CardanoUtils.getCardanoAssetInfo(
    //       asset.id,
    //       this.tokenMap
    //     );
    //     const paymentAssetPolicyId: CardanoWasm.ScriptHash =
    //       CardanoWasm.ScriptHash.from_bytes(paymentAssetInfo.policyId);
    //     const paymentAssetAssetName: CardanoWasm.AssetName =
    //       CardanoWasm.AssetName.new(paymentAssetInfo.assetName);
    //     const paymentAssets = CardanoWasm.Assets.new();
    //     paymentAssets.insert(
    //       paymentAssetAssetName,
    //       CardanoUtils.bigIntToBigNum(asset.value)
    //     );
    //     paymentMultiAsset.insert(paymentAssetPolicyId, paymentAssets);
    //   });
    //   value.set_multiasset(paymentMultiAsset);
    //   const orderBox = CardanoWasm.TransactionOutput.new(address, value);
    //   txBuilder.add_output(orderBox);
    // });
    //
    // // add inputs
    // bankBoxes.forEach((box) => {
    //   const txHash = CardanoWasm.TransactionHash.from_bytes(
    //     Buffer.from(box.tx_hash, 'hex')
    //   );
    //   const inputBox = CardanoWasm.TransactionInput.new(txHash, box.tx_index);
    //   txBuilder.add_input(
    //     CardanoWasm.Address.from_bech32(this.configs.lockAddress),
    //     inputBox,
    //     CardanoWasm.Value.new(orderValue)
    //   );
    // });
    //
    // // create change output
    // const inputBoxesAssets = CardanoUtils.calculateInputBoxesAssets(bankBoxes);
    // const changeBoxMultiAsset = CardanoWasm.MultiAsset.new();
    // inputBoxesAssets.assets.forEach((value, key) => {
    //   const spentValue = orderAssets.get(key) || 0n;
    //   const assetInfo = CardanoUtils.getCardanoAssetInfo(key, this.tokenMap);
    //   const assets = CardanoWasm.Assets.new();
    //   assets.insert(
    //     CardanoWasm.AssetName.new(assetInfo.assetName),
    //     CardanoUtils.bigIntToBigNum(value - spentValue)
    //   );
    //   changeBoxMultiAsset.insert(
    //     CardanoWasm.ScriptHash.from_bytes(assetInfo.policyId),
    //     assets
    //   );
    // });
    // const changeBoxLovelace = inputBoxesAssets.lovelace
    //   .checked_sub(orderValue)
    //   .checked_sub(CardanoUtils.bigIntToBigNum(this.configs.fee));
    //
    // const changeAmount: CardanoWasm.Value =
    //   CardanoWasm.Value.new(changeBoxLovelace);
    // changeAmount.set_multiasset(changeBoxMultiAsset);
    // const changeBox = CardanoWasm.TransactionOutput.new(
    //   CardanoWasm.Address.from_bech32(this.configs.lockAddress),
    //   changeAmount
    // );
    // txBuilder.add_output(changeBox);
    //
    // // set ttl and fee
    // txBuilder.set_ttl((await this.network.currentSlot()) + this.configs.txTtl);
    // txBuilder.set_fee(CardanoUtils.bigIntToBigNum(this.configs.fee));
    //
    // // create the transaction
    // const txBody = txBuilder.build();
    // const tx = CardanoWasm.Transaction.new(
    //   txBody,
    //   CardanoWasm.TransactionWitnessSet.new(),
    //   undefined
    // );
    // const txBytes = Serializer.serialize(tx);
    // const txId = Buffer.from(
    //   CardanoWasm.hash_transaction(txBody).to_bytes()
    // ).toString('hex');
    // const cardanoTx = new CardanoTransaction(eventId, txBytes, txId, txType);
    //
    // this.logger.info(
    //   `Cardano transaction [${txId}] as type [${txType}] generated for event [${eventId}]`
    // );
    // return cardanoTx;
    return {} as any;
  };

  /**
   * extracts box id and assets of a box
   * @param serializedBox the serialized string of the box
   * @returns an object containing the box id and assets
   */
  getBoxInfo = (serializedBox: string): BoxInfo => {
    // const box = CardanoWasm.TransactionInput.from_bytes(
    //   Buffer.from(serializedBox, 'hex')
    // );
    const box: CardanoUtxo = JSON.parse(serializedBox);

    return {
      id: CardanoUtils.getBoxId(box),
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
      const response = await this.network.submitTransaction(JSON.stringify(tx));
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
      tx: CardanoTx,
      requiredSign: number
    ) => Promise<SignedCardanoTx>
  ): Promise<PaymentTransaction> => {
    const tx = Serializer.deserialize(transaction.txBytes);

    return signFunction(tx, requiredSign).then((signedTx: SignedCardanoTx) => {
      const signedTxBytes = Serializer.serialize(signedTx);
      const signedCardanoTx = new CardanoTransaction(
        transaction.eventId,
        signedTxBytes,
        signedTx.id,
        transaction.txType
      );
      return signedCardanoTx;
    });
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

    let inputAssets: AssetBalance = {
      nativeToken: 0n,
      tokens: [],
    };
    // extract input box assets
    for (const input of tx.inputs) {
      const boxAssets = this.getBoxInfo(JSON.stringify(input)).assets;
      inputAssets = ChainUtils.sumAssetBalance(inputAssets, boxAssets);
    }

    let outputAssets: AssetBalance = {
      nativeToken: 0n,
      tokens: [],
    };
    for (const output of tx.outputs) {
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
    tokenId?: string
  ): Promise<Map<string, string | undefined>> => {
    const trackMap = new Map<string, string | undefined>();

    const mempoolTxs = await this.network.getMempoolTransactions();
    mempoolTxs.forEach((serializedTx) => {
      const tx = Serializer.deserialize(Buffer.from(serializedTx));
      // iterate over tx inputs
      for (let i = 0; i < tx.inputs.length; i++) {
        let trackedBox: CardanoBoxCandidate | undefined;
        // iterate over tx outputs
        for (let j = 0; j < tx.outputs.length; j++) {
          const output = tx.outputs[j];
          // check if box satisfy conditions
          if (output.address !== address) continue;
          if (tokenId) {
            const boxTokens = cardanoUtils.getBoxAssets(output).tokens;
            if (!boxTokens.find((token) => token.id === tokenId)) continue;
          }

          // mark the tracked box
          trackedBox = output;
          break;
        }

        // add input box to trackMap
        const input = tx.inputs[i];
        trackMap.set(
          CardanoUtils.getBoxId(input),
          trackedBox ? JSON.stringify(trackedBox) : undefined
        );
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

    let valid = true;
    for (const box of tx.inputs) {
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

  getMinimumNativeToken = () => {
    return 0n;
  };
}

export default CardanoChain;
