import { RosenTokens } from '@rosen-bridge/tokens';
import JSONBigInt from '@rosen-bridge/json-bigint';
import {
  AbstractChain,
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
  AssetNotSupportedError,
  BlockInfo,
  ImpossibleBehavior,
  TransactionFormatError,
} from '@rosen-chains/abstract-chain';
import { EvmRosenExtractor } from '@rosen-bridge/rosen-extractor';
import AbstractEvmNetwork from './network/AbstractEvmNetwork';
import { EvmConfigs } from './types';
import { Transaction } from 'ethers';
import Serializer from './Serializer';
import * as EvmUtils from './EvmUtils';

abstract class EvmChain extends AbstractChain<Transaction> {
  declare network: AbstractEvmNetwork;
  declare configs: EvmConfigs;
  abstract CHAIN: string;
  abstract CHAIN_ID: bigint;
  extractor: EvmRosenExtractor | undefined;

  feeRatioDivisor: bigint;
  supportedTokens: Array<string>;
  protected signFunction: (txHash: Uint8Array) => Promise<string>;

  constructor(
    network: AbstractEvmNetwork,
    configs: any,
    feeRatioDivisor: bigint,
    tokens: RosenTokens,
    nativeToken: string,
    supportedTokens: Array<string>,
    signFunction: (txHash: Uint8Array) => Promise<string>,
    logger?: any
  ) {
    super(network, configs, logger);
    this.feeRatioDivisor = feeRatioDivisor;
    this.supportedTokens = supportedTokens;
    this.signFunction = signFunction;
    this.initExtractor(tokens, nativeToken, logger);
  }

  /**
   * initializes rosen extractor
   * @param tokens
   * @param nativeToken
   * @param logger
   */
  protected initExtractor = (
    tokens: RosenTokens,
    nativeToken: string,
    logger?: any
  ) => {
    this.extractor = new EvmRosenExtractor(
      this.configs.addresses.lock,
      tokens,
      this.CHAIN,
      nativeToken,
      logger
    );
  };

  /**
   * generates single or multiple unsigned PaymentTransactions for a payment order
   * performs the following checks before:
   * - in case of erc-20 transfer, the tokenId must be in our supported list
   * - number of pending transactions shouldn't exceed our maxParallelTx
   * - lock address should have enough balance
   * - nonces must be set in sequential order starting from next available nonce
   * @param eventId the id of event
   * @param txType transaction type
   * @param order the payment order (list of single payments)
   * @param unsignedTransactions ongoing unsigned PaymentTransactions (used for preventing double spend)
   * @param serializedSignedTransactions the serialized string of ongoing signed transactions (used for chaining transaction)
   * @returns the generated PaymentTransaction
   */
  generateMultipleTransactions = async (
    eventId: string,
    txType: TransactionType,
    order: PaymentOrder,
    unsignedTransactions: PaymentTransaction[],
    serializedSignedTransactions: string[]
  ): Promise<PaymentTransaction[]> => {
    const orders = EvmUtils.splitPaymentOrders(order);
    orders.forEach((singleOrder) => {
      if (singleOrder.assets.tokens.length === 1) {
        const assetId = singleOrder.assets.tokens[0].id;
        if (!this.supportedTokens.includes(assetId)) {
          throw new AssetNotSupportedError(
            `Asset id [${assetId}] is not supported`
          );
        }
      }
    });
    // Check the number of parallel transactions won't be exceeded
    const waiting =
      unsignedTransactions.length + serializedSignedTransactions.length;
    if (waiting + order.length > this.configs.maxParallelTx) {
      throw new MaxParallelTxError(`
      There are [${waiting}] transactions already in the process`);
    }

    // Check the balance in the lock address
    const gasPrice = await this.network.getMaxFeePerGas();
    let gasRequired = 0n;
    let requiredAssets: AssetBalance = {
      nativeToken: 0n,
      tokens: [],
    };
    orders.forEach((singleOrder) => {
      gasRequired += this.getGasRequired(singleOrder);
      requiredAssets = ChainUtils.sumAssetBalance(
        singleOrder.assets,
        requiredAssets
      );
    });
    // add fee
    requiredAssets = ChainUtils.sumAssetBalance(
      {
        nativeToken: gasRequired * gasPrice,
        tokens: [],
      },
      requiredAssets
    );

    if (!(await this.hasLockAddressEnoughAssets(requiredAssets))) {
      const neededETH = requiredAssets.nativeToken.toString();
      const neededTokens = JSONBigInt.stringify(requiredAssets.tokens);
      throw new NotEnoughAssetsError(
        `Locked assets cannot cover required assets. native: ${neededETH}, erc-20: ${neededTokens}`
      );
    }

    // Generate transactions
    let nonce = await this.network.getAddressNextAvailableNonce(
      this.configs.addresses.lock
    );
    const maxPriorityFeePerGas = await this.network.getMaxPriorityFeePerGas();
    const evmTrxs: Array<PaymentTransaction> = [];
    orders.forEach((singleOrder) => {
      let trx;
      if (singleOrder.assets.nativeToken !== 0n) {
        trx = Transaction.from({
          type: 2,
          to: singleOrder.address,
          nonce: nonce,
          gasLimit: gasRequired,
          maxPriorityFeePerGas: maxPriorityFeePerGas,
          maxFeePerGas: gasPrice,
          data: '0x' + eventId,
          value: singleOrder.assets.nativeToken,
          chainId: this.CHAIN_ID,
        });
      } else {
        const token = singleOrder.assets.tokens[0];
        const data = EvmUtils.encodeTransferCallData(
          token.id,
          singleOrder.address,
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
        });
      }
      evmTrxs.push(
        new PaymentTransaction(
          this.CHAIN,
          trx.unsignedHash,
          eventId,
          Serializer.serialize(trx),
          txType
        )
      );
      this.logger.info(
        `${this.CHAIN} transaction [${trx.hash}] as type [${txType}] generated for event [${eventId}]`
      );
      nonce += 1;
    });

    return evmTrxs;
  };

  /**
   * gets gas required to do the transfer.
   * @param payment the SinglePayment to be made
   * @returns gas required in bigint
   */
  getGasRequired = (payment: SinglePayment): bigint => {
    let res = 0n;
    if (payment.assets.nativeToken !== 0n) {
      res = this.network.getGasRequiredNativeTransfer(payment.address);
    }

    payment.assets.tokens.forEach((token) => {
      res += this.network.getGasRequiredERC20Transfer(
        token.id,
        payment.address,
        token.value
      );
    });
    return res;
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

    if (tx.to === null) {
      throw new TransactionFormatError(
        `Transaction [${transaction.txId}] does not have \`to\``
      );
    }

    if (tx.type !== 2) {
      throw new TransactionFormatError(
        `Transaction [${transaction.txId}] is not of type 2`
      );
    }

    if (tx.maxFeePerGas === null) {
      throw new ImpossibleBehavior(
        'Type 2 transaction can not have null maxFeePerGas'
      );
    }

    const assets: AssetBalance = {
      nativeToken: 0n,
      tokens: [],
    };

    const networkFee = tx.maxFeePerGas * tx.gasLimit;
    assets.nativeToken = tx.value + networkFee;

    if (EvmUtils.isTransfer(tx.to, tx.data)) {
      const [_, amount] = EvmUtils.decodeTransferCallData(tx.to, tx.data);
      assets.tokens.push({
        id: tx.to.toLowerCase(),
        value: amount,
      });
    }

    // no need to calculate outputAssets separately, they are always equal in account-based
    return {
      inputAssets: assets,
      outputAssets: structuredClone(assets),
    };
  };

  /**
   * extracts payment order of a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns the transaction payment order (list of single payments)
   */
  extractTransactionOrder = (transaction: PaymentTransaction): PaymentOrder => {
    const tx = Serializer.deserialize(transaction.txBytes);

    if (tx.to === null) {
      throw new TransactionFormatError(
        `Transaction [${transaction.txId}] does not have \`to\``
      );
    }

    const payment: PaymentOrder = [];
    // native-token transfer
    if (tx.value !== 0n) {
      payment[0] = {
        address: tx.to.toLowerCase(),
        assets: {
          nativeToken: tx.value,
          tokens: [],
        },
      };
    }

    if (EvmUtils.isTransfer(tx.to, tx.data)) {
      // erc-20 transfer
      const [to, amount] = EvmUtils.decodeTransferCallData(tx.to, tx.data);
      if (amount !== 0n) {
        if (payment.length === 1 && to.toLowerCase() === tx.to.toLowerCase()) {
          payment[0].assets.tokens = [
            {
              id: to.toLowerCase(),
              value: amount,
            },
          ];
        } else {
          payment.push({
            address: to.toLowerCase(),
            assets: {
              nativeToken: 0n,
              tokens: [
                {
                  id: tx.to.toLowerCase(),
                  value: amount,
                },
              ],
            },
          });
        }
      }
    }
    return payment;
  };

  /**
   * verifies transaction fee for a PaymentTransaction
   * - `to` shouldn't be null
   * - transaction must of of type 2
   * - gasLimit must be as expected
   * - maxFeePerGas shouldn't be different than current network condition by more than slippage
   * - maxPriorityFeePerGas shouldn't be different than current network condition by more than slippage
   * @param transaction the PaymentTransaction
   * @returns true if the transaction fee is verified
   */
  verifyTransactionFee = async (
    transaction: PaymentTransaction
  ): Promise<boolean> => {
    let tx: Transaction;
    try {
      tx = Serializer.deserialize(transaction.txBytes);
    } catch (error) {
      this.logger.debug(`Tx [${transaction.txId}] invalid: ${error}`);
      return false;
    }

    if (tx.to === null) {
      this.logger.debug(
        `Tx [${transaction.txId}] invalid: does not have \`to\``
      );
      return false;
    }

    if (tx.type !== 2) {
      this.logger.debug(`Tx [${transaction.txId}] invalid: is not of type 2`);
      return false;
    }

    if (tx.maxFeePerGas === null) {
      throw new ImpossibleBehavior(
        "Type 2 transaction can't have null maxFeePerGas"
      );
    }

    if (tx.maxPriorityFeePerGas === null) {
      throw new ImpossibleBehavior(
        "Type 2 transaction can't have null maxPriorityFeePerGas"
      );
    }

    // check gas limit
    let gasRequired = 0n;
    if (EvmUtils.isTransfer(tx.to, tx.data)) {
      const [to, amount] = EvmUtils.decodeTransferCallData(tx.to, tx.data);
      gasRequired = this.network.getGasRequiredERC20Transfer(tx.to, to, amount);
    }
    if (tx.value !== 0n) {
      gasRequired += this.network.getGasRequiredNativeTransfer(tx.to);
    }

    if (tx.gasLimit !== gasRequired) {
      this.logger.debug(
        `Tx [${transaction.txId}] invalid: Transaction gasLimit [${tx.gasLimit}] is more than maximum required [${gasRequired}]`
      );
      return false;
    }

    // check fees
    const networkMaxFee = await this.network.getMaxFeePerGas();
    const feeSlippage =
      (networkMaxFee * BigInt(this.configs.feeSlippage)) / 100n;
    if (
      tx.maxFeePerGas - networkMaxFee > feeSlippage ||
      networkMaxFee - tx.maxFeePerGas > feeSlippage
    ) {
      this.logger.debug(
        `Tx [${
          transaction.txId
        }] invalid: Transaction max fee [${tx.maxFeePerGas!}]
         is too far from network's max fee [${networkMaxFee}]`
      );
      return false;
    }

    const networkMaxPriorityFee = await this.network.getMaxPriorityFeePerGas();
    const priorityFeeSlippage =
      (networkMaxPriorityFee * BigInt(this.configs.feeSlippage)) / 100n;
    if (
      tx.maxPriorityFeePerGas - networkMaxPriorityFee > priorityFeeSlippage ||
      networkMaxPriorityFee - tx.maxPriorityFeePerGas > priorityFeeSlippage
    ) {
      this.logger.debug(
        `Tx [${transaction.txId}] invalid: Transaction max priority fee [${tx.maxPriorityFeePerGas}]
         is too far from network's max priority fee [${networkMaxPriorityFee}]`
      );
      return false;
    }
    return true;
  };

  /**
   * checks if a transaction is still valid and can be sent to the network
   * - transaction's nonce should be still available
   * @param transaction the transaction
   * @param signingStatus
   * @returns true if the transaction is still valid
   */
  isTxValid = async (
    transaction: PaymentTransaction,
    signingStatus: SigningStatus
  ): Promise<boolean> => {
    let trx: Transaction;

    try {
      if (signingStatus === SigningStatus.Signed) {
        trx = Serializer.signedDeserialize(transaction.txBytes);
      } else {
        trx = Serializer.deserialize(transaction.txBytes);
      }
    } catch (error) {
      this.logger.debug(`Tx [${transaction.txId}] invalid: ${error}`);
      return false;
    }

    // check the nonce wasn't increased
    const nextNonce = await this.network.getAddressNextAvailableNonce(
      this.configs.addresses.lock
    );
    if (nextNonce > trx.nonce) {
      this.logger.debug(
        `Tx [${transaction.txId}] invalid: Transaction's nonce ${trx.nonce} is not available anymore 
        according to address's current nonce ${nextNonce}`
      );
      return false;
    }

    return true;
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
   * checks the following conditions before:
   * - transaction must of of type 2
   * - fees are set appropriately according to the current network's condition
   * - lock address stil have enough funds
   * @param transaction the transaction
   */
  submitTransaction = async (
    transaction: PaymentTransaction
  ): Promise<void> => {
    // deserialize transaction
    let tx: Transaction;
    try {
      tx = Serializer.signedDeserialize(transaction.txBytes);
    } catch (error) {
      this.logger.debug(`Tx [${transaction.txId}] invalid: ${error}`);
      return;
    }

    // check type
    if (tx.type !== 2) {
      this.logger.warn(
        `Cannot submit transaction [${transaction.txId}]: Transaction is not of type 2`
      );
      return;
    }

    if (tx.maxFeePerGas === null) {
      throw new ImpossibleBehavior(
        'Type 2 transaction can not have null maxFeePerGas'
      );
    }

    if (tx.maxPriorityFeePerGas === null) {
      throw new ImpossibleBehavior(
        'Type 2 transaction can not have null maxPriorityFeePerGas'
      );
    }

    // check fees
    const networkMaxFee = await this.network.getMaxFeePerGas();
    if (tx.maxFeePerGas < networkMaxFee) {
      this.logger.warn(
        `Cannot submit transaction [${transaction.txId}]: 
        Transaction max fee per gas [${tx.maxFeePerGas}]
        is less than network's max fee per gas [${networkMaxFee}]`
      );
      return;
    }

    const networkMaxPriorityFee = await this.network.getMaxPriorityFeePerGas();
    if (tx.maxPriorityFeePerGas < networkMaxPriorityFee) {
      this.logger.warn(
        `Cannot submit transaction [${transaction.txId}]:: 
        Transaction max priority fee per gas [${tx.maxPriorityFeePerGas}]
        is less than network's max priority fee per gas [${networkMaxPriorityFee!}]`
      );
      return;
    }

    // check lock still has enough assets
    const txAssets = await this.getTransactionAssets(transaction);
    if (!(await this.hasLockAddressEnoughAssets(txAssets.inputAssets))) {
      this.logger.warn(
        `Cannot submit transaction [${transaction.txId}]: 
        Locked assets cannot cover transaction assets: ${JSONBigInt.stringify(
          txAssets.inputAssets
        )}`
      );
      return;
    }

    // send transaction
    try {
      const response = await this.network.submitTransaction(tx);
      this.logger.info(
        `${this.CHAIN} Transaction [${transaction.txId}] submitted. Response: ${response}`
      );
    } catch (e) {
      this.logger.warn(
        `An error occurred while submitting ${this.CHAIN} transaction [${transaction.txId}]: ${e}`
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
      this.CHAIN,
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
      this.CHAIN,
      trx.unsignedHash,
      '',
      Serializer.serialize(trx),
      TransactionType.manual
    );

    this.logger.info(
      `Parsed ${this.CHAIN} transaction [${trx.unsignedHash}] successfully`
    );
    return evmTx;
  };

  /**
   * verifies additional conditions for a PaymentTransaction
   * - `to` shouldn't be null
   * - `data` shouldn't be null
   * - transaction must be of type 2
   * - `data` length must be either:
   *     native-token transfer: 2 (0x) + eventId.length
   *     erc-20 transfer: 2 (0x) + 136 (`transfer` data) + eventId.length
   * - eventId must be at the end of the `data`
   * - multiple payments are not allowed in one transaction
   * - in case of erc-20 transfer, `data` must be appropriately parsed with the `transfer` ABI
   * @param transaction the PaymentTransaction
   * @returns true if the transaction is verified
   */
  verifyTransactionExtraConditions = (
    transaction: PaymentTransaction
  ): boolean => {
    const tx = Serializer.deserialize(transaction.txBytes);

    if (tx.to === null) {
      this.logger.debug(`Tx [${transaction.txId}] is invalid. \`to\` is null`);
      return false;
    }

    if (tx.data === null) {
      throw new ImpossibleBehavior('Transaction `data` can not be null');
    }

    const eidlen = transaction.eventId.length;

    // only type 2 transactions are allowed
    if (tx.type !== 2) {
      this.logger.debug(
        `Tx [${transaction.txId}] is invalid. It is not of type 2`
      );
      return false;
    }

    // tx data must have correct length
    if (![eidlen + 2, eidlen + 2 + 136].includes(tx.data.length)) {
      this.logger.debug(
        `Tx [${transaction.txId}] is invalid. Unexpected \`data\` bytes length [${tx.data.length}]`
      );
      return false;
    }

    // eventId must be at the end of `data`
    const eventId = tx.data.substring(tx.data.length - eidlen);
    if (eventId !== transaction.eventId) {
      this.logger.debug(
        `Tx [${transaction.txId}] is invalid. Encoded eventId [${eventId}] does 
        not match with the expected one [${transaction.eventId}]`
      );
      return false;
    }

    // must be a single payment
    if (
      (tx.value === 0n && tx.data.length === eidlen + 2) ||
      (tx.value !== 0n && tx.data.length === 136 + eidlen + 2)
    ) {
      this.logger.debug(
        `Tx [${transaction.txId}] is invalid. It both transfers native-token and has extra data.`
      );
      return false;
    }

    // only erc-20 `transfer` is allowed
    if (tx.value === 0n) {
      if (!EvmUtils.isTransfer(tx.to, tx.data)) {
        this.logger.debug(
          `Tx [${transaction.txId}] is invalid. \`data\` field [${tx.data}] can not be parsed with 'transfer' ABI.`
        );
        return false;
      }
    }

    return true;
  };

  /**
   * verifies additional conditions for a event lock transaction
   * @param transaction the lock transaction
   * @param blockInfo
   * @returns true if the transaction is verified
   */
  verifyLockTransactionExtraConditions = (
    transaction: Transaction,
    blockInfo: BlockInfo
  ): boolean => {
    return true;
  };

  /**
   * serializes the transaction of this chain into string
   */
  protected serializeTx = (tx: Transaction): string => tx.toJSON();
}

export default EvmChain;
