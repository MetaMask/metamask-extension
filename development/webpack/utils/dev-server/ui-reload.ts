import type { Compiler } from 'webpack';
import type WebpackDevServer from 'webpack-dev-server';
import { UI_RELOAD_CLIENT_ENTRY_NAME } from './reload-protocol';
import { getClientEntry } from './websocket';

/**
 * Registers the UI reload client entry on each compiler.
 * `HtmlBundlerPlugin.beforeEmit` injects the reload client into every UI page,
 * where it asks the UI runtime to check for hot updates. The stock React
 * Refresh entry and runtime bridge are prepended to the actual UI entry by
 * `reactRefreshLoader`.
 *
 * Whether a build only reloads the UI pages or the whole extension is decided
 * per build in `setupBackgroundReload`; deciding in one place is what keeps a
 * page reload from racing a background reload.
 *
 * @param devServer - The running webpack dev server.
 * @param compilers - The compilers attached to the dev server.
 */
export function setupUiReload(
  devServer: WebpackDevServer,
  compilers: Compiler[],
): void {
  const uiClientEntry = getClientEntry(devServer, 'ui-reload-client.ts');

  for (const compiler of compilers) {
    new compiler.webpack.EntryPlugin(compiler.context, uiClientEntry, {
      name: UI_RELOAD_CLIENT_ENTRY_NAME,
      chunkLoading: false,
    }).apply(compiler);
  }
}
