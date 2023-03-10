# Abstract Chain

## Contents

- [Description](#description)
- [Add New Chain](#add-new-chain)
- [Add New Network](#add-new-network)
- [Chain Class Document](#chain-class-document)
  - [`AbstractChain`](#abstractchain)
  - [`AbstractUtxoChain`](#abstractutxochain)
- [Network Class Document](#network-class-document)
  - [`AbstractChainNetwork`](#abstractchainnetwork)
  - [`AbstractUtxoChainNetwork`](#abstractutxochainnetwork)

## Description

Every blockchain supported by [guard-service](https://github.com/rosen-bridge/ts-guard-service)
in the bridge requires some actions which are defined in abstract classes and structures
in this project.

`AbstractChain` is an abstract class containing all actions required by guard-service to
support a blockchain in rosen-bridge. Each chain required some actions to communicate with
the blockchain APIs to get/send data from/to the blockchain. These actions are defined in
`AbstractChainNetwork` and a single object of it will be initiated in `AbstractChain` constructor.

As UTxO-based blockchains require some additional and common actions such as getting boxes
(UTxOs), `AbstractUtxoChain` and `AbstractUtxoChainNetwork` class are provided.

## Add New Chain

Implementing new chain to guard is done in two steps and is independent of implementing a
required network package.

the first step is to define an **abstract** network class inheriting `AbstractChain` (or
`AbstractUtxoChain` if the blockchain is UTxO-based). Based on the implementation of chain
class, some network functions may be added to this network class.

```typescript
// Ergo is an UTxO-based blockchain, so class inherits `AbstractUtxoChainNetwork`
class ErgoNetwork extends AbstractUtxoChainNetwork {
  ...
}
```

After defining network class, a chain class should be implemented, inheriting `AbstractChain`
(or `AbstractUtxoChain` if the blockchain is UTxO-based) which implements all required functions.
The functions will be explained in the [Class Document](#class-document) section. Any required
actions found in this step which relates directly to blockchain network should be added to the
network class. Also `network` variable type should be declared as the network class type.

```typescript
// Ergo is an UTxO-based blockchain, so class inherits `AbstractUtxoChain`
class ErgoChain extends AbstractUtxoChain {
  declare network: ErgoNetwork;

  ...
}
```

Note that implementing chain class is independent of implementing network class and only
defining the network class is required.

## Add New Network

Implementing a network class for a chain can proceed after an abstract network class is defined
for that chain. In order to implement a new network, a class inheriting the chain's network
class should be implemented. Class name should contain both name of the chain and source of
data. For example, in case of Ergo chain and adding a network class to communicate with Explorer,
the class will be as follows:

```typescript
class ErgoExplorerNetwork extends ErgoNetwork {
  ...
}
```

Note that network class should be developed in a separate package, independent of the chain package.

## Chain Class Document

### `AbstractChain`

Required functions are as follows:

- `generatePaymentTransaction`
  - generates unsigned payment transaction of the event using lock address
  - **@param** `event` the event trigger model
  - **@param** `feeConfig` minimum fee and rsn ratio config for the event
  - **@returns** the generated payment transaction
- `generateColdStorageTransaction`
  - generates unsigned transaction to transfer assets to cold storage
  - **@param** `transferringAssets` an object containing the amount of each asset to transfer
  - **@returns** the generated asset transfer transaction
- `verifyPaymentTransaction`
  - verifies a payment transaction for an event
  - **@param** `transaction` the payment transaction
  - **@param** `event` the event trigger model
  - **@param** `feeConfig ` minimum fee and rsn ratio config for the event
  - **@returns** the generated asset transfer transaction
- `verifyColdStorageTransaction`
  - verifies an asset transfer transaction
  - **@param** `transaction` the asset transfer transaction
  - **@returns** true if the transaction verified
- `verifyEvent`
  - verifies an event data with its corresponding lock transaction
  - **@param** `event` the event trigger model
  - **@param** `RwtId` the RWT token id in the event trigger box
  - **@returns** true if the event verified
- `isTxValid`
  - checks if a transaction is still valid and can be sent to the network
  - **@param** `transaction` the transaction
  - **@returns** true if the transaction is still valid
- `signTransaction`
  - requests the corresponding signer service to sign the transaction
  - **@param** `transaction` the transaction
  - **@returns** the signed transaction
- `getPaymentTxConfirmationStatus`
  - extracts confirmation status for a payment transaction
  - **@param** `transactionId` the payment transaction id
  - **@returns** the transaction confirmation status
- `getColdStorageTxConfirmationStatus`
  - extracts confirmation status for an asset transfer transaction
  - **@param** `transactionId` the asset transfer transaction id
  - **@returns** the transaction confirmation status
- `getLockAddressAssets`
  - gets the amount of each asset in the lock address
  - **@returns** an object containing the amount of each asset
- `getHeight`
  - gets the blockchain height
  - **@returns** the blockchain height
- `submitTransaction`
  - submits a transaction to the blockchain
  - **@param** `transaction` the transaction
- `isTxInMempool`
  - checks if a transaction is in mempool (returns false if the chain has no mempool)
  - **@param** `transactionId` the transaction id
  - **@returns** true if the transaction is in mempool

### `AbstractUtxoChain`

Required functions which only are needed in UTxO-based chains are as follows:

- `getMempoolBoxMapping`
  - generates mapping from input box id to serialized string of output box (filtered by address, containing the token)
  - **@param** `address` the address
  - **@param** `tokenId` the token id
  - **@returns** a Map from input box id to serialized string of output box
- `getBoxInfo`
  - extracts box id and assets of a box
  - **@param** `serializedBox` the serialized string of the box
  - **@returns** an object containing the box id and assets

## Network Class Document

### `AbstractChainNetwork`

Required functions are as follows:

- `getHeight`
  - gets the blockchain height
  - **@returns** the blockchain height
- `getTxConfirmation`
  - gets confirmation for a transaction
  - **@param** `transactionId` the transaction id
  - **@returns** the transaction confirmation
- `getAddressAssets`
  - gets the amount of each asset in an address
  - **@param** `address` the address
  - **@returns** an object containing the amount of each asset
- `getTransaction`
  - gets a transaction
  - **@param** `transactionId` the transaction id
  - **@returns** the serialized string of the transaction
- `submitTransaction`
  - submits a transaction
  - **@param** `transaction` the transaction
- `getMempoolTransactions`
  - gets all transactions in mempool (returns empty list if the chain has no mempool)
  - **@returns** list of serialized string of the transactions in mempool

### `AbstractUtxoChainNetwork`

Required functions which only are needed in UTxO-based chains are as follows:

- `getAddressBoxes`
  - gets confirmed and unspent boxes of an address
  - **@param** `address` the address
  - **@returns** list of serialized string of the boxes
- `isBoxUnspentAndValid`
  - extracts box id and assets of a box
  - **@param** `boxId` the box id
  - **@returns** true if the box is unspent and valid
