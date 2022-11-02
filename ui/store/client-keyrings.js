import EventEmitter from 'events';
import {
  HARDWARE_KEYRING_INIT_OPTS,
  HARDWARE_KEYRINGS,
} from '../../shared/constants/hardware-wallets';
import { callBackgroundMethod } from './action-queue';

export class ClientKeyringController extends EventEmitter {
  constructor() {
    super();

    console.trace('ClientKeyringController constructor called');

    this.keyrings = HARDWARE_KEYRINGS;
    // Avoid initializing keyrings until the background requests so
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
  }

  async getUpdatedKeyringData(type) {
    const keyring = this.getKeyringInstanceForType(type);
    const data = await keyring.serialize();

    return data;
  }

  async handleMethodCall({ type, method, args, prevState, promiseId }) {
    const callback = (res, err) =>
      console.log('closeBackgroundPromise callback', res, err);
    console.trace(`Handle Method Call: ${type} ${method}`);

    await this.updateKeyringData(type, prevState);

    const keyring = this.getKeyringInstanceForType(type);

    try {
      const res = await keyring[method](...args);
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
            // @TODO, test is we can do this
            // result: Promise.reject(res),
            data: e,
          },
        ],
        callback,
      );
    }
  }
}
