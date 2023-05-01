interface ChainConfigs {
  fee: bigint;
  observationTxConfirmation: number;
  paymentTxConfirmation: number;
  coldTxConfirmation: number;
  lockAddress: string;
  coldStorageAddress: string;
  rwtId: string;
}

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

interface EventTrigger {
  height: number;
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
  sourceChainHeight: number;
  sourceBlockId: string;
  WIDs: Array<string>;
}

interface PaymentTransaction {
  network: string;
  txId: string;
  eventId: string;
  txBytes: Uint8Array;
  txType: string;
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
  static lock = 'lock';
}

export {
  ChainConfigs,
  CoveringBoxes,
  TokenInfo,
  AssetBalance,
  TransactionAssetBalance,
  BoxInfo,
  SinglePayment,
  PaymentOrder,
  EventTrigger,
  PaymentTransaction,
  PaymentTransactionJsonModel,
  ConfirmationStatus,
  TransactionTypes,
};
