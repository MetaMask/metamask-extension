import EventEmitter from 'events';
import { bufferToHex } from 'ethereumjs-util';
import { uniq } from 'lodash';
import {
  HARDWARE_KEYRING_INIT_OPTS,
  HARDWARE_KEYRINGS,
} from '../../shared/constants/hardware-wallets';
import { buildUnserializedTxFromHex } from '../helpers/utils/transactions.util';
import { callBackgroundMethod } from './action-queue';

const processKeyringResponse = (res, method) => {
  if (method === 'signTransaction') {
    return res?.serialize ? bufferToHex(res.serialize()) : res;
  }

  return res;
};

const processArgs = (args, method) => {
  if (method === 'signTransaction') {
    return [args[0], buildUnserializedTxFromHex(args[1]), ...args.slice(2)];
  }

  return args;
};

export class ClientKeyringController extends EventEmitter {
  constructor() {
    super();
    /**
     * @property {Array<string>} initialisedKeyrings - Keyring types that have been initialised
     */
    this._initialisedKeyrings = [];
    this.keyrings = HARDWARE_KEYRINGS;
    this.keyringInstances = HARDWARE_KEYRINGS.map((KeyringClass) => {
      return new KeyringClass(HARDWARE_KEYRING_INIT_OPTS);
    });
  }

  /**
   * Get Keyring Class For Type
   *
   * Searches the current `keyring` array for a
   * Keyring class whose unique `type` property
   * matches the provided `type`, returning it
   * if it exists.
   *
   * @param {string} type - The type whose class to get.
   * @returns {Keyring|undefined} The class, if it exists.
   */
  getKeyringClassForType(type) {
    return this.keyrings.find((kr) => kr.type === type);
  }

  /**
   * Get Keyring Instance For Type
   *
   * @param {string} type - The type whose class to get.
   * @returns {Keyring|undefined} The class, if it exists.
   */
  getKeyringInstanceForType(type) {
    return this.keyringInstances.find((kr) => kr.type === type);
  }

  async updateKeyringData(type, data) {
    const keyring = this.getKeyringInstanceForType(type);

    if (!keyring) {
      console.error('updateKeyringData', type, data, this.keyringInstances);
    }

    await keyring.deserialize(data);

    console.log(`🖥️ updated keyring data`, data);
  }

  /**
   * Get serialized keyring data that can be used to update
   * the background's keyring state.
   *
   * @param {string} type
   * @returns {Promise<object>}
   */
  async getUpdatedKeyringData(type) {
    const keyring = this.getKeyringInstanceForType(type);
    const data = await keyring.serialize();

    return data;
  }

  /**
   *
   * @param {object} arg
   * @param {string} arg.method
   * @param {*[]} arg.args
   * @param {object} arg.prevState
   * @param {string} arg.promiseId
   * @param {string} arg.type
   * @returns {Promise<void>}
   */
  async handleMethodCall({ type, method, args: _args, prevState, promiseId }) {
    const callback = (res, err) =>
      console.log('closeBackgroundPromise callback', res, err);
    await this.updateKeyringData(type, prevState);

    const args = processArgs(_args, method);
    const keyring = this.getKeyringInstanceForType(type);

    if (method === 'init') {
      // Ensure that the type is marked as initialised even before
      // the .init() method is called, so that a double init doesn't occur
      this.setInitialisedKeyring(type);
    } else {
      // Some keyrings require the call of an .init() method before they can be used
      await this.initialiseKeyring(keyring);
    }

    try {
      const _res = await keyring[method](...args);
      const res = processKeyringResponse(_res, method);
      const newState = await this.getUpdatedKeyringData(type);

      console.log(`✅🖥️ successful hardware call`, {
        res,
        newState,
        method,
        type: keyring.type,
      });

      callBackgroundMethod(
        'closeBackgroundPromise',
        [
          {
            promiseId,
            result: 'resolve',
            data: { newState, response: res },
          },
        ],
        callback,
      );
    } catch (e) {
      console.log(`❌🖥️ unsuccessful hardware call`, {
        args,
        method,
        type: keyring.type,
        e,
      });

      callBackgroundMethod(
        'closeBackgroundPromise',
        [
          {
            promiseId,
            result: 'reject',
            data: e.message || e.cause || String(e),
          },
        ],
        callback,
      );
    }
  }

  /**
   * Initialises the Keyring instance if it has the custom .init method
   *
   * @param {keyring} keyring
   * @returns {Promise<void>}
   */
  async initialiseKeyring(keyring) {
    if (!this.isInitialisedKeyring(keyring.type)) {
      this.setInitialisedKeyring(keyring.type);
      // Ensure that the type is added to the array before init'ing,
      // so that a double init doesn't occur

      // Note that not every HW keyring has an init method, nor do they all
      // require special initialisation before calling their instance methods.
      if (keyring.init) {
        console.time(`🖥️ initialising keyring ${keyring.type}`);
        await keyring.init();
        console.timeEnd(`🖥️ initialising keyring ${keyring.type}`);
      }
    }
  }

  /**
   * @param {string} type
   * @returns {boolean}
   */
  isInitialisedKeyring(type) {
    return this._initialisedKeyrings.includes(type);
  }

  /**
   * @param {string} type - The type of keyring to mark as initialised
   */
  setInitialisedKeyring(type) {
    this._initialisedKeyrings = uniq([...this._initialisedKeyrings, type]);
  }
}

let clientKeyringController;

export const initializeClientKeyringController = () => {
  if (clientKeyringController) {
    console.log('ClientKeyringController already initialized, skipping.');
    return;
  }

  clientKeyringController = new ClientKeyringController();
};

export const handleHardwareCall = (params) => {
  initializeClientKeyringController();

  clientKeyringController.handleMethodCall(params);
};
