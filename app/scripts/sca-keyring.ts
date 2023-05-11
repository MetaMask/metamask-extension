import { TypedTransaction, TxData } from '@ethereumjs/tx';
import {
  ecsign,
  isValidAddress,
  isValidPrivate,
  stripHexPrefix,
  toBuffer,
} from '@ethereumjs/util';
import {
  concatSig,
  decrypt,
  getEncryptionPublicKey,
  normalize,
  personalSign,
  signTypedData,
  SignTypedDataVersion,
} from '@metamask/eth-sig-util';
import { add0x, Eip1024EncryptedData, Hex, Keyring } from '@metamask/utils';

type KeyringOpt = {
  withAppKeyOrigin?: string;
  version?: SignTypedDataVersion | string;
};

const TYPE = 'Smart Contract Account';

export class SCKeyring implements Keyring<string[]> {
  #wallets: { privateKey: Buffer; address: string }[];

  readonly type: string = TYPE;

  static type: string = TYPE;

  constructor(privateKey: string) {
    this.#wallets = [];

    /* istanbul ignore next: It's not possible to write a unit test for this, because a constructor isn't allowed
     * to be async. Jest can't await the constructor, and when the error gets thrown, Jest can't catch it. */
    this.deserialize([privateKey]).catch((error: Error) => {
      throw new Error(`Problem deserializing SimpleKeyring ${error.message}`);
    });
  }

  async serialize() {
    return this.#wallets.map(
      (wallet) => `${wallet.privateKey.toString('hex')},${wallet.address}`,
    );
  }

  async deserialize(privateKeys: string[]) {
    this.#wallets = privateKeys
      .map((pkAndAddress) => {
        const [hexPrivateKey, address] = pkAndAddress.split(',', 2);
        const privateKey = Buffer.from(stripHexPrefix(hexPrivateKey), 'hex');
        if (!isValidPrivate(privateKey)) {
          throw new Error('Invalid private key');
        }
        if (!isValidAddress(address)) {
          throw new Error(`Invalid address: ${address}`);
        }
        return { privateKey, address };
      })
      .filter((wallet) => wallet.address && wallet.privateKey);
    console.log('deserialize wallets:', this.#wallets);
  }

  async addAccounts(numAccounts = 1) {
    // FIXME: Add support for adding random accounts
    throw new Error('Adding accounts is not supported');
  }

  async getAccounts() {
    return this.#wallets.map(({ address }) => add0x(address));
  }

  async signTransaction(
    address: Hex,
    transaction: TypedTransaction,
    options?: Record<string, unknown>,
  ): Promise<TxData> {
    const privKey = this.#getPrivateKeyFor(address, options);
    const signedTx = transaction.sign(privKey);
    // Newer versions of Ethereumjs-tx are immutable and return a new tx object
    return signedTx === undefined ? transaction : signedTx;
  }

  // For eth_sign, we need to sign arbitrary data:
  async signMessage(
    address: Hex,
    data: string,
    opts = { withAppKeyOrigin: '' },
  ) {
    const message = stripHexPrefix(data);
    const privKey = this.#getPrivateKeyFor(address, opts);
    const msgSig = ecsign(Buffer.from(message, 'hex'), privKey);
    const rawMsgSig = concatSig(toBuffer(msgSig.v), msgSig.r, msgSig.s);
    return rawMsgSig;
  }

  // For personal_sign, we need to prefix the message:
  async signPersonalMessage(
    address: Hex,
    msgHex: Hex,
    opts = { withAppKeyOrigin: '' },
  ) {
    const privKey = this.#getPrivateKeyFor(address, opts);
    return personalSign({ privateKey: privKey, data: msgHex });
  }

  // For eth_decryptMessage:
  async decryptMessage(withAccount: Hex, encryptedData: Eip1024EncryptedData) {
    const wallet = this.#getWalletForAccount(withAccount);
    const privateKey = wallet.privateKey.toString('hex');
    return decrypt({ privateKey, encryptedData });
  }

  // personal_signTypedData, signs data along with the schema
  async signTypedData(
    address: Hex,
    typedData: any,
    opts: KeyringOpt = { version: SignTypedDataVersion.V1 },
  ) {
    // Treat invalid versions as "V1"
    let version = SignTypedDataVersion.V1;

    if (opts.version && isSignTypedDataVersion(opts.version)) {
      version = SignTypedDataVersion[opts.version];
    }

    const privateKey = this.#getPrivateKeyFor(address, opts);
    return signTypedData({ privateKey, data: typedData, version });
  }

  // get public key for nacl
  async getEncryptionPublicKey(withAccount: Hex, opts?: KeyringOpt) {
    const privKey = this.#getPrivateKeyFor(withAccount, opts);
    const publicKey = getEncryptionPublicKey(privKey.toString('hex'));
    return publicKey;
  }

  #getPrivateKeyFor(address: Hex, opts: KeyringOpt = { withAppKeyOrigin: '' }) {
    if (!address) {
      throw new Error('Must specify address.');
    }
    const wallet = this.#getWalletForAccount(address, opts);
    return wallet.privateKey;
  }

  // returns an address specific to an app
  async getAppKeyAddress(address: Hex, origin: string) {
    // FIXME: add missing support to app key
    throw new Error('App key address is not supported');
  }

  // exportAccount should return a hex-encoded private key:
  async exportAccount(address: Hex, opts = { withAppKeyOrigin: '' }) {
    const wallet = this.#getWalletForAccount(address, opts);
    return wallet?.privateKey.toString('hex');
  }

  removeAccount(account: string) {
    this.#wallets = this.#wallets.filter(
      ({ address }) => account.toLowerCase() !== address.toLowerCase(),
    );
  }

  #getWalletForAccount(rawAccount: string | number, _opts: KeyringOpt = {}) {
    // FIXME: support opts.withAppKeyOrigin
    const account = normalize(rawAccount);
    const wallet = this.#wallets.find(
      ({ address }) => account?.toLowerCase() === address.toLowerCase(),
    );
    if (!wallet) {
      throw new Error('Simple Keyring - Unable to find matching address.');
    }
    return wallet;
  }
}

/**
 * Type predicate type guard to check if a string is in the enum SignTypedDataVersion.
 *
 * @param version - The string to check.
 * @returns Whether it's in the enum.
 */
// TODO: Put this in @metamask/eth-sig-util
function isSignTypedDataVersion(
  version: SignTypedDataVersion | string,
): version is SignTypedDataVersion {
  return version in SignTypedDataVersion;
}
