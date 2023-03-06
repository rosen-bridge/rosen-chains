interface CoveringBoxes {
  covered: boolean;
  boxes: string[];
}

interface TokenInfo {
  id: string;
  value: bigint;
}

interface AssetBalance {
  nativeToken: bigint;
  tokens: TokenInfo[];
}

interface BoxInfo {
  id: string;
  assets: AssetBalance;
}

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
  WIDs: string[];

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

  /**
   * signs the json data alongside guardId
   * @param creatorId id of the creator guard
   * @return signature
   */
  signMetadata: (creatorId: number) => string;

  /**
   * verifies the signature over json data alongside guardId
   * @param signerId id of the signer guard
   * @param msgSignature hex string signature over json data alongside guardId
   * @return true if signature verified
   */
  verifyMetadataSignature: (signerId: number, msgSignature: string) => boolean;
}

enum ConfirmationStatus {
  ConfirmedEnough,
  NotConfirmedEnough,
  NotFound,
}

export {
  CoveringBoxes,
  TokenInfo,
  AssetBalance,
  BoxInfo,
  EventTriggerModel,
  PaymentTransactionModel,
  ConfirmationStatus,
};
