# @rosen-chains/evm

## 4.0.0

### Major Changes

- add gasLimitCap to EvmConfigs (the cap is used in tx generation and fee verification when required gas is too high)

## 3.0.0

### Major Changes

- add chain name and native token id to constructor to fix extractor intialization
- add getAddressTransactionByNonce to AbstractEvmNetwork

### Patch Changes

- fix tx serialization for rosen-extractor
- update rosen-extractor version
- improve isTxValid to not invalid the tx when tx is not found
- Updated dependencies
  - @rosen-chains/abstract-chain@9.0.1

## 2.0.1

### Patch Changes

- fix signTransaction

## 2.0.0

### Major Changes

- consider transaction failure
- change `verifyLockTransactionExtraConditions` to async
- add reason and expectation status to isTxValid result

### Patch Changes

- Updated dependencies
  - @rosen-chains/abstract-chain@9.0.0

## 1.0.0

### Major Changes

- consider decimals drop

### Patch Changes

- Updated dependencies
  - @rosen-chains/abstract-chain@8.0.0

## 0.1.3

### Patch Changes

- update rosen-extractor
- Updated dependencies
  - @rosen-chains/abstract-chain@7.0.2

## 0.1.2

### Patch Changes

- update rosen-extractor version
- Updated dependencies
  - @rosen-chains/abstract-chain@7.0.1
