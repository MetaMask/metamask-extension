import {
  LedgerBridge,
  LedgerSignTypedDataParams,
  LedgerSignTypedDataResponse,
} from '@metamask/eth-ledger-bridge-keyring';
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

type IFrameMessage<TAction extends LedgerAction> = {
  action: TAction;
  target: string;
  params?: Readonly<Record<string, unknown>>;
};

/**
 * This class is used as a custom bridge for the Ledger connection. Every
 * hardware wallet keyring also requires a bridge that has a known interface
 * that the keyring can call into for specific functions. The bridge then makes
 * whatever calls or requests it needs to in order to fulfill the request from
 * the keyring. In this case, the bridge is used to communicate with the
 * Offscreen Document. Inside the Offscreen document the ledger script is
 * loaded and registers a listener for these calls and communicate with the
 * ledger device via the ledger keyring iframe. The ledger keyring iframe is
 * added to the offscreen.html file directly.
 */
export class LedgerOffscreenBridge
  implements LedgerBridge<LedgerOffscreenBridgeOptions>
{
  isDeviceConnected = false;

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

  attemptMakeApp(): Promise<boolean> {
    return this.#sendMessage({
      target: OffscreenCommunicationTarget.ledgerOffscreen,
      action: LedgerAction.makeApp,
    });
  }

  updateTransportMethod(transportType: string): Promise<boolean> {
    return this.#sendMessage({
      target: OffscreenCommunicationTarget.ledgerOffscreen,
      action: LedgerAction.updateTransport,
      params: { transportType },
    });
  }

  getPublicKey(params: { hdPath: string }): Promise<{
    publicKey: string;
    address: string;
    chainCode?: string;
  }> {
    return this.#sendMessage({
      target: OffscreenCommunicationTarget.ledgerOffscreen,
      action: LedgerAction.getPublicKey,
      params,
    });
  }

  deviceSignTransaction(params: { hdPath: string; tx: string }): Promise<{
    v: string;
    s: string;
    r: string;
  }> {
    return this.#sendMessage({
      target: OffscreenCommunicationTarget.ledgerOffscreen,
      action: LedgerAction.signTransaction,
      params,
    });
  }

  deviceSignMessage(params: {
    hdPath: string;
    message: string;
  }): Promise<{ v: number; s: string; r: string }> {
    return this.#sendMessage({
      target: OffscreenCommunicationTarget.ledgerOffscreen,
      action: LedgerAction.signPersonalMessage,
      params,
    });
  }

  deviceSignTypedData(
    params: LedgerSignTypedDataParams,
  ): Promise<LedgerSignTypedDataResponse> {
    return this.#sendMessage({
      target: OffscreenCommunicationTarget.ledgerOffscreen,
      action: LedgerAction.signTypedData,
      params,
    });
  }

  async #sendMessage<TAction extends LedgerAction, ResponsePayload>(
    message: IFrameMessage<TAction>,
  ): Promise<ResponsePayload> {
    return new Promise((resolve, reject) => {
      let hasResponse = false;

      setTimeout(() => {
        if (!hasResponse) {
          reject(new Error('Ledger iframe timeout'));
        }
      }, 4000);

      chrome.runtime.sendMessage(message, (response) => {
        hasResponse = true;
        if (response.success) {
          resolve(response.payload);
        } else {
          reject(response.payload.error);
        }
      });
    });
  }
}
