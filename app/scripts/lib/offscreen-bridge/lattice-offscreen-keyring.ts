import {
  GridPlusKeyring,
  type KeyringOptions,
  type OpenConnectCallback,
} from '@gridplus/keyring';
import {
  OffscreenCommunicationTarget,
} from '../../../../shared/constants/offscreen-communication';
import {
  getGridPlusConnectApiBaseUrl,
  getGridPlusConnectPageUrl,
  type GridPlusConnectResult,
  prepareGridPlusConnectUrl,
} from '../gridplus-connect';
import { normalizeGridPlusKeyringState } from '../gridplus-keyring-state';

/**
 * GridPlus keyring wrapper for MV3 service workers.
 *
 * MV3 service workers cannot open tabs through `window.open`, so this wrapper
 * injects an `openConnect` callback that asks the offscreen document to run the
 * browser-tab portion of the GridPlus Connect flow.
 */
class LatticeKeyringOffscreen extends GridPlusKeyring {
  static type: string;

  constructor(opts: KeyringOptions = {}) {
    super({
      ...opts,
      api: {
        ...opts.api,
        baseUrl: opts.api?.baseUrl ?? getGridPlusConnectApiBaseUrl(),
      },
      connectPageUrl: opts.connectPageUrl ?? getGridPlusConnectPageUrl(),
      state: normalizeGridPlusKeyringState(opts.state),
      openConnect: opts.openConnect ?? createOpenConnectCallback(),
    });
  }

  async deserialize(opts?: KeyringOptions['state']): Promise<void> {
    await super.deserialize(normalizeGridPlusKeyringState(opts));
  }
}

function createOpenConnectCallback(): OpenConnectCallback {
  return async (connectUrl: string): Promise<GridPlusConnectResult> => {
    const extensionOrigin = chrome.runtime.getURL('').replace(/\/$/u, '');
    const { url } = prepareGridPlusConnectUrl(connectUrl, extensionOrigin);

    const result = await new Promise<GridPlusConnectResult>(
      (resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            target: OffscreenCommunicationTarget.latticeOffscreen,
            params: {
              url: url.toString(),
            },
          },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }

            if (response?.error) {
              reject(
                response.error instanceof Error
                  ? response.error
                  : new Error(String(response.error)),
              );
              return;
            }

            if (!response?.result?.deviceId || !response.result.sessionKey) {
              reject(new Error('Invalid credentials returned from Connect.'));
              return;
            }

            resolve(response.result);
          },
        );
      },
    );

    if (!result.deviceId || !result.sessionKey) {
      throw new Error('Invalid credentials returned from Connect.');
    }

    return result;
  };
}

LatticeKeyringOffscreen.type = GridPlusKeyring.type;

export { LatticeKeyringOffscreen };
