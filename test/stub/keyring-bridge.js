import { ecsign } from '@ethereumjs/util';

// BIP32 Public Key: xpub6ELgkkwgfoky9h9fFu4Auvx6oHvJ6XfwiS1NE616fe9Uf4H3JHtLGjCePVkb6RFcyDCqVvjXhNXbDNDqs6Kjoxw7pTAeP1GSEiLHmA5wYa9
// BIP32 Private Key: xprvA1MLMFQnqSCfwD5C9sXAYo1NFG5oh4x6MD5mRhbV7JcVnFwtkka5ivtAYDYJsr9GS242p3QZMbsMZC1GZ2uskNeTj9VhYxrCqRG6U5UPXp5
export const KNOWN_PUBLIC_KEY =
  '03752603a8131fd03fe726434e82a181c3a6bc227a44660ab774a482d29d1172c3';

export const CHAIN_CODE =
  '2b73df9ce5df820c728c8f77d51a72ec578e25c6a3c5e32b65fd43d2b4fb0e63';

export const KNOWN_PUBLIC_KEY_ADDRESSES = [
  {
    address: '0xf68464152d7289d7ea9a2bec2e0035c45188223c',
    balance: null,
    index: 0,
  },
  {
    address: '0x9ee70472c9d1b1679a33f2f0549ab5bffce118ef',
    balance: null,
    index: 1,
  },
  {
    address: '0x3185ac9266d3df3d95dc847e2b88b52f12a34c21',
    balance: null,
    index: 2,
  },
  {
    address: '0x49eed7a86c1c404e2666ac12bf00af63804ac78d',
    balance: null,
    index: 3,
  },
  {
    address: '0x1d374341febd02c2f30929d2b4a767676799e1f2',
    balance: null,
    index: 4,
  },
];

export const KNOWN_PRIVATE_KEYS = [
  'd41051826c32a548e55aa3e0dee93e96425b0f355df1e06d1595ed69385f8dc3',
  '780f45733fe48f03ab993b071a11e77147ca959d417e048c7da5ac06b8283e51',
  'daf3144f471e0531e5efd6e81b4907a4154fec5fdb53cf4f94c4b4195e6473fb',
  '841f90906439526b3771c0aa51f93f6aae5c5ee0fdc73d0d8ff7f8a9b28754d7',
  '7df6c85f059939631c05e72b6fc3c54423754a5162ae4a69b14b38219c430665',
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
          chainCode: CHAIN_CODE,
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
        chainCode: CHAIN_CODE,
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

  async deviceSignTransaction({ tx }) {
    return ecsign(tx, Buffer.from(KNOWN_PRIVATE_KEYS[0], 'hex'));
  }
}
