import {
  createLedgerError,
  GetAppNameAndVersionResponse,
  isKnownLedgerError,
  LedgerBridge,
  LedgerSignDelegationAuthorizationParams,
  LedgerSignDelegationAuthorizationResponse,
  LedgerSignTypedDataParams,
  LedgerSignTypedDataResponse,
  AppConfigurationResponse,
} from '@metamask/eth-ledger-bridge-keyring';
import { TransportStatusError } from '@ledgerhq/errors';
import { HardwareWalletError } from '@metamask/hw-wallet-sdk';
import {
  LedgerAction,
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
 * Offscreen Document. Inside the Offscreen document the ledger script
 * communicates directly with the Ledger device via WebHID.
 *
 * `isDeviceConnected` is intentionally omitted from the implemented shape: the
 * offscreen bridge does not own HID state (the offscreen document does, and it
 * already signals connect/disconnect via `OffscreenCommunicationEvents`).
 * Forcing the bridge to declare a stale `boolean` here would mislead callers
 * into reading it. If you need device-connection state, listen for
 * `ledgerDeviceConnect` events on the background side.
 *
 * TODO(upstream): make `isDeviceConnected` optional on `LedgerBridge<T>` in
 * `@metamask/eth-ledger-bridge-keyring` so this `Omit` can go away.
 * Tracked separately.
 */
export class LedgerOffscreenBridge implements Omit<
  LedgerBridge<LedgerOffscreenBridgeOptions>,
  'isDeviceConnected'
> {
  init() {
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

  getAppNameAndVersion(): Promise<GetAppNameAndVersionResponse> {
    return this.#sendMessage(
      {
        action: LedgerAction.getAppNameAndVersion,
      },
      { timeout: MESSAGE_TIMEOUT },
    );
  }

  getAppConfiguration(): Promise<AppConfigurationResponse> {
    return this.#sendMessage(
      {
        action: LedgerAction.getAppConfiguration,
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

  deviceSignDelegationAuthorization(
    params: LedgerSignDelegationAuthorizationParams,
  ): Promise<LedgerSignDelegationAuthorizationResponse> {
    return this.#sendMessage({
      action: LedgerAction.signEip7702Authorization,
      params,
    });
  }

  async #sendMessage<TAction extends LedgerAction, ResponsePayload>(
    message: IFrameMessage<TAction>,
    { timeout }: { timeout?: number } = {},
  ): Promise<ResponsePayload> {
    return this.#attemptSendMessage<TAction, ResponsePayload>(
      message,
      { timeout },
    );
  }

  #attemptSendMessage<TAction extends LedgerAction, ResponsePayload>(
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

          if (chrome.runtime.lastError) {
            const chromeError = chrome.runtime.lastError.message;
            reject(new Error(chromeError));
            return;
          }

          if (response?.success) {
            resolve(response.payload || response.success);
          } else {
            const error = response?.payload?.error;
            if (
              error?.name === 'HardwareWalletError' &&
              typeof error?.code === 'number'
            ) {
              reject(
                new HardwareWalletError(error.message, {
                  code: error.code,
                  severity: error.severity,
                  category: error.category,
                  userMessage: error.userMessage,
                }),
              );
            } else if (
              error &&
              error.name === 'HardwareWalletError' &&
              typeof error.code === 'number'
            ) {
              reject(
                new HardwareWalletError(error.message, {
                  code: error.code,
                  severity: error.severity,
                  category: error.category,
                  userMessage: error.userMessage,
                }),
              );
            } else if (
              error &&
              typeof error.statusCode === 'number' &&
              error.statusCode > 0
            ) {
              const statusCodeHex = `0x${error.statusCode.toString(16)}`;
              if (isKnownLedgerError(statusCodeHex)) {
                reject(createLedgerError(statusCodeHex));
              } else {
                reject(new TransportStatusError(error.statusCode));
              }
            } else if (error?.message) {
              reject(new Error(error.message, { cause: error }));
            } else {
              reject(new Error('Unknown Ledger error occurred'));
            }
          }
        },
      );
    });
  }
}
