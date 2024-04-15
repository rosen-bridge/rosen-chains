# @rosen-chains/abstract-chain

## 7.0.0

### Major Changes

- update minimum-fee to v1 and remove feeRatioDivisor from constructor

## 6.0.0

### Major Changes

- add generateMultipleTransactions to AbstractChain and implement generateTransaction
- implement verifyEvent and add verifyLockTransactionExtraConditions to be implemented in child classes

### Minor Changes

- Introduced new error types for EvmChain

### Patch Changes

- allow undefined extractor
- Updated rosen-extractor version

## 5.0.0

### Major Changes

- change verifyTransactionExtraConditions to abstract
  implement getRWTToken
  implement getTxConfirmationStatus
- change verifyTransactionFee to async

### Patch Changes

- update dependencies versions

## 4.0.0

### Major Changes

- update event trigger type according to latest version of contracts
