import {
  LedgerBridge,
  LedgerSignTypedDataParams,
  LedgerSignTypedDataResponse,
} from '@metamask/eth-ledger-bridge-keyring';
import { TransportStatusError } from '@ledgerhq/errors';
import {
  LedgerAction,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../../../shared/constants/offscreen-communication';

const MESSAGE_TIMEOUT = 4000;

/**
 * The options for the LedgerOffscreenBridge are empty because the bridge
 * doesn't require any options to be passed in.
 */
type LedgerOffscreenBridgeOptions = Record<never, never>;

type IFrameMessage<TAction extends LedgerAction> = {
  action: TAction;
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
    return this.#sendMessage(
      {
        action: LedgerAction.makeApp,
      },
      { timeout: MESSAGE_TIMEOUT },
    );
  }

  updateTransportMethod(transportType: string): Promise<boolean> {
    return this.#sendMessage(
      {
        action: LedgerAction.updateTransport,
        params: { transportType },
      },
      { timeout: MESSAGE_TIMEOUT },
    );
  }

  getPublicKey(params: { hdPath: string }): Promise<{
    publicKey: string;
    address: string;
    chainCode?: string;
  }> {
    return this.#sendMessage({
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
      action: LedgerAction.signTransaction,
      params,
    });
  }

  deviceSignMessage(params: {
    hdPath: string;
    message: string;
  }): Promise<{ v: number; s: string; r: string }> {
    return this.#sendMessage({
      action: LedgerAction.signPersonalMessage,
      params,
    });
  }

  deviceSignTypedData(
    params: LedgerSignTypedDataParams,
  ): Promise<LedgerSignTypedDataResponse> {
    return this.#sendMessage({
      action: LedgerAction.signTypedData,
      params,
    });
  }

  async #sendMessage<TAction extends LedgerAction, ResponsePayload>(
    message: IFrameMessage<TAction>,
    { timeout }: { timeout?: number } = {},
  ): Promise<ResponsePayload> {
    return new Promise((resolve, reject) => {
      let responseTimeout: ReturnType<typeof setTimeout>;

      if (timeout) {
        responseTimeout = setTimeout(() => {
          reject(new Error('Ledger iframe timeout'));
        }, timeout);
      }

      chrome.runtime.sendMessage(
        {
          ...message,
          target: OffscreenCommunicationTarget.ledgerOffscreen,
        },
        (response) => {
          clearTimeout(responseTimeout);
          if (response?.success) {
            resolve(response.payload || response.success);
          } else {
            // Need to process the payload to get the error
            // and then reject with the error
            const error = response?.payload?.error;

            if (
              error &&
              typeof error.statusCode === 'number' &&
              error.statusCode > 0
            ) {
              // This is TransportStatusError, convert the SerializedLedgerError to a TransportStatusError
              // TransportStatusError will regenerate the error message based on the statusCode
              const transportStatusError = new TransportStatusError(
                error.statusCode,
              );
              reject(transportStatusError);
            } else if (error?.message) {
              // Regenerate the error based on the SerializedLedgerError
              const newError = new Error(error.message, {
                cause: error,
              });
              reject(newError);
            } else {
              // Fallback for unknown Ledger errors when error information is not available
              reject(new Error('Unknown Ledger error occurred'));
            }
          }
        },
      );
    });
  }
}
