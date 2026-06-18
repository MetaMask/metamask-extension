import type { Compiler } from 'webpack';
import type WebpackDevServer from 'webpack-dev-server';
import type { Configuration } from 'webpack-dev-server';
import { UI_RELOAD_CLIENT_ENTRY_NAME } from './reload-protocol';
import { getClientEntry } from './websocket';

const REACT_REFRESH_RUNTIME_CLIENT_ENTRY = require.resolve(
  './react-refresh-runtime-client',
);

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
 * Registers the UI reload client entry on each compiler. In standard watch
 * mode, `HtmlBundlerPlugin.beforeEmit` injects its output as a `<script>` into
 * every UI page. In React Refresh mode, the same client is injected into every
 * UI page and asks a guarded UI-runtime entry to check for hot updates.
 * Whether a build only reloads the UI pages or the whole extension is decided per build in
 * `setupBackgroundReload` — deciding in one place is what keeps a page reload from racing a background reload.
 *
 * @param devServer - The running webpack dev server.
 * @param compilers - The compilers attached to the dev server.
 * @param options - UI dev-server client options.
 * @param options.reactRefresh - Whether to skip the custom page reload client
 * and use React Refresh HMR instead.
 */
export function setupUiReload(
  devServer: WebpackDevServer,
  compilers: Compiler[],
  {
    reactRefresh = false,
  }: {
    reactRefresh?: boolean;
  } = {},
): void {
  const devServerClientEntry = getDevServerClientEntry(devServer.options);
  for (const compiler of compilers) {
    if (reactRefresh) {
      new compiler.webpack.EntryPlugin(
        compiler.context,
        REACT_REFRESH_RUNTIME_CLIENT_ENTRY,
        {},
      ).apply(compiler);
      new compiler.webpack.EntryPlugin(
        compiler.context,
        `${getClientEntry(devServer, 'ui-reload-client.ts')}&reactRefresh=true`,
        {
          name: UI_RELOAD_CLIENT_ENTRY_NAME,
          chunkLoading: false,
        },
      ).apply(compiler);
      continue;
    }

    new compiler.webpack.EntryPlugin(compiler.context, devServerClientEntry, {
      name: UI_RELOAD_CLIENT_ENTRY_NAME,
      chunkLoading: false,
    }).apply(compiler);
    // Merged into the same entry (and thus the same injected `<script>`); pass
    // only `name` so webpack doesn't see conflicting entry options.
    new compiler.webpack.EntryPlugin(
      compiler.context,
      getClientEntry(devServer, 'ui-reload-client.ts'),
      {
        name: UI_RELOAD_CLIENT_ENTRY_NAME,
      },
    ).apply(compiler);
  }
}
