import EventEmitter from 'events';
import extension from 'extensionizer';
import { TransactionFactory } from '@ethereumjs/tx';

import { BitBox02API, getDevicePath, constants } from 'bitbox02-api';

import * as ethUtil from 'ethereumjs-util';
import * as HDKey from 'hdkey';

const hdPathString = `m/44'/60'/0'/0`;
const keyringType = 'BitBox02 Hardware';
const pathBase = 'm';
const MAX_INDEX = 100;

class BitBox02Keyring extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.type = keyringType;
    this.accounts = [];
    this.hdk = null;
    this.page = 0;
    this.perPage = 5;
    this.unlockedAccount = 0;
    this.paths = {};
    this.deserialize(opts);
  }

  serialize() {
    return Promise.resolve({
      hdPath: this.hdPath,
      accounts: this.accounts,
      page: this.page,
      paths: this.paths,
      perPage: this.perPage,
      unlockedAccount: this.unlockedAccount,
    });
  }

  deserialize(opts = {}) {
    this.hdPath = opts.hdPath || hdPathString;
    this.accounts = opts.accounts || [];
    this.page = opts.page || 0;
    this.perPage = opts.perPage || 5;
    return Promise.resolve();
  }

  isUnlocked() {
    return Boolean(this.hdk && this.hdk.publicKey);
  }

  openPopup(url) {
    return new Promise((resolve) => {
      extension.windows.create(
        {
          url: extension.runtime.getURL(url),
          type: 'popup',
          width: 320,
          height: 175,
        },
        resolve,
      );
    });
  }

  maybeClosePopup() {
    extension.runtime.sendMessage({ type: 'bitbox02', action: 'popup-close' });
  }

  async withDevice(f) {
    const devicePath = await getDevicePath({ forceBridge: true });
    const bitbox02 = new BitBox02API(devicePath);
    try {
      await bitbox02.connect(
        (pairingCode) => {
          this.pairingCode = pairingCode;
          this.openPopup(
            `vendor/bitbox02/bitbox02-pairing.html?code=${encodeURIComponent(
              pairingCode,
            )}`,
          );
        },
        async () => {
          this.maybeClosePopup();
        },
        (attestationResult) => {
          console.info(attestationResult);
        },
        () => {
          this.maybeClosePopup();
        },
        (status) => {
          if (status === constants.Status.PairingFailed) {
            this.maybeClosePopup();
          }
        },
      );

      if (bitbox02.firmware().Product() !== constants.Product.BitBox02Multi) {
        throw new Error('Unsupported device');
      }

      const rootPub = await bitbox02.ethGetRootPubKey(this.hdPath);
      const hdk = HDKey.fromExtendedKey(rootPub);
      this.hdk = hdk;
      const result = await f(bitbox02);
      bitbox02.close();
      return result;
    } catch (err) {
      console.error(err);
      bitbox02.close();
      throw err;
    }
  }

  setAccountToUnlock(index) {
    this.unlockedAccount = parseInt(index, 10);
  }

  setHdPath(hdPath) {
    // Reset HDKey if the path changes
    if (this.hdPath !== hdPath) {
      this.hdk = new HDKey();
    }
    this.hdPath = hdPath;
  }

  async addAccounts(n = 1) {
    return await this.withDevice(async () => {
      const from = this.unlockedAccount;
      const to = from + n;

      for (let i = from; i < to; i++) {
        const address = this._addressFromIndex(pathBase, i);
        if (!this.accounts.includes(address)) {
          this.accounts.push(address);
        }
        this.page = 0;
      }
      return this.accounts;
    });
  }

  getFirstPage() {
    this.page = 0;
    return this.__getPage(1);
  }

  getNextPage() {
    return this.__getPage(1);
  }

  getPreviousPage() {
    return this.__getPage(-1);
  }

  async __getPage(increment) {
    this.page += increment;

    if (this.page <= 0) {
      this.page = 1;
    }

    return await this.withDevice(async () => {
      const from = (this.page - 1) * this.perPage;
      const to = from + this.perPage;

      const accounts = [];

      for (let i = from; i < to; i++) {
        const address = this._addressFromIndex(pathBase, i);
        accounts.push({
          address,
          balance: null,
          index: i,
        });
        this.paths[ethUtil.toChecksumAddress(address)] = i;
      }
      return accounts;
    });
  }

  getAccounts() {
    return Promise.resolve(this.accounts.slice());
  }

  removeAccount(address) {
    if (
      !this.accounts.map((a) => a.toLowerCase()).includes(address.toLowerCase())
    ) {
      throw new Error(`Address ${address} not found in this keyring`);
    }
    this.accounts = this.accounts.filter(
      (a) => a.toLowerCase() !== address.toLowerCase(),
    );
  }

  // tx is an instance of the ethereumjs-transaction class.
  async signTransaction(address, tx) {
    return await this.withDevice(async (bitbox02) => {
      const result = await bitbox02.ethSignTransaction({
        keypath: this._pathFromAddress(address),
        chainId: tx.common.chainId(),
        tx: {
          nonce: tx.nonce.toArray(),
          gasPrice: tx.gasPrice.toArray(),
          gasLimit: tx.gasLimit.toArray(),
          to: tx.to.toBuffer(),
          value: tx.value.toArray(),
          data: tx.data,
        },
      });
      // Because tx will be immutable, first get a plain javascript object that
      // represents the transaction. Using txData here as it aligns with the
      // nomenclature of ethereumjs/tx.
      const txData = tx.toJSON();
      txData.r = result.r;
      txData.s = result.s;
      txData.v = result.v;
      // Adopt the 'common' option from the original transaction and set the
      // returned object to be frozen if the original is frozen.
      return TransactionFactory.fromTxData(txData, {
        common: tx.common,
        freeze: Object.isFrozen(tx),
      });
    });
  }

  signMessage(withAccount, data) {
    return this.signPersonalMessage(withAccount, data);
  }

  async signPersonalMessage(withAccount, message) {
    return await this.withDevice(async (bitbox02) => {
      const result = await bitbox02.ethSignMessage({
        keypath: this._pathFromAddress(withAccount),
        message: ethUtil.toBuffer(message),
      });
      const sig = Buffer.concat([
        Buffer.from(result.r),
        Buffer.from(result.s),
        Buffer.from(result.v),
      ]);
      const sigHex = `0x${sig.toString('hex')}`;
      return sigHex;
    });
  }

  signTypedData() {
    return Promise.reject(new Error('Not supported on this device'));
  }

  exportAccount() {
    return Promise.reject(new Error('Not supported on this device'));
  }

  forgetDevice() {
    this.accounts = [];
    this.hdk = new HDKey();
    this.page = 0;
    this.unlockedAccount = 0;
    this.paths = {};
  }

  /* PRIVATE METHODS */

  // eslint-disable-next-line no-shadow
  _addressFromIndex(pathBase, i) {
    const dkey = this.hdk.derive(`${pathBase}/${i}`);
    const address = ethUtil
      .publicToAddress(dkey.publicKey, true)
      .toString('hex');
    return ethUtil.toChecksumAddress(`0x${address}`);
  }

  _pathFromAddress(address) {
    const checksummedAddress = ethUtil.toChecksumAddress(address);
    let index = this.paths[checksummedAddress];
    if (typeof index === 'undefined') {
      for (let i = 0; i < MAX_INDEX; i++) {
        if (checksummedAddress === this._addressFromIndex(pathBase, i)) {
          index = i;
          break;
        }
      }
    }

    if (typeof index === 'undefined') {
      throw new Error('Unknown address');
    }
    return `${this.hdPath}/${index}`;
  }
}

BitBox02Keyring.type = keyringType;

export { BitBox02Keyring };
