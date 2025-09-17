# @rosen-chains/bitcoin-runes

## 1.0.1

### Patch Changes

- Update rosen-extractor to 9.0.0
- Fix bug on transaction generation where Runes boxes can also cover the required BTC
- Improve box selection to forbid selected boxes to avoid duplicate input in case of unexpected behavior from Unisat APIs
- Update dependencies
  - @rosen-chains/abstract-chain@14.0.2
  - @rosen-chains/bitcoin@8.1.2

## 1.0.0

### Major Changes

- Add abstract `getAddressRunesBoxes`, `getAddressBtcBoxes` and `getRemainingBoxes` functions to `AbstractBitcoinRunesNetwork`
- Implement `AbstractBitcoinRunesNetwork.getAddressBoxes` function to throw error (this function should not be used)
- Replace abstract `getMempoolTxIds` function with abstract `isTxInMempool` function in `AbstractBitcoinRunesNetwork`

### Minor Changes

- Re-export `CONFIRMATION_TARGET` constant from `@rosen-chains/bitcoin`

### Patch Changes

- Revamp `BitcoinRunesChain.generateMultipleTransactions` to get address boxes by selecting Runes boxes first and then selecting other boxes to cover required BTC
- Update Rosen utility packages
- Update dependencies
  - @rosen-chains/abstract-chain@14.0.1
  - @rosen-chains/bitcoin@8.1.1
