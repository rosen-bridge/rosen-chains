interface ConfirmationConfigs {
  observation: number;
  payment: number;
  cold: number;
  manual: number;
}
interface ChainConfigs {
  fee: bigint;
  confirmations: ConfirmationConfigs;
  lockAddress: string;
  coldStorageAddress: string;
  rwtId: string;
}

interface CoveringBoxes<BoxType> {
  covered: boolean;
  boxes: Array<BoxType>;
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

interface BlockInfo {
  hash: string;
  parentHash: string;
  height: number;
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

enum SigningStatus {
  Signed,
  UnSigned,
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
  static manual = 'manual';
}

export {
  ConfirmationConfigs,
  ChainConfigs,
  CoveringBoxes,
  TokenInfo,
  AssetBalance,
  TransactionAssetBalance,
  BoxInfo,
  BlockInfo,
  SinglePayment,
  PaymentOrder,
  EventTrigger,
  PaymentTransaction,
  PaymentTransactionJsonModel,
  ConfirmationStatus,
  TransactionTypes,
  SigningStatus,
};
