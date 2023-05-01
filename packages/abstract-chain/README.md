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
// Abstract<chain_name>Network
class AbstractErgoNetwork extends AbstractUtxoChainNetwork {
  ...
}
```

After defining network class, a chain class should be implemented, inheriting `AbstractChain`
(or `AbstractUtxoChain` if the blockchain is UTxO-based) which implements all required functions.
The functions will be explained in the [Chain Class Document](#chain-class-document) section. Any required
actions found in this step which relates directly to blockchain network should be added to the
network class. Also `network` variable type should be declared as the network class type.

```typescript
// Ergo is an UTxO-based blockchain, so class inherits `AbstractUtxoChain`
// <chain_name>Chain
class ErgoChain extends AbstractUtxoChain {
  declare network: ErgoNetwork;

  ...
}
```

Note that implementing chain class is independent of implementing it's network class and only
defining it is required.

## Add New Network

Implementing a network class for a chain can proceed after an abstract network class is defined
for that chain. In order to implement a new network, a class inheriting the chain's network
class should be implemented. The functions will be explained in the
[Network Class Document](#network-class-document) section. Class name should contain both name of
the chain and source of data. For example, in case of Ergo chain and adding a network class to
communicate with Explorer, the class will be as follows:

```typescript
// <chain_name><data_source>Network
class ErgoExplorerNetwork extends ErgoNetwork {
  ...
}
```

Note that network class should be developed in a separate package, independent of the chain package.

## Chain Class Document

### `AbstractChain`

Required functions are as follows:

- `generatePaymentTransaction`
  - generates unsigned PaymentTransaction for payment order
  - **@param** `eventId` the id of event
  - **@param** `txType` transaction type
  - **@param** `order` the payment order (list of single payments)
  - **@param** `unsignedTransactions` ongoing unsigned PaymentTransactions which will be used to prevent double spend (gathered from database and guard TxAgreement process)
  - **@param** `serializedSignedTransactions` the serialized string of ongoing signed transactions which will be used to chain transactions (gathered from database and mempool)
  - **@returns** the generated PaymentTransaction
- `getTransactionAssets`
  - gets input and output assets of a PaymentTransaction
  - **@param** `transaction` the PaymentTransaction
  - **@returns** an object containing the amount of input and output assets
- `extractTransactionOrder`
  - extracts payment order of a PaymentTransaction
  - **@param** `transaction` the PaymentTransaction
  - **@returns** the transaction payment order (list of single payments)
- `verifyTransactionFee`
  - verifies transaction fee for a PaymentTransaction
  - **@param** `transaction` the PaymentTransaction
  - **@returns** true if the transaction fee verified
- `verifyNoTokenBurned`
  - verifies no token burned in a PaymentTransaction
  - **@param** `transaction` the PaymentTransaction
  - **@returns** true if not token burned
- `verifyTransactionExtraConditions`
  - verifies additional conditions for a PaymentTransaction
  - **@param** `transaction` the PaymentTransaction
  - **@returns** true if the transaction verified
  - **NOTE**: This function is implemented in AbstarctChain and will return true. In any chain
    that requires extra check to verify the transaction, this function should be overrided.
- `verifyEvent`
  - verifies an event data with its corresponding lock transaction
  - **@param** `event` the event trigger model
  - **@param** `eventSerializedBox` the serialized string of the event trigger box
  - **@param** `feeConfig` minimum fee and rsn ratio config for the event
  - **@returns** true if the event verified
- `isTxValid`
  - checks if a transaction is still valid and can be sent to the network
  - **@param** `transaction` the transaction
  - **@returns** true if the transaction is still valid
- `signTransaction`
  - requests the corresponding signer service to sign the transaction
  - **@param** `transaction` the transaction
  - **@param** `requiredSign` the required number of sign
  - **@param** `signFunction` the function to sign transaction (provided in guard process)
  - **@returns** the signed transaction
- `getTxConfirmationStatus`
  - extracts confirmation status for a transaction
  - **@param** `transactionId` the transaction id
  - **@param** `transactionType` type of the transaction
  - **@returns** the transaction confirmation status
- `getLockAddressAssets`
  - gets the amount of each asset in the lock address
  - **@returns** an object containing the amount of each asset
- `getHeight`
  - gets the blockchain height
  - **@returns** the blockchain height
  - **NOTE**: This function is implemented in AbstarctChain and will redirect request to
    network class `getHeight` function. If process is different in the chain, this function
    should be overrided.
- `submitTransaction`
  - submits a transaction to the blockchain
  - **@param** `transaction` the transaction
- `isTxInMempool`
  - checks if a transaction is in mempool (returns false if the chain has no mempool)
  - **@param** `transactionId` the transaction id
  - **@returns** true if the transaction is in mempool
- `hasLockAddressEnoughAssets`
  - checks if lock address assets are more than required assets or not
  - **@param** `required` required amount of assets
  - **@returns** true if lock assets are more than required assets
- `getMinimumNativeToken`
  - gets the minimum amount of native token for transferring asset
  - **@returns** the minimum amount

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
- `getBlockTransactionIds`
  - gets id of all transactions in the given block
  - **@param** `blockId` the block id
  - **@returns** list of the transaction ids in the block
- `getTransaction`
  - gets a transaction
  - **@param** `transactionId` the transaction id
  - **@param** `blockId` the block id
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
