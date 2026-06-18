import { UI_HOT_UPDATE_MESSAGE_TYPE } from './reload-protocol';

declare const require: (moduleName: string) => unknown;

const CLIENT_KEY = '__METAMASK_REACT_REFRESH_RUNTIME_CLIENT__';

type HotEmitter = EventTarget & {
  emit?: (eventName: string, hash: string) => void;
};

type HotUpdateMessage = {
  type: typeof UI_HOT_UPDATE_MESSAGE_TYPE;
  hash: string;
};

/**
 * Emits a Webpack hot-update signal in the current runtime.
 *
 * @param hotEmitter - Webpack's HMR event emitter for this runtime.
 * @param hash - The latest compilation hash.
 */
function emitHotUpdate(hotEmitter: HotEmitter, hash: string): void {
  if (typeof EventTarget !== 'undefined' && hotEmitter instanceof EventTarget) {
    hotEmitter.dispatchEvent(
      new CustomEvent('webpackHotUpdate', {
        detail: { currentHash: hash },
        bubbles: true,
        cancelable: false,
      }),
    );
    return;
  }
  hotEmitter.emit?.('webpackHotUpdate', hash);
}

/**
 * @returns Whether this runtime belongs to a React UI page, rather than the
 * standalone reload client or bootstrap runtime.
 */
function shouldInstallReactRefreshRuntimeClient(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  if (document.getElementById('app-content') === null) {
    return false;
  }

  const { currentScript } = document;
  const currentScriptSource =
    currentScript && 'src' in currentScript ? currentScript.src : '';

  return !/(?:^|\/)(?:bootstrap|ui-reload-client)(?:\.[^/]*)?\.js(?:$|[?#])/u.test(
    currentScriptSource,
  );
}

const globalScope = globalThis as typeof globalThis & Record<string, unknown>;

if (
  shouldInstallReactRefreshRuntimeClient() &&
  globalScope[CLIENT_KEY] !== true
) {
  globalScope[CLIENT_KEY] = true;

  const hotEmitter = require('webpack/hot/emitter') as HotEmitter;
  require('webpack/hot/dev-server');

  self.addEventListener('message', (event) => {
    if (event.source !== self) {
      return;
    }
    const data = event.data as Partial<HotUpdateMessage>;
    if (
      data?.type === UI_HOT_UPDATE_MESSAGE_TYPE &&
      typeof data.hash === 'string'
    ) {
      emitHotUpdate(hotEmitter, data.hash);
    }
  });
}
