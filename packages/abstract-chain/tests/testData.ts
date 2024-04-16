import { EventTrigger } from '../lib';

export const paymentTxConfirmation = 6;

export const validEvent: EventTrigger = {
  height: 300,
  fromChain: 'test',
  toChain: 'chain-2',
  fromAddress: 'fromAddress',
  toAddress: 'toAddress',
  amount: '1000000',
  bridgeFee: '1000',
  networkFee: '5000',
  sourceChainTokenId: 'sourceTokenId',
  targetChainTokenId: 'targetTokenId',
  sourceTxId:
    '6e3dbf41a8e3dbf41a8cd0fe059a54cef8bb140322503d0555a9851f056825bc',
  sourceChainHeight: 1000,
  sourceBlockId:
    '01a33c00accaa91ebe0c946bffe1ec294280a3a51a90f7f4b011f3f37c29c5ed',
  WIDsHash: 'bb2b2272816e1e9993fc535c0cf57c668f5cd39c67cfcd55b4422b1aa87cd0c3',
  WIDsCount: 2,
};

export const invalidEvent: EventTrigger = {
  height: 300,
  fromChain: 'test',
  toChain: 'chain-2',
  fromAddress: 'fromAddress',
  toAddress: 'toAddress',
  amount: '5500',
  bridgeFee: '1000',
  networkFee: '5000',
  sourceChainTokenId: 'sourceTokenId',
  targetChainTokenId: 'targetTokenId',
  sourceTxId:
    '6e3dbf41a8e3dbf41a8cd0fe059a54cef8bb140322503d0555a9851f056825bc',
  sourceChainHeight: 1000,
  sourceBlockId:
    '01a33c00accaa91ebe0c946bffe1ec294280a3a51a90f7f4b011f3f37c29c5ed',
  WIDsHash: 'bb2b2272816e1e9993fc535c0cf57c668f5cd39c67cfcd55b4422b1aa87cd0c3',
  WIDsCount: 2,
};

export const validEventWithHighFee: EventTrigger = {
  height: 300,
  fromChain: 'test',
  toChain: 'chain-2',
  fromAddress: 'fromAddress',
  toAddress: 'toAddress',
  amount: '1000000',
  bridgeFee: '1000',
  networkFee: '900000',
  sourceChainTokenId: 'sourceTokenId',
  targetChainTokenId: 'targetTokenId',
  sourceTxId:
    '6e3dbf41a8e3dbf41a8cd0fe059a54cef8bb140322503d0555a9851f056825bc',
  sourceChainHeight: 1000,
  sourceBlockId:
    '01a33c00accaa91ebe0c946bffe1ec294280a3a51a90f7f4b011f3f37c29c5ed',
  WIDsHash: 'bb2b2272816e1e9993fc535c0cf57c668f5cd39c67cfcd55b4422b1aa87cd0c3',
  WIDsCount: 2,
};
