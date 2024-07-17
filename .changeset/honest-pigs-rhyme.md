---
'@rosen-chains/abstract-chain': major
---

- add abstract NATIVE_TOKEN_ID variable
- add RosenTokens to constructor arguments
- consider decimals drop
  - every function of `AbstractChain` and `AbstractUtxoChain` gets and returns the wrapped values
  - network functions (functions of `AbstractChainNetwork` and `AbstractUtxoChainNetwork`) should still return **the actual values**
