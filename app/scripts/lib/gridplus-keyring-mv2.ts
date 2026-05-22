import {
  GridPlusKeyring,
  type KeyringOptions,
  type OpenConnectCallback,
} from '@gridplus/keyring';
import browser from 'webextension-polyfill';
import {
  getGridPlusConnectApiBaseUrl,
  getGridPlusConnectPageUrl,
  type GridPlusConnectResult,
  prepareGridPlusConnectUrl,
  validateGridPlusConnectMessage,
} from './gridplus-connect';
import { normalizeGridPlusKeyringState } from './gridplus-keyring-state';

type ConnectorWindow = {
  type: 'window';
  target: Window;
};

type ConnectorTab = {
  type: 'tab';
  id: number;
};

type ConnectorTarget = ConnectorWindow | ConnectorTab;

async function openConnectorTarget(url: string): Promise<ConnectorTarget> {
  const browserWindow = window.open(url, '_blank');
  if (browserWindow) {
    return {
      type: 'window',
      target: browserWindow,
    };
  }

  if (browser.tabs?.create) {
    const tab = await browser.tabs.create({ url });
    if (typeof tab.id === 'number') {
      return {
        type: 'tab',
        id: tab.id,
      };
    }
  }

  throw new Error('Failed to open GridPlus Connect.');
}

async function isConnectorClosed(target: ConnectorTarget): Promise<boolean> {
  if (target.type === 'window') {
    return target.target.closed;
  }

  try {
    await browser.tabs.get(target.id);
    return false;
  } catch {
    return true;
  }
}

async function closeConnectorTarget(target: ConnectorTarget): Promise<void> {
  try {
    if (target.type === 'window') {
      target.target.close();
      return;
    }

    await browser.tabs.remove(target.id);
  } catch {
    // Ignore close errors.
  }
}

function createOpenConnectCallback(): OpenConnectCallback {
  return async (connectUrl: string): Promise<GridPlusConnectResult> => {
    const extensionOrigin = chrome.runtime.getURL('').replace(/\/$/u, '');
    const parsedConnectUrl = prepareGridPlusConnectUrl(
      connectUrl,
      extensionOrigin,
    );

    const connectorTarget = await openConnectorTarget(
      parsedConnectUrl.url.toString(),
    );

    return await new Promise<GridPlusConnectResult>((resolve, reject) => {
      let finished = false;
      let listenInterval: ReturnType<typeof setInterval> | null = null;
      let handleMessage: ((event: MessageEvent) => void) | null = null;

      const cleanup = () => {
        if (listenInterval !== null) {
          clearInterval(listenInterval);
          listenInterval = null;
        }

        if (handleMessage) {
          window.removeEventListener('message', handleMessage);
          handleMessage = null;
        }
      };

      const fail = (reason: string) => {
        if (finished) {
          return;
        }

        finished = true;
        cleanup();
        reject(new Error(reason));
      };

      const succeed = (result: GridPlusConnectResult) => {
        if (finished) {
          return;
        }

        finished = true;
        cleanup();
        closeConnectorTarget(connectorTarget).catch(() => undefined);
        resolve(result);
      };

      listenInterval = setInterval(() => {
        isConnectorClosed(connectorTarget)
          .then((closed) => {
            if (closed) {
              fail('GridPlus Connect closed.');
            }
          })
          .catch(() => fail('GridPlus Connect closed.'));
      }, 500);

      handleMessage = (event: MessageEvent) => {
        if (connectorTarget.type !== 'window') {
          return;
        }

        if (
          event.origin !== parsedConnectUrl.expectedOrigin ||
          event.source !== connectorTarget.target
        ) {
          return;
        }

        const validation = validateGridPlusConnectMessage(event.data, {
          expectedClient: parsedConnectUrl.expectedClient,
          expectedRequestId: parsedConnectUrl.expectedRequestId,
        });

        if (validation.status === 'ignore') {
          return;
        }

        if (validation.status === 'error') {
          fail(validation.error);
          return;
        }

        succeed(validation.result);
      };

      window.addEventListener('message', handleMessage, false);
    });
  };
}

export class GridPlusKeyringMV2 extends GridPlusKeyring {
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

GridPlusKeyringMV2.type = GridPlusKeyring.type;
