import LedgerHWAppEth from '@ledgerhq/hw-app-eth';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';

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

async function initEthApp() {
  const transport = await TransportWebHID.create();
  // const transport = {
  //   deviceModel: {
  //     id: 'DEVICE_ID',
  //   },
  //   send: () =>
  //     Promise.resolve(
  //       Buffer.from('0x0e122670701207DB7c6d7ba9aE07868a4572dB3f'),
  //       'hex',
  //     ),
  //   close: () => Promise.resolve(),
  //   decorateAppAPIMethods: () => Promise.resolve(),
  // };
  return new LedgerHWAppEth(transport);
}

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
          address: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
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
        address: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
      },
    });
  }

  async destroy() {
    return Promise.resolve();
  }

  updateTransportMethod() {
    return true;
  }

  async deviceSignTransaction(params) {
    const { hdPath, tx } = params;
    console.log('============> params', hdPath, tx);
    const ethApp = await initEthApp();
    const payload = ethApp.signTransaction(hdPath, tx);
    console.log('============> payload', payload);
    return Promise.resolve(payload);
  }
}
