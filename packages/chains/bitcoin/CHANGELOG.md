# @rosen-chains/bitcoin

## 0.0.0-0deef57b

### Patch Changes

- Updated dependencies
  - @rosen-chains/abstract-chain@0.0.0-0deef57b

## 5.1.0

### Minor Changes

- remove legacy and script address payment restrictions in BitcoinChain
- set minimum satoshi to 546

## 5.0.2

### Patch Changes

- improve logs
- update rosen-extractor version
- Updated dependencies
  - @rosen-chains/abstract-chain@9.0.2

## 5.0.1

### Patch Changes

- update rosen-extractor version
- Updated dependencies
  - @rosen-chains/abstract-chain@9.0.1

## 5.0.0

### Major Changes

- change `verifyLockTransactionExtraConditions` to async
- add reason and expectation status to isTxValid result

### Patch Changes

- Updated dependencies
  - @rosen-chains/abstract-chain@9.0.0

## 4.0.0

### Major Changes

- consider decimals drop
- change `getBoxInfo` and `getCoveringBoxes` functions to protected

### Patch Changes

- export bitcoin native token id var
- add NATIVE_TOKEN_ID variable to BitcoinChain
- Updated dependencies
  - @rosen-chains/abstract-chain@8.0.0

## 3.0.1

### Patch Changes

- update rosen-extractor
- Updated dependencies
  - @rosen-chains/abstract-chain@7.0.2

## 3.0.0

### Major Changes

- update rosen-extractor (change fromAddress to first input box ID)

### Patch Changes

- Updated dependencies
  - @rosen-chains/abstract-chain@7.0.1

## 2.0.0

### Major Changes

- update minimum-fee to v1 and remove feeRatioDivisor from constructor

### Patch Changes

- Updated dependencies
  - @rosen-chains/abstract-chain@7.0.0

## 1.0.0

### Major Changes

- init rosen-extractor in chain and remove it from its network
- add signatureRecovery to return data of required signFunction

### Minor Changes

- change generateTransaction to generateMultipleTransaction due to its update in AbstractChain

### Patch Changes

- Updated rosen-extractor version
- Updated dependencies
  - @rosen-chains/abstract-chain@6.0.0
