import type { Compiler } from 'webpack';
import type WebpackDevServer from 'webpack-dev-server';
import type { Configuration } from 'webpack-dev-server';
import { UI_RELOAD_CLIENT_ENTRY_NAME } from './reload-protocol';
import { getClientEntry } from './websocket';

/**
 * Builds the webpack entry for webpack-dev-server's client from a
 * dev-server config. webpack preserves the query string as `__resourceQuery`,
 * which the client reads at runtime to know where to connect.
 *
 * Only fields that are set are forwarded; anything omitted falls back to
 * webpack-dev-server's client defaults at runtime. `protocol=ws` is always
 * included because the extension page origin is `chrome-extension://...`,
 * so the client cannot auto-detect a WebSocket protocol.
 *
 * @param config - The webpack-dev-server configuration.
 * @returns The entry for the dev-server client.
 */
export const getDevServerClientEntry = (config: Configuration): string => {
  const params = new URLSearchParams({ protocol: 'ws' });
  if (config.host !== undefined) params.set('hostname', config.host);
  if (config.port !== undefined) params.set('port', config.port.toString());
  if (config.hot !== undefined) params.set('hot', config.hot.toString());
  if (config.liveReload !== undefined) {
    params.set('live-reload', config.liveReload.toString());
  }
  return `webpack-dev-server/client/index?${params}`;
};

/**
 * Registers the UI reload client entry on each compiler;
 * `HtmlBundlerPlugin.beforeEmit` injects its output as a `<script>` into every
 * UI page. The entry bundles two modules: the webpack-dev-server client,
 * and the UI reload client, which reloads the page when the dev server says to.
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
  const devServerClientEntry = getDevServerClientEntry(devServer.options);
  const uiClientEntry = getClientEntry(devServer, 'ui-reload-client.ts');
  for (const compiler of compilers) {
    new compiler.webpack.EntryPlugin(compiler.context, devServerClientEntry, {
      name: UI_RELOAD_CLIENT_ENTRY_NAME,
      chunkLoading: false,
    }).apply(compiler);
    // Merged into the same entry (and thus the same injected `<script>`); pass
    // only `name` so webpack doesn't see conflicting entry options.
    new compiler.webpack.EntryPlugin(compiler.context, uiClientEntry, {
      name: UI_RELOAD_CLIENT_ENTRY_NAME,
    }).apply(compiler);
  }
}
