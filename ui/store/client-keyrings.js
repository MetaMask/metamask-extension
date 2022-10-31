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

    // @TODO, play around with OBS later here
    // this.store = new ObservableStore({});

    // Avoid initializing keyrings until the background requests so
    this.keyrings = HARDWARE_KEYRINGS;
    this.keyringInstances = HARDWARE_KEYRINGS.map((KeyringClass) => {
      return new KeyringClass(HARDWARE_KEYRING_INIT_OPTS);
    });

    console.log(this.keyringInstances.map((k) => k.type));
    // this.keyringInstances = [];
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

    await keyring.deserialize(data);
  }

  async getUpdatedKeyringData(type) {
    const keyring = this.getKeyringInstanceForType(type);
    const data = await keyring.serialize();

    return data;
  }

  async handleMethodCall({ type, method, args, prevState, promiseId }) {
    console.trace(`Handle Method Call: ${type} ${method}`);

    await this.updateKeyringData(type, prevState);

    const keyring = this.getKeyringInstanceForType(type);

    keyring[method](...args)
      .then(async (res) => {
        const update = await this.getUpdatedKeyringData(type);

        callBackgroundMethod('closeBackgroundPromise', [
          {
            promiseId,
            result: 'resolve',
            data: [update, res],
          },
        ]);
      })
      .catch((res) => {
        callBackgroundMethod('closeBackgroundPromise', [
          {
            promiseId,
            result: 'reject',
            data: [res],
          },
        ]);
      });
  }
}
