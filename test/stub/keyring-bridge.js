import { Transaction } from '@ethereumjs/tx';
import { bufferToHex } from 'ethereumjs-util';
import { addHexPrefix, Common } from './keyring-utils';

// BIP32 Public Key: xpub6ELgkkwgfoky9h9fFu4Auvx6oHvJ6XfwiS1NE616fe9Uf4H3JHtLGjCePVkb6RFcyDCqVvjXhNXbDNDqs6Kjoxw7pTAeP1GSEiLHmA5wYa9
// BIP32 Private Key: xprvA1MLMFQnqSCfwD5C9sXAYo1NFG5oh4x6MD5mRhbV7JcVnFwtkka5ivtAYDYJsr9GS242p3QZMbsMZC1GZ2uskNeTj9VhYxrCqRG6U5UPXp5
export const KNOWN_PUBLIC_KEY =
  '03752603a8131fd03fe726434e82a181c3a6bc227a44660ab774a482d29d1172c3';

export const CHAIN_CODE =
  '2b73df9ce5df820c728c8f77d51a72ec578e25c6a3c5e32b65fd43d2b4fb0e63';

export const KNOWN_PUBLIC_KEY_ADDRESSES = [
  {
    address: '0xF68464152d7289D7eA9a2bEC2E0035c45188223c',
    balance: null,
    index: 0,
  },
  {
    address: '0x9EE70472c9D1B1679A33f2f0549Ab5BFFCE118eF',
    balance: null,
    index: 1,
  },
  {
    address: '0x3185aC9266D3DF3D95dC847e2B88b52F12A34C21',
    balance: null,
    index: 2,
  },
  {
    address: '0x49EED7a86c1C404e2666Ac12BF00Af63804AC78d',
    balance: null,
    index: 3,
  },
  {
    address: '0x1d374341feBd02C2F30929d2B4a767676799E1f2',
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

  async ethereumSignTransaction({ transaction }) {
    const common = Common.custom({
      chain: {
        name: 'localhost',
        chainId: transaction.chainId,
        networkId: transaction.chainId,
      },
      chainId: transaction.chainId,
      hardfork: 'istanbul',
    });

    const signedTransaction = Transaction.fromTxData(transaction, {
      common,
    }).sign(Buffer.from(KNOWN_PRIVATE_KEYS[0], 'hex'));

    return {
      id: 1,
      success: true,
      payload: {
        v: signedTransaction.v,
        r: signedTransaction.r,
        s: signedTransaction.s,
        serializedTx: addHexPrefix(bufferToHex(signedTransaction.serialize())),
      },
    };
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
