import type { Compiler, RuleSetRule } from 'webpack';
import type WebpackDevServer from 'webpack-dev-server';
import { getClientRequest } from './websocket';

export type UiClientRule = Pick<RuleSetRule, 'include' | 'test'>;

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
 * @param options - UI client setup options.
 * @param options.rule - Rule condition identifying the UI entry.
 */
export function setupUiClient(
  devServer: WebpackDevServer,
  compilers: Compiler[],
  { rule }: { rule: UiClientRule },
): void {
  for (const compiler of compilers) {
    compiler.options.module.rules.push({
      ...rule,
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
