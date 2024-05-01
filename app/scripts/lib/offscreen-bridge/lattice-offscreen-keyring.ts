import LatticeKeyring from 'eth-lattice-keyring';
import {
  OffscreenCommunicationTarget,
  KnownOrigins,
} from '../../../../shared/constants/offscreen-communication';

/**
 * This keyring extends the default keyring but uses a overwritten _getCreds
 * method to alter the mechanism by which the device is connected to. The main
 * reason for this is because in MV3 the window method to open a new tab will
 * not execute in the service worker as there is no DOM. The original keyring
 * _getCreds method calls into window.open to open a new window for the lattice
 * connector. The solution here is to split the keyring execution so that the
 * portion that requires a normal functioning DOM is executed in the offscreen
 * document. The lattice.ts file in the offscreen directory is responsible for
 * the latter half of the original keyrings execution. The main difference in
 * the first half that this overwritten method is responsible for is just to
 * use the chrome.runtime.sendMessage method to send a message to the offscreen
 * document which picks up on the execution of opening the new window to the
 * lattice connector. Note that this file differs from the ledger and trezor
 * offscreen bridges because this keyring requires no bridge to function
 * appropriately.
 */
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
