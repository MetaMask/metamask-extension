import LatticeKeyring from 'eth-lattice-keyring';
import {
  OffscreenCommunicationTarget,
  KnownOrigins,
} from '../../../../shared/constants/offscreen-communication';

class LatticeKeyringOffscreen extends LatticeKeyring {
  static type: string;

  constructor(opts = {}) {
    super(opts);
  }

  async _getCreds() {
    try {
      // If we are not aware of what Lattice we should be talking to,
      // we need to open a window that lets the user go through the
      // pairing or connection process.
      const name = this.appName ? this.appName : 'Unknown';
      const url = `${KnownOrigins.lattice}?keyring=${name}&forceLogin=true`;

      // send a msg to the render process to open lattice connector
      // and collect the credentials
      const creds = await new Promise<{
        deviceID: string;
        password: string;
        endpoint: string;
      }>((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            target: OffscreenCommunicationTarget.latticeOffscreen,
            params: {
              url,
            },
          },
          (response) => {
            if (response.error) {
              reject(response.error);
            }

            resolve(response.result);
          },
        );
      });

      return creds;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

LatticeKeyringOffscreen.type = LatticeKeyring.type;

export { LatticeKeyringOffscreen };
