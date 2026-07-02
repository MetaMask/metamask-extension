import { join } from 'node:path';
import type { Compiler } from 'webpack';
import type WebpackDevServer from 'webpack-dev-server';
import { getClientRequest } from './websocket';

/**
 * Prepends the React Refresh runtime and UI client to the UI entry on
 * each compiler. The client has to run inside the UI webpack runtime so that it
 * can ask that runtime to check for hot updates.
 *
 * Whether a build only updates the UI pages or reloads the whole extension is
 * decided per build in `setupBackgroundClient`; deciding in one place keeps a
 * UI update from racing an extension reload.
 *
 * @param devServer - The running webpack dev server.
 * @param compilers - The compilers attached to the dev server.
 */
export function setupUiClient(
  devServer: WebpackDevServer,
  compilers: Compiler[],
): void {
  for (const compiler of compilers) {
    compiler.options.module.rules.push({
      test: /\.ts$/u,
      include: join(compiler.context, 'scripts/load/ui.ts'),
      enforce: 'pre',
      use: {
        loader: require.resolve('../loaders/reactRefreshLoader'),
        options: {
          clientRequest: getClientRequest(devServer, 'ui-client.ts'),
        },
      },
    });
  }
}
