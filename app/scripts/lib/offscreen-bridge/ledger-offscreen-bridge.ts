import {
  LedgerBridge,
  LedgerSignTypedDataParams,
  LedgerSignTypedDataResponse,
} from '@metamask/eth-ledger-bridge-keyring';
import {
  ConnectedDevice,
  ConsoleLogger,
  DeviceManagementKit,
  DeviceManagementKitBuilder,
  TransportIdentifier,
} from '@ledgerhq/device-management-kit';
import {
  LedgerAction,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../../../shared/constants/offscreen-communication';

/**
 * The options for the LedgerOffscreenBridge are empty because the bridge
 * doesn't require any options to be passed in.
 */
type LedgerOffscreenBridgeOptions = Record<never, never>;

const webHidIdentifier: TransportIdentifier = 'WEB-HID';

/**
 * This class is used as a custom bridge for the Ledger connection. Every
 * hardware wallet keyring also requires a bridge that has a known interface
 * that the keyring can call into for specific functions. The bridge then makes
 * whatever calls or requests it needs to in order to fulfill the request from
 *
 * the keyring. In this case, the bridge is used to communicate with the
 * Offscreen Document. Inside the Offscreen document the ledger script is
 * loaded and registers a listener for these calls and communicate with the
 * ledger device via the ledger keyring iframe. The ledger keyring iframe is
 * added to the offscreen.html file directly.
 */
export class LedgerOffscreenBridge
  implements LedgerBridge<LedgerOffscreenBridgeOptions>
{
  dmk: DeviceManagementKit = new DeviceManagementKitBuilder()
    .addLogger(new ConsoleLogger())
    .build();

  isDeviceConnected = false;

  sessionId: string | null = null;

  connectedDevice: ConnectedDevice | undefined;

  init() {
    chrome.runtime.onMessage.addListener((msg) => {
      if (
        msg.target === OffscreenCommunicationTarget.extension &&
        msg.event === OffscreenCommunicationEvents.ledgerDeviceConnect
      ) {
        this.isDeviceConnected = true;
      }
    });

    return Promise.resolve();
  }

  destroy() {
    // TODO: remove listener
    return Promise.resolve();
  }

  getOptions() {
    return Promise.resolve({});
  }

  setOptions() {
    return Promise.resolve();
  }

  async attemptMakeApp() {
    if (!this.connectedDevice) {
      const dmkSdk = this.dmk;
      console.log('Attempting to make app');
      dmkSdk.startDiscovering({ transport: webHidIdentifier }).subscribe({
        next: (device) => {
          console.log('Device found:', device);
          dmkSdk.connect({ device }).then((sessionId) => {
            const connectedDevice = dmkSdk.getConnectedDevice({ sessionId });
            console.log('Connected device:', connectedDevice);
            this.connectedDevice = connectedDevice;
            this.sessionId = sessionId;
          });
        },
        error: (error) => {
          console.error('Error:', error);
        },
        complete: () => {
          console.log('Discovery complete');
        },
      });
    }
    return true;
    // return new Promise<boolean>((resolve, reject) => {
    //   chrome.runtime.sendMessage(
    //     {
    //       target: OffscreenCommunicationTarget.ledgerOffscreen,
    //       action: LedgerAction.makeApp,
    //     },
    //     (response) => {
    //       if (response.success) {
    //         resolve(true);
    //       } else if (response.error) {
    //         reject(response.error);
    //       } else {
    //         reject(new Error('Unknown error occurred'));
    //       }
    //     },
    //   );
    // });
  }

  updateTransportMethod(transportType: string) {
    return new Promise<boolean>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.ledgerOffscreen,
          action: LedgerAction.updateTransport,
          params: { transportType },
        },
        (response) => {
          if (response.success) {
            resolve(true);
          } else {
            reject(new Error('Ledger transport could not be updated'));
          }
        },
      );
    });
  }

  getPublicKey(params: { hdPath: string }) {
    return new Promise<{
      publicKey: string;
      address: string;
      chainCode?: string;
    }>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.ledgerOffscreen,
          action: LedgerAction.getPublicKey,
          params,
        },
        (response) => {
          if (response.success) {
            resolve(response.payload);
          } else {
            reject(response.payload.error);
          }
        },
      );
    });
  }

  deviceSignTransaction(params: { hdPath: string; tx: string }) {
    return new Promise<{
      v: string;
      s: string;
      r: string;
    }>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.ledgerOffscreen,
          action: LedgerAction.signTransaction,
          params,
        },
        (response) => {
          if (response.success) {
            resolve(response.payload);
          } else {
            reject(response.payload.error);
          }
        },
      );
    });
  }

  deviceSignMessage(params: { hdPath: string; message: string }) {
    return new Promise<{
      v: number;
      s: string;
      r: string;
    }>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.ledgerOffscreen,
          action: LedgerAction.signPersonalMessage,
          params,
        },
        (response) => {
          if (response.success) {
            resolve(response.payload);
          } else {
            reject(response.payload.error);
          }
        },
      );
    });
  }

  deviceSignTypedData(
    params: LedgerSignTypedDataParams,
  ): Promise<LedgerSignTypedDataResponse> {
    return new Promise<{
      v: number;
      s: string;
      r: string;
    }>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.ledgerOffscreen,
          action: LedgerAction.signTypedData,
          params,
        },
        (response) => {
          if (response.success) {
            resolve(response.payload);
          } else {
            reject(response.payload.error);
          }
        },
      );
    });
  }
}
