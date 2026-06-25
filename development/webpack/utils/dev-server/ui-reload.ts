import type { Compiler } from 'webpack';
import type WebpackDevServer from 'webpack-dev-server';
import { UI_RELOAD_CLIENT_ENTRY_NAME } from './reload-protocol';
import { getClientEntry } from './websocket';

const REACT_REFRESH_RUNTIME_CLIENT_ENTRY =
  require.resolve('./react-refresh-runtime-client');

/**
 * Registers the React Refresh runtime client and UI reload client entry on
 * each compiler. `HtmlBundlerPlugin.beforeEmit` injects the reload client into
 * every UI page, where it asks a guarded UI runtime entry to check for hot updates.
 * Whether a build only reloads the UI pages or the whole extension is decided per build in
 * `setupBackgroundReload` — deciding in one place is what keeps a page reload from racing a background reload.
 *
 * @param devServer - The running webpack dev server.
 * @param compilers - The compilers attached to the dev server.
 */
export function setupUiReload(
  devServer: WebpackDevServer,
  compilers: Compiler[],
): void {
  for (const compiler of compilers) {
    new compiler.webpack.EntryPlugin(
      compiler.context,
      REACT_REFRESH_RUNTIME_CLIENT_ENTRY,
      {},
    ).apply(compiler);
    new compiler.webpack.EntryPlugin(
      compiler.context,
      getClientEntry(devServer, 'ui-reload-client.ts'),
      {
        name: UI_RELOAD_CLIENT_ENTRY_NAME,
        chunkLoading: false,
      },
    ).apply(compiler);
  }
}
