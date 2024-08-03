# @rosen-chains/abstract-chain

## 0.0.0-9729309a

### Major Changes

- change `verifyLockTransactionExtraConditions` to async
- add reason and expectation status to isTxValid result

## 8.0.0

### Major Changes

- add abstract NATIVE_TOKEN_ID variable
- add RosenTokens to constructor arguments
- consider decimals drop
  - every function of `AbstractChain` and `AbstractUtxoChain` gets and returns the wrapped values
  - network functions (functions of `AbstractChainNetwork` and `AbstractUtxoChainNetwork`) should still return **the actual values**
- change `getBoxInfo` and `getCoveringBoxes` functions to protected

## 7.0.2

### Patch Changes

- update rosen-extractor and minimum-fee packages

## 7.0.1

### Patch Changes

- update rosen-extractor version

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
