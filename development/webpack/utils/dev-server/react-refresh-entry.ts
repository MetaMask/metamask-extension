/* eslint-disable camelcase */

declare const require: (moduleName: string) => unknown;
declare const __react_refresh_library__: string | undefined;

type ReactRefreshRuntime = {
  injectIntoGlobalHook(globalObject: typeof globalThis): void;
};

const safeThis = require(
  'core-js-pure/features/global-this',
) as typeof globalThis;
const RefreshRuntime = require(
  'react-refresh/runtime',
) as ReactRefreshRuntime;

/**
 * @returns Whether this entry is running in a React UI page script.
 */
function shouldInjectReactRefreshRuntime(): boolean {
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

if (
  process.env.NODE_ENV !== 'production' &&
  safeThis !== undefined &&
  shouldInjectReactRefreshRuntime()
) {
  let refreshInjectedKey = '__reactRefreshInjected';

  if (
    typeof __react_refresh_library__ !== 'undefined' &&
    __react_refresh_library__
  ) {
    refreshInjectedKey += `_${__react_refresh_library__}`;
  }

  const globalScope = safeThis as typeof globalThis & Record<string, unknown>;

  if (!globalScope[refreshInjectedKey]) {
    RefreshRuntime.injectIntoGlobalHook(safeThis);
    globalScope[refreshInjectedKey] = true;
  }
}

export {};
