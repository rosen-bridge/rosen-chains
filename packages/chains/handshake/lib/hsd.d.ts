declare module 'hsd' {
  export class MTX {
    inputs: Input[];
    outputs: Output[];
    version: number;
    locktime: number;
    view: CoinView;

    constructor();
    addCoin(coin: Coin): void;
    addOutput(options: { address: Address; value: number }): void;
    txid(): string;
    signatureHash(
      index: number,
      prev: Script,
      value: number,
      type: number,
    ): Buffer;
    toRaw(): Buffer;
    static fromRaw(data: Buffer): MTX;
  }

  export class TX {
    inputs: Input[];
    outputs: Output[];
    static fromRaw(data: Buffer): TX;
  }

  export class Input {
    prevout: Outpoint;
    witness: Witness;

    constructor();
  }

  export class Output {
    value: number;
    getAddress(): Address | null;
  }

  export class Outpoint {
    hash: Buffer;
    index: number;
    rhash(): string;
    txid(): string;
  }

  export class Witness {
    fromStack(stack: Buffer[]): void;
  }

  export class Address {
    version: number;
    hash: Buffer;

    static fromString(address: string): Address;
    toString(): string;
    getHash(): Buffer;
  }

  export class Script {
    constructor();
    pushData(data: Buffer): void;
    compile(): void;
    toStack(): Buffer[];

    static fromPubkeyhash(hash: Buffer): Script;
  }

  export class Coin {
    version: number;
    height: number;
    value: number;
    address: Address;
    coinbase: boolean;
    hash: Buffer;
    index: number;

    static fromJSON(options: {
      version: number;
      height: number;
      value: number;
      address: string;
      coinbase: boolean;
      hash: string;
      index: number;
    }): Coin;
  }

  export class CoinView {
    addCoin(coin: Coin): void;
  }
}
