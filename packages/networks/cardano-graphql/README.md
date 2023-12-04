# @rosen-chains/cardano-graphql-network

## Table of contents

- [Introduction](#introduction)
- [Installation](#installation)

## Introduction

`@rosen-chains/cardano-graphql-network` is a package to be used as network api provider for `@rosen-chains/cardano` package

## Installation

npm:

```sh
npm i @rosen-chains/cardano-graphql-network
```

yarn:

```sh
yarn add @rosen-chains/cardano-graphql-network
```

## Usage

```ts
import CardanoGraphQLNetwork from '@rosen-chains/cardano-graphql-network';

let tokens: RosenTokens;
const cardanoGraphQLNetwork = new CardanoGraphQLNetwork(
  'GRAPHQL_URL', // graphql url
  'lockAddress', // bridge lock address in Cardano (used in CardanoRosenExtractor)
  tokens // bridge supported tokens config, provided by `rosen-bridge/contract`
);

const height = await cardanoGraphQLNetwork.getHeight();
```
