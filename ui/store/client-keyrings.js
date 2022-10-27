import EventEmitter from 'events';
import { HARDWARE_KEYRINGS } from '../../shared/constants/hardware-wallets';
import { callBackgroundMethod } from '../store/action-queue';

const HARDWARE_KEYRING_OPTS = {
  delayInt: true,
};

export class ClientKeyringController extends EventEmitter {
  constructor() {
    super();

    console.log('ClientKeyringController constructor');

    // @TODO, play around with OBS later here
    // this.store = new ObservableStore({});

    this.keyrings = HARDWARE_KEYRINGS.map(
      (Keyring) => new Keyring(HARDWARE_KEYRING_OPTS),
    );
  }

  findKeyringByType(type) {
    return this.keyrings.find((keyring) => keyring.type === type);
  }

  async updateKeyringData(type, data) {
    const keyring = this.findKeyringByType(type);

    await keyring.deserialize(data);
  }

  async getUpdatedKeyringData(type) {
    const keyring = this.findKeyringByType(type);
    const data = await keyring.serialize();

    return data;
  }

  async handleMethodCall({ type, method, args, prevState, promiseId }) {
    await this.updateKeyringData(type, prevState);

    const keyring = this.findKeyringByType(type);

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
