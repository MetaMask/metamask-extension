/**
 * @file Dev-server wiring for the UI reload client — webpack-dev-server's own
 * live-reload client, which reloads UI pages in place with `location.reload()`
 * when their code changes. The privileged surfaces (background/service worker,
 * content scripts, offscreen) can't reload themselves that way; they are
 * handled by the background reload instead (`utils/background-reload`).
 *
 * Only wired up while the dev server runs (`--watch`), so none of it ships in
 * production builds.
 */

import type { Compiler } from 'webpack';
import type WebpackDevServer from 'webpack-dev-server';
import { getDevServerClientUrl } from './helpers';

/**
 * Entry name for the UI reload client. Used by `ManifestPlugin` to mark the
 * entry self-contained and by `HtmlBundlerPlugin.beforeEmit` to look up its
 * output filename for `<script>` injection into UI pages.
 */
export const UI_RELOAD_CLIENT_ENTRY_NAME = 'ui-reload-client';

/**
 * Registers the UI reload client as a webpack entry on each compiler.
 * `HtmlBundlerPlugin.beforeEmit` injects its output as a `<script>` into every
 * UI page; the client then reloads the page in place when it changes —
 * preserving background state.
 *
 * Called from `DEV_SERVER_OPTIONS.setupMiddlewares`, where the resolved
 * dev-server port is known (the client's connection URL embeds it).
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
