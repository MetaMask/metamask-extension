export const KNOWN_PUBLIC_KEY =
  '02065bc80d3d12b3688e4ad5ab1e9eda6adf24aec2518bfc21b87c99d4c5077ab0';

export const KNOWN_PUBLIC_KEY_ADDRESSES = [
  {
    address: '0x0e122670701207DB7c6d7ba9aE07868a4572dB3f',
    balance: null,
    index: 0,
  },
  {
    address: '0x2ae19DAd8b2569F7Bb4606D951Cc9495631e818E',
    balance: null,
    index: 1,
  },
  {
    address: '0x0051140bAaDC3E9AC92A4a90D18Bb6760c87e7ac',
    balance: null,
    index: 2,
  },
  {
    address: '0x9DBCF67CC721dBd8Df28D7A0CbA0fa9b0aFc6472',
    balance: null,
    index: 3,
  },
  {
    address: '0x828B2c51c5C1bB0c57fCD2C108857212c95903DE',
    balance: null,
    index: 4,
  },
];

export class FakeKeyringBridge {
  #publicKeyPayload;

  constructor({ publicKeyPayload }) {
    this.#publicKeyPayload = publicKeyPayload;
  }

  async init() {
    return Promise.resolve();
  }

  async getPublicKey() {
    return this.#publicKeyPayload;
  }
}

export class FakeTrezorBridge extends FakeKeyringBridge {
  constructor() {
    super({
      publicKeyPayload: {
        success: true,
        payload: {
          publicKey: KNOWN_PUBLIC_KEY,
          chainCode: '0x1',
        },
      },
    });
  }

  async dispose() {
    return Promise.resolve();
  }
}

export class FakeLedgerBridge extends FakeKeyringBridge {
  constructor() {
    super({
      publicKeyPayload: {
        publicKey: KNOWN_PUBLIC_KEY,
        chainCode: '0x1',
      },
    });
  }

  async destroy() {
    return Promise.resolve();
  }

  updateTransportMethod() {
    return true;
  }
}
