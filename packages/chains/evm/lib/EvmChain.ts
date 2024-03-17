import JSONBigInt from '@rosen-bridge/json-bigint';
import {
  AbstractChain,
  EventTrigger,
  MaxParallelTxError,
  ChainUtils,
  NotEnoughAssetsError,
  PaymentOrder,
  PaymentTransaction,
  SigningStatus,
  TransactionAssetBalance,
  TransactionType,
  SinglePayment,
  PaymentTransactionJsonModel,
  AssetBalance,
} from '@rosen-chains/abstract-chain';
import { Fee } from '@rosen-bridge/minimum-fee';
import AbstractEvmNetwork from './network/AbstractEvmNetwork';
import { EvmConfigs } from './types';
import { Transaction, TransactionLike } from 'ethers';
import Serializer from './Serializer';
import * as EvmUtils from './EvmUtils';

abstract class EvmChain extends AbstractChain {
  declare network: AbstractEvmNetwork;
  declare configs: EvmConfigs;
  // TODO: fix 'CHAIN' vars
  abstract CHAIN_NAME: string;
  abstract CHAIN_ID: bigint;
  feeRatioDivisor: bigint;
  protected signFunction: (txHash: Uint8Array) => Promise<string>;

  constructor(
    network: AbstractEvmNetwork,
    configs: any,
    feeRatioDivisor: bigint,
    signFunction: (txHash: Uint8Array) => Promise<string>,
    logger?: any
  ) {
    super(network, configs, logger);
    this.feeRatioDivisor = feeRatioDivisor;
    this.signFunction = signFunction;
  }

  /**
   * generates unsigned PaymentTransaction for payment order
   * @param eventId the id of event
   * @param txType transaction type
   * @param order the payment order (list of single payments)
   * @param unsignedTransactions ongoing unsigned PaymentTransactions (used for preventing double spend)
   * @param serializedSignedTransactions the serialized string of ongoing signed transactions (used for chaining transaction)
   * @returns the generated PaymentTransaction
   */
  generateTransaction = async (
    eventId: string,
    txType: TransactionType,
    order: PaymentOrder,
    unsignedTransactions: PaymentTransaction[],
    serializedSignedTransactions: string[]
  ): Promise<PaymentTransaction> => {
    // TODO later change this to return a transaction per SinglePayment
    order = [EvmUtils.splitPaymentOrders(order)[0]];
    // Check the number of parallel transaction won't be exceeded
    const waiting =
      unsignedTransactions.length + serializedSignedTransactions.length;
    if (waiting >= this.configs.maxParallelTx) {
      throw new MaxParallelTxError(`
      There are ${waiting} transactions already in the process!`);
    }

    // Check the balance in the lock address
    const gasPrice = await this.network.getMaxFeePerGas();
    const gasRequired = this.getGasRequired(order[0]);
    const fee = gasRequired * gasPrice;
    const requiredAssets = ChainUtils.sumAssetBalance(order[0].assets, {
      nativeToken: fee,
      tokens: [],
    });
    if (!(await this.hasLockAddressEnoughAssets(requiredAssets))) {
      const neededETH = requiredAssets.nativeToken.toString();
      const neededTokens = JSONBigInt.stringify(requiredAssets.tokens);
      throw new NotEnoughAssetsError(
        `Locked assets cannot cover required assets. ETH: ${neededETH}, Tokens: ${neededTokens}`
      );
    }

    // Generate the transaction
    let trx;
    const nonce = await this.network.getAddressNextAvailableNonce(
      this.configs.addresses.lock
    );
    const maxPriorityFeePerGas = await this.network.getMaxPriorityFeePerGas();

    if (order[0].assets.nativeToken != 0n) {
      trx = Transaction.from({
        type: 2,
        to: order[0].address,
        nonce: nonce,
        gasLimit: gasRequired,
        maxPriorityFeePerGas: maxPriorityFeePerGas,
        maxFeePerGas: gasPrice,
        data: '0x' + eventId,
        value: order[0].assets.nativeToken,
        chainId: this.CHAIN_ID,
      });
    } else {
      const token = order[0].assets.tokens[0];
      const data = EvmUtils.encodeTransferCallData(
        token.id,
        order[0].address,
        token.value
      );
      trx = Transaction.from({
        type: 2,
        to: token.id,
        nonce: nonce,
        gasLimit: gasRequired,
        maxPriorityFeePerGas: maxPriorityFeePerGas,
        maxFeePerGas: gasPrice,
        data: data + eventId,
        value: 0n,
        chainId: this.CHAIN_ID,
      } as TransactionLike);
    }
    const evmTx = new PaymentTransaction(
      this.CHAIN_NAME,
      trx.unsignedHash,
      eventId,
      Serializer.serialize(trx),
      txType
    );

    this.logger.info(
      `Cardano transaction [${trx.hash}] as type [${txType}] generated for event [${eventId}]`
    );
    return evmTx;
  };

  /**
   * gets gas required to do the transfer.
   * note that we assume checks have been done before calling this function;
   * either nativeToken should be non zero, or there is only one asset in the tokens list.
   * @param payment the SinglePayment to be made
   * @returns gas required in bigint
   */
  getGasRequired = (payment: SinglePayment): bigint => {
    if (payment.assets.nativeToken != 0n) {
      return this.network.getGasRequiredNativeTransfer(payment.address);
    }
    return this.network.getGasRequiredERC20Transfer(
      payment.assets.tokens[0].id,
      payment.address,
      payment.assets.tokens[0].value
    );
  };

  /**
   * gets input and output assets of a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns an object containing the amount of input and output assets
   */
  getTransactionAssets = async (
    transaction: PaymentTransaction
  ): Promise<TransactionAssetBalance> => {
    const tx = Serializer.deserialize(transaction.txBytes);

    const outputAssets: AssetBalance = {
      nativeToken: 0n,
      tokens: [],
    };
    const inputAssets: AssetBalance = {
      nativeToken: 0n,
      tokens: [],
    };

    const networkFee = tx.maxFeePerGas! * tx.gasLimit;
    outputAssets.nativeToken = tx.value + networkFee;
    inputAssets.nativeToken = tx.value + networkFee;
    if (EvmUtils.isTransfer(tx.to!, tx.data)) {
      const [_, amount] = EvmUtils.decodeTransferCallData(tx.to!, tx.data);
      outputAssets.tokens.push({
        id: tx.to!.toLowerCase(),
        value: amount,
      });
      inputAssets.tokens.push({
        id: tx.to!.toLowerCase(),
        value: amount,
      });
    }

    return {
      inputAssets,
      outputAssets,
    };
  };

  /**
   * extracts payment order of a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns the transaction payment order (list of single payments)
   */
  extractTransactionOrder = (transaction: PaymentTransaction): PaymentOrder => {
    const tx = Serializer.deserialize(transaction.txBytes);

    if (EvmUtils.isTransfer(tx.to!, tx.data)) {
      // erco-20 transfer
      const [to, amount] = EvmUtils.decodeTransferCallData(tx.to!, tx.data);
      return [
        {
          address: to.toLowerCase(),
          assets: {
            nativeToken: tx.value,
            tokens: [
              {
                id: tx.to!.toLowerCase(),
                value: amount,
              },
            ],
          },
        },
      ];
    }
    // native-token transfer
    return [
      {
        address: tx.to!.toLowerCase(),
        assets: {
          nativeToken: tx.value,
          tokens: [],
        },
      },
    ];
  };

  /**
   * verifies transaction fee for a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns true if the transaction fee is verified
   */
  verifyTransactionFee = async (
    transaction: PaymentTransaction
  ): Promise<boolean> => {
    const tx = Serializer.deserialize(transaction.txBytes);

    // check gas limit
    let gasRequired = 0n;
    if (EvmUtils.isTransfer(tx.to!, tx.data)) {
      const [to, amount] = EvmUtils.decodeTransferCallData(tx.to!, tx.data);
      gasRequired = this.network.getGasRequiredERC20Transfer(
        tx.to!,
        to,
        amount
      );
    }
    if (tx.value != 0n) {
      gasRequired += this.network.getGasRequiredNativeTransfer(tx.to!);
    }

    if (tx.gasLimit != gasRequired) {
      this.logger.debug(
        `Tx [${transaction.txId}] invalid: Transaction gasLimit [${tx.gasLimit}] is more than maximum required [${gasRequired}]`
      );
      return false;
    }

    // check fees
    const networkMaxFee = await this.network.getMaxFeePerGas();
    const feeSlippage = (networkMaxFee * BigInt(this.configs.slippage)) / 100n;
    if (
      tx.maxFeePerGas! - networkMaxFee > feeSlippage ||
      networkMaxFee - tx.maxFeePerGas! > feeSlippage
    ) {
      this.logger.debug(
        `Tx [${
          transaction.txId
        }] invalid: Transaction max fee [${tx.maxFeePerGas!}]
         is too far from network's max fee [${networkMaxFee}]`
      );
      return false;
    }

    const networkMaxPriorityMaxFee =
      await this.network.getMaxPriorityFeePerGas();
    const priorityFeeSlippage =
      (networkMaxPriorityMaxFee * BigInt(this.configs.slippage)) / 100n;
    if (
      tx.maxPriorityFeePerGas! - networkMaxPriorityMaxFee >
        priorityFeeSlippage ||
      networkMaxPriorityMaxFee - tx.maxPriorityFeePerGas! > priorityFeeSlippage
    ) {
      this.logger.debug(
        `Tx [${
          transaction.txId
        }] invalid: Transaction max priority fee [${tx.maxPriorityFeePerGas!}]
         is too far from network's max priority fee [${networkMaxPriorityMaxFee!}]`
      );
      return false;
    }
    return true;
  };

  /**
   * verifies an event data with its corresponding lock transaction
   * @param event the event trigger model
   * @param feeConfig minimum fee and rsn ratio config for the event
   * @returns true if the event is verified
   */
  verifyEvent = async (
    event: EventTrigger,
    feeConfig: Fee
  ): Promise<boolean> => {
    // TODO: remove this function (local:ergo/rosen-bridge/rosen-chains#93)
    throw new Error('Not implemented yet.');
  };

  /**
   * checks if a transaction is still valid and can be sent to the network
   * @param transaction the transaction
   * @param signingStatus
   * @returns true if the transaction is still valid
   */
  isTxValid = async (
    transaction: PaymentTransaction,
    signingStatus: SigningStatus
  ): Promise<boolean> => {
    let trx: Transaction;
    if (signingStatus === SigningStatus.Signed) {
      trx = Serializer.signedDeserialize(transaction.txBytes);
    } else {
      trx = Serializer.deserialize(transaction.txBytes);
    }

    // check the nonce wasn't increased
    const nextNonce = await this.network.getAddressNextAvailableNonce(
      this.configs.addresses.lock
    );
    if (nextNonce != trx.nonce) {
      return false;
    }

    // check lock still has enough assets (as a result of re-org)
    const txAssets = await this.getTransactionAssets(transaction);
    if (!(await this.hasLockAddressEnoughAssets(txAssets.inputAssets))) {
      return false;
    }

    // check inputs and outputs match (it always must be the case in evm)
    return ChainUtils.isEqualAssetBalance(
      txAssets.inputAssets,
      txAssets.outputAssets
    );
  };

  /**
   * requests the corresponding signer service to sign the transaction
   * @param transaction the transaction
   * @param requiredSign the required number of sign
   * @returns the signed transaction
   */
  signTransaction = async (
    transaction: PaymentTransaction,
    requiredSign: number
  ): Promise<PaymentTransaction> => {
    // TODO: implement this function (local:ergo/rosen-bridge/rosen-chains#94)
    throw new Error('Not implemented yet.');
  };

  /**
   * submits a transaction to the blockchain
   * @param transaction the transaction
   */
  submitTransaction = async (
    transaction: PaymentTransaction
  ): Promise<void> => {
    // deserialize transaction
    const tx = Serializer.signedDeserialize(transaction.txBytes);

    // send transaction
    try {
      const response = await this.network.submitTransaction(tx);
      this.logger.info(
        `${this.CHAIN_NAME} Transaction [${transaction.txId}] submitted. Response: ${response}`
      );
    } catch (e) {
      this.logger.warn(
        `An error occurred while submitting ${this.CHAIN_NAME} transaction [${transaction.txId}]: ${e}`
      );
      if (e instanceof Error && e.stack) {
        this.logger.warn(e.stack);
      }
    }
  };

  /**
   * checks if a transaction is in mempool (returns false if the chain has no mempool)
   * @param transactionId the transaction id
   * @returns true if the transaction is in mempool
   */
  isTxInMempool = async (transactionId: string): Promise<boolean> => {
    // we ignore mempool as it doesn't affect us
    return false;
  };

  /**
   * gets the minimum amount of native token for transferring asset
   * @returns the minimum amount
   */
  getMinimumNativeToken = (): bigint => 0n;

  /**
   * converts json representation of the payment transaction to PaymentTransaction
   * @param jsonString the payment transaction's json representation
   * @returns PaymentTransaction object
   */
  PaymentTransactionFromJson = (jsonString: string): PaymentTransaction => {
    const obj = JSON.parse(jsonString) as PaymentTransactionJsonModel;
    return new PaymentTransaction(
      this.CHAIN_NAME,
      obj.txId,
      obj.eventId,
      Buffer.from(obj.txBytes, 'hex'),
      obj.txType as TransactionType
    );
  };

  /**
   * generates PaymentTransaction object from raw tx json string
   * @param rawTxJsonString
   * @returns PaymentTransaction object
   */
  rawTxToPaymentTransaction = async (
    rawTxJsonString: string
  ): Promise<PaymentTransaction> => {
    const trx = Transaction.from(JSON.parse(rawTxJsonString));
    const evmTx = new PaymentTransaction(
      this.CHAIN_NAME,
      trx.unsignedHash,
      '',
      Serializer.serialize(trx),
      TransactionType.manual
    );

    this.logger.info(
      `Parsed ${this.CHAIN_NAME} transaction [${trx.unsignedHash}] successfully`
    );
    return evmTx;
  };

  /**
   * verifies additional conditions for a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns true if the transaction is verified
   */
  verifyTransactionExtraConditions = (
    transaction: PaymentTransaction
  ): boolean => {
    const tx = Serializer.deserialize(transaction.txBytes);

    // eventId must be at the end of calldata
    const eventId = tx.data!.substring(tx.data!.length - 32);
    if (eventId != transaction.eventId) {
      this.logger.debug(
        `Tx [${transaction.txId}] is invalid. Encoded eventId [${eventId}] does 
        not match with the expected one [${transaction.eventId}]`
      );
      return false;
    }

    // tx must be a single payment
    if (
      (tx.value == 0n && tx.data.length == 32 + 2) ||
      (tx.value != 0n && tx.data.length == 136 + 32 + 2)
    ) {
      this.logger.debug(
        `Tx [${transaction.txId}] is invalid. It both transfers native-token and has extra call-data.`
      );
      return false;
    }

    // tx must have either 32 or 170 bytes of data
    if (![32, 32 + 2 + 136].includes(tx.data.length)) {
      this.logger.debug(
        `Tx [${transaction.txId}] is invalid. Calldata has extra bytes.`
      );
      return false;
    }

    // only erc-20 `transfer` is allowed
    if (tx.value == 0n) {
      if (!EvmUtils.isTransfer(tx.to!, tx.data)) {
        this.logger.debug(
          `Tx [${transaction.txId}] is invalid. Calldata [${tx.data}] can not be parsed for 'transfer'.`
        );
        return false;
      }
    }

    // only type 2 transactions are allowed, and blobs must be null
    if (tx.type != 2 || tx.maxFeePerBlobGas != null) {
      this.logger.debug(
        `Tx [${transaction.txId}] is invalid. maxFeePerBlobGas non-zero [${tx.maxFeePerBlobGas}]`
      );
      return false;
    }

    return true;
  };
}

export default EvmChain;
