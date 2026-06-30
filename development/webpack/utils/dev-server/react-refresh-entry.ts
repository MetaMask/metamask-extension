/* eslint-disable camelcase */

// This replaces `@pmmmwh/react-refresh-webpack-plugin/client/ReactRefreshEntry.js`.
// The plugin injects its entry into every Webpack runtime, but MetaMask has
// non-React extension runtimes such as background, bootstrap, and ui-reload-client
// scripts. Guard injection so React Refresh only installs on UI pages.

import { injectIntoGlobalHook } from 'react-refresh/runtime';

// Defined by `@pmmmwh/react-refresh-webpack-plugin` to namespace the injected
// runtime marker when multiple builds share the same page.
declare const __react_refresh_library__: string | undefined;

// UI pages also load these non-React runtimes, so skip React Refresh when this
// entry is evaluating inside one of those scripts.
const NON_REACT_RUNTIME_SCRIPT_FILES = ['bootstrap.js', 'ui-reload-client.js'];

/**
 * @returns Whether this entry is running in a React UI page script.
 */
function shouldInjectReactRefreshRuntime(): boolean {
  if (
    typeof document === 'undefined' ||
    document.getElementById('app-content') === null
  ) {
    return false;
  }

  const currentScriptSource = document.currentScript?.getAttribute('src');
  if (!currentScriptSource) {
    return true;
  }

  const currentScriptFileName =
    new URL(currentScriptSource, window.location.href).pathname
      .split('/')
      .pop();
  if (!currentScriptFileName) {
    return true;
  }

  return !NON_REACT_RUNTIME_SCRIPT_FILES.includes(currentScriptFileName);
}

if (
  process.env.NODE_ENV !== 'production' &&
  shouldInjectReactRefreshRuntime()
) {
  // Namespace the injected flag (if necessary) for monorepo compatibility
  const refreshInjectedKey = __react_refresh_library__
    ? `__reactRefreshInjected_${__react_refresh_library__}`
    : '__reactRefreshInjected';

  // Only inject the runtime if it hasn't been injected
  if (!Reflect.get(window, refreshInjectedKey)) {
    // Inject refresh runtime into global scope
    injectIntoGlobalHook(window);

    // Mark the runtime as injected to prevent double-injection
    Reflect.set(window, refreshInjectedKey, true);
  }
}
