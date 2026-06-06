import {
  GetAppNameAndVersionResponse,
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
 */
export class LedgerOffscreenBridge implements LedgerBridge<LedgerOffscreenBridgeOptions> {
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
    const MAX_RETRIES = 2;
    let lastError: Error | null = null;

    console.debug('[LedgerBridge] #sendMessage', JSON.stringify({
      action: message.action,
      hasParams: Boolean(message.params),
      timeout: timeout ?? 'none',
    }));

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await this.#attemptSendMessage<TAction, ResponsePayload>(
          message,
          { timeout },
        );
        console.debug('[LedgerBridge] #sendMessage succeeded', JSON.stringify({
          action: message.action,
          attempt,
        }));
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const isOffscreenUnavailable =
          lastError.message.includes('Receiving end does not exist') ||
          lastError.message.includes('Could not establish connection');

        console.warn('[LedgerBridge] #sendMessage attempt failed', JSON.stringify({
          action: message.action,
          attempt,
          maxRetries: MAX_RETRIES,
          errorMessage: lastError.message,
          isOffscreenUnavailable,
        }));

        if (isOffscreenUnavailable && attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }

        throw lastError;
      }
    }

    throw lastError;
  }

  #attemptSendMessage<TAction extends LedgerAction, ResponsePayload>(
    message: IFrameMessage<TAction>,
    { timeout }: { timeout?: number } = {},
  ): Promise<ResponsePayload> {
    return new Promise((resolve, reject) => {
      let responseTimeout: ReturnType<typeof setTimeout>;

      if (timeout) {
        responseTimeout = setTimeout(() => {
          console.warn('[LedgerBridge] message timed out', JSON.stringify({
            action: message.action,
            timeout,
          }));
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
            console.error('[LedgerBridge] chrome.runtime.lastError set', JSON.stringify({
              action: message.action,
              lastError: chromeError,
              responseReceived: response !== undefined,
            }));
            reject(new Error(chromeError));
            return;
          }

          if (response?.success) {
            resolve(response.payload || response.success);
          } else {
            const error = response?.payload?.error;
            console.error('[LedgerBridge] offscreen responded with error', JSON.stringify({
              action: message.action,
              hasResponse: response !== undefined,
              responseSuccess: response?.success,
              errorStatusCode: error?.statusCode ?? null,
              errorMessage: error?.message ?? null,
              errorName: error?.name ?? null,
              errorExtra: error?.extra ?? null,
              rawResponse: response,
            }, null, 2));
            if (
              error &&
              typeof error.statusCode === 'number' &&
              error.statusCode > 0
            ) {
              reject(new TransportStatusError(error.statusCode));
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
