import type { Compiler } from 'webpack';
import type WebpackDevServer from 'webpack-dev-server';
import type { Configuration } from 'webpack-dev-server';

/**
 * Entry name for the UI reload client. Used by `ManifestPlugin` to mark the
 * entry self-contained and by `HtmlBundlerPlugin.beforeEmit` to look up its
 * output filename for `<script>` injection into UI pages.
 */
export const UI_RELOAD_CLIENT_ENTRY_NAME = 'ui-reload-client';

/**
 * Builds the webpack-dev-server client import URL from a
 * dev-server config. webpack preserves the query string as `__resourceQuery`,
 * which the client reads at runtime to know where to connect.
 *
 * Only fields that are set are forwarded; anything omitted falls back to
 * webpack-dev-server's client defaults at runtime. `protocol=ws` is always
 * included because the extension page origin is `chrome-extension://...`,
 * so the client cannot auto-detect a WebSocket protocol.
 *
 * @param config - The webpack-dev-server configuration.
 * @returns The import specifier for the dev-server client.
 */
export const getDevServerClientUrl = (config: Configuration): string => {
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
 * Registers the UI reload client as a webpack entry on each compiler.
 * `HtmlBundlerPlugin.beforeEmit` injects its output as a `<script>` into every
 * UI page; the client then reloads the page in place when it changes —
 * preserving background state.
 *
 * @param devServer - The running webpack dev server.
 * @param compilers - The compilers attached to the dev server.
 */
export function setupUiReload(
  devServer: WebpackDevServer,
  compilers: Compiler[],
): void {
  const url = getDevServerClientUrl(devServer.options);
  for (const compiler of compilers) {
    new compiler.webpack.EntryPlugin(compiler.context, url, {
      name: UI_RELOAD_CLIENT_ENTRY_NAME,
      chunkLoading: false,
    }).apply(compiler);
  }
}
