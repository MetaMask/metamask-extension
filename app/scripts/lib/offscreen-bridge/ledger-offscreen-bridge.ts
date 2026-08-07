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
import {
  LedgerAction,
  OffscreenCommunicationTarget,
} from '../../../../shared/constants/offscreen-communication';
import {
  HardwareWalletType,
  toHardwareWalletError,
} from '../../../../shared/lib/hardware-wallets';
import {
  SerializedLedgerError,
  isSerializedLedgerError,
} from '../../../offscreen/hardware-wallets/ledger-utils';

export const MESSAGE_TIMEOUT_MS = 4000;

/**
 * Timeout for `getPublicKey` requests sent to the offscreen document.
 *
 * `getPublicKey` does not require user interaction on the device (the address
 * is returned without a confirmation prompt), so a relatively short timeout is
 * appropriate. If the offscreen/WebHID round-trip wedges, this converts the
 * otherwise-indefinite hang into a recoverable rejection.
 */
export const GET_PUBLIC_KEY_TIMEOUT_MS = 30_000;

/**
 * Timeout for signing requests sent to the offscreen document.
 *
 * Signing requires the user to physically confirm on the Ledger device, which
 * can take longer; allow up to 5 minutes before giving up.
 */
export const SIGN_TIMEOUT_MS = 300_000;

/**
 * The options for the LedgerOffscreenBridge are empty because the bridge
 * doesn't require any options to be passed in.
 */
type LedgerOffscreenBridgeOptions = Record<never, never>;

type IFrameMessage<TAction extends LedgerAction> = {
  action: TAction;
  params?: Readonly<Record<string, unknown>>;
};

type LedgerOffscreenResponse<ResponsePayload> = {
  success: boolean;
  payload?: ResponsePayload | { error?: SerializedLedgerError };
  error?: SerializedLedgerError;
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
      { timeout: MESSAGE_TIMEOUT_MS },
    );
  }

  updateTransportMethod(transportType: string): Promise<boolean> {
    return this.#sendMessage(
      {
        action: LedgerAction.updateTransport,
        params: { transportType },
      },
      { timeout: MESSAGE_TIMEOUT_MS },
    );
  }

  getAppNameAndVersion(): Promise<GetAppNameAndVersionResponse> {
    return this.#sendMessage(
      {
        action: LedgerAction.getAppNameAndVersion,
      },
      { timeout: MESSAGE_TIMEOUT_MS },
    );
  }

  getAppConfiguration(): Promise<AppConfigurationResponse> {
    return this.#sendMessage(
      {
        action: LedgerAction.getAppConfiguration,
      },
      { timeout: MESSAGE_TIMEOUT_MS },
    );
  }

  getPublicKey(params: { hdPath: string }): Promise<{
    publicKey: string;
    address: string;
    chainCode?: string;
  }> {
    return this.#sendMessage(
      {
        action: LedgerAction.getPublicKey,
        params,
      },
      { timeout: GET_PUBLIC_KEY_TIMEOUT_MS },
    );
  }

  deviceSignTransaction(params: { hdPath: string; tx: string }): Promise<{
    v: string;
    s: string;
    r: string;
  }> {
    return this.#sendMessage(
      {
        action: LedgerAction.signTransaction,
        params,
      },
      { timeout: SIGN_TIMEOUT_MS },
    );
  }

  deviceSignMessage(params: {
    hdPath: string;
    message: string;
  }): Promise<{ v: number; s: string; r: string }> {
    return this.#sendMessage(
      {
        action: LedgerAction.signPersonalMessage,
        params,
      },
      { timeout: SIGN_TIMEOUT_MS },
    );
  }

  deviceSignTypedData(
    params: LedgerSignTypedDataParams,
  ): Promise<LedgerSignTypedDataResponse> {
    return this.#sendMessage(
      {
        action: LedgerAction.signTypedData,
        params,
      },
      { timeout: SIGN_TIMEOUT_MS },
    );
  }

  deviceSignDelegationAuthorization(
    params: LedgerSignDelegationAuthorizationParams,
  ): Promise<LedgerSignDelegationAuthorizationResponse> {
    return this.#sendMessage(
      {
        action: LedgerAction.signDelegationAuthorization,
        params,
      },
      { timeout: SIGN_TIMEOUT_MS },
    );
  }

  async #sendMessage<TAction extends LedgerAction, ResponsePayload>(
    message: IFrameMessage<TAction>,
    { timeout }: { timeout?: number } = {},
  ): Promise<ResponsePayload> {
    return new Promise((resolve, reject) => {
      let responseTimeout: ReturnType<typeof setTimeout>;

      if (timeout) {
        responseTimeout = setTimeout(() => {
          reject(
            new Error(
              `Ledger device did not respond to "${message.action}" within ${timeout}ms`,
            ),
          );
        }, timeout);
      }

      chrome.runtime.sendMessage(
        {
          ...message,
          target: OffscreenCommunicationTarget.ledgerOffscreen,
        },
        (rawResponse) => {
          clearTimeout(responseTimeout);

          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          // Generic `TAction` prevents overload resolution from picking a
          // specific ledger response shape, so declare it explicitly here.
          const response: LedgerOffscreenResponse<ResponsePayload> | undefined =
            rawResponse;

          if (response?.success) {
            resolve((response.payload ?? response.success) as ResponsePayload);
            return;
          }

          reject(this.#toLedgerBridgeError(response));
        },
      );
    });
  }

  #toLedgerBridgeError(
    response: LedgerOffscreenResponse<unknown> | undefined,
  ): Error {
    const rawError = this.#extractError(response);
    const error = isSerializedLedgerError(rawError) ? rawError : undefined;

    if (error?.name === 'HardwareWalletError') {
      return toHardwareWalletError(error, HardwareWalletType.Ledger);
    }

    if (error && typeof error.statusCode === 'number' && error.statusCode > 0) {
      const statusCodeHex = `0x${error.statusCode.toString(16)}`;
      if (isKnownLedgerError(statusCodeHex)) {
        return createLedgerError(statusCodeHex);
      }
      return new TransportStatusError(error.statusCode);
    }

    if (error?.message) {
      return new Error(error.message, { cause: error });
    }

    return new Error('Unknown Ledger error occurred', { cause: rawError });
  }

  #extractError(
    response: LedgerOffscreenResponse<unknown> | undefined,
  ): unknown {
    if (
      response?.payload &&
      typeof response.payload === 'object' &&
      'error' in response.payload
    ) {
      return response.payload.error;
    }
    return response?.error;
  }
}
