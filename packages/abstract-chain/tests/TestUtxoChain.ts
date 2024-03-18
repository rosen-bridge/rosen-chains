import { AbstractUtxoChain, BoxInfo } from '../lib';
import TestRosenDataExtractor from './TestRosenDataExtractor';

class TestUtxoChain extends AbstractUtxoChain<string, string> {
  protected CHAIN = 'test-utxo';
  protected extractor = new TestRosenDataExtractor();

  notImplemented = () => {
    throw Error('Not implemented');
  };

  generateMultipleTransactions = this.notImplemented;
  getTransactionAssets = this.notImplemented;
  extractTransactionOrder = this.notImplemented;
  verifyTransactionFee = this.notImplemented;
  verifyTransactionExtraConditions = this.notImplemented;
  verifyEvent = this.notImplemented;
  isTxValid = this.notImplemented;
  signTransaction = this.notImplemented;
  getLockAddressAssets = this.notImplemented;
  submitTransaction = this.notImplemented;
  isTxInMempool = this.notImplemented;
  getMempoolBoxMapping = this.notImplemented;
  getMinimumNativeToken = this.notImplemented;
  PaymentTransactionFromJson = this.notImplemented;
  rawTxToPaymentTransaction = this.notImplemented;

  getBoxInfo = (box: string): BoxInfo => {
    throw Error('Not mocked');
  };

  serializeTx = (tx: string) => tx;
}

export default TestUtxoChain;
