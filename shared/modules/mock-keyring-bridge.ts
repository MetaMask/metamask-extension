import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

export class MockKeyringBridge {
  #privateKey;

  constructor() {
    this.#privateKey = generatePrivateKey();
  }

  async init() {
    return Promise.resolve();
  }

  async getPublicKey() {
    const account = privateKeyToAccount(this.#privateKey);
    return account.publicKey;
  }
}
