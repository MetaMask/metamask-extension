import EventEmitter from 'events';
import { bufferToHex } from 'ethereumjs-util';
import { HARDWARE_KEYRINGS } from '../../shared/constants/hardware-wallets';
import { buildUnserializedUnsignedTransaction } from '../helpers/utils/optimism/buildUnserializedTransaction';
import { callBackgroundMethod } from './action-queue';

function getSerializedResponse(res, method) {
  if (method === 'signTransaction') {
    return res?.serialize ? bufferToHex(res.serialize()) : res;
  }

  return res;
}

export class ClientKeyringController extends EventEmitter {
  constructor() {
    super();
    this.keyrings = HARDWARE_KEYRINGS;
    // Avoid initializing keyrings until the background requests so
    this.keyringInstances = HARDWARE_KEYRINGS.map((KeyringClass) => {
      return new KeyringClass();
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

  async handleMethodCall({ type, method, args: _args, prevState, promiseId }) {
    const callback = (res, err) =>
      console.log('closeBackgroundPromise callback', res, err);
    await this.updateKeyringData(type, prevState);

    const args = this.processArgs(_args, method);
    const keyring = this.getKeyringInstanceForType(type);

    try {
      const _res = await keyring[method](...args);
      const res = getSerializedResponse(_res, method);
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
            data: e,
          },
        ],
        callback,
      );
    }
  }

  processArgs(args, method) {
    if (method === 'signTransaction') {
      // Find a better solution for this
      return [args[0], buildUnserializedUnsignedTransaction(args[1])];
    }

    return args;
  }
}

let clientKeyringController; // poc purposes only

export const initializeClientKeyringController = () => {
  if (!clientKeyringController) {
    clientKeyringController = new ClientKeyringController();
  } else {
    console.warn('ClientKeyringController already initialized, skipping.');
  }
};

export const handleHardwareCall = (params) => {
  initializeClientKeyringController();

  clientKeyringController.handleMethodCall(params);
};
