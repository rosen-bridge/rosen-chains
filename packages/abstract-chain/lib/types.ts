interface CoveringBoxes {
  covered: boolean;
  boxes: Array<string>;
}

interface TokenInfo {
  id: string;
  value: bigint;
}

interface AssetBalance {
  nativeToken: bigint;
  tokens: Array<TokenInfo>;
}

interface TransactionAssetBalance {
  inputAssets: AssetBalance;
  outputAssets: AssetBalance;
}

interface BoxInfo {
  id: string;
  assets: AssetBalance;
}

interface SinglePayment {
  address: string;
  assets: AssetBalance;
  extra?: string;
}

type PaymentOrder = Array<SinglePayment>;

interface EventTriggerModel {
  fromChain: string;
  toChain: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  bridgeFee: string;
  networkFee: string;
  sourceChainTokenId: string;
  targetChainTokenId: string;
  sourceTxId: string;
  sourceBlockId: string;
  WIDs: Array<string>;

  /**
   * @return id of event trigger
   */
  getId: () => string;
}

interface PaymentTransactionModel {
  network: string;
  txId: string;
  eventId: string;
  txBytes: Uint8Array;
  txType: string;

  /**
   * @return transaction hex string
   */
  getTxHexString: () => string;
}

interface PaymentTransactionJsonModel {
  network: string;
  txId: string;
  eventId: string;
  txBytes: string;
  txType: string;
}

enum ConfirmationStatus {
  ConfirmedEnough,
  NotConfirmedEnough,
  NotFound,
}

class TransactionTypes {
  static payment = 'payment';
  static reward = 'reward';
  static coldStorage = 'cold-storage';
}

export {
  CoveringBoxes,
  TokenInfo,
  AssetBalance,
  TransactionAssetBalance,
  BoxInfo,
  SinglePayment,
  PaymentOrder,
  EventTriggerModel,
  PaymentTransactionModel,
  PaymentTransactionJsonModel,
  ConfirmationStatus,
  TransactionTypes,
};
