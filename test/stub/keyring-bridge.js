export const KNOWN_PUBLIC_KEY =
  '02065bc80d3d12b3688e4ad5ab1e9eda6adf24aec2518bfc21b87c99d4c5077ab0';

export class FakeKeyringBridge {
  #publicKeyPayload;

  constructor({ publicKeyPayload }) {
    this.#publicKeyPayload = publicKeyPayload;
  }

  async init() {
    return Promise.resolve();
  }

  async dispose() {
    return Promise.resolve();
  }

  async destroy() {
    return Promise.resolve();
  }

  updateTransportMethod() {
    return true;
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
}
