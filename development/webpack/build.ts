import { webpack } from 'webpack';
import type WebpackDevServerType from 'webpack-dev-server';
import {
  logWatchBuildStats,
  logStats,
  noop,
  setupGracefulWatchShutdown,
  suppressDevServerInfoLogs,
} from './utils/helpers';
import config from './webpack.config';
import { DEV_SERVER_OPTIONS } from './utils/constants';

// disable browserslist stats as it needlessly traverses the filesystem multiple
// times looking for a stats file that doesn't exist.
require('browserslist/node').getStat = noop;

/**
 * Builds the extension
 *
 * @param onComplete
 */
export function build(onComplete: () => void = noop) {
  // we need to strip `watch` from the options passed to webpack
  // because webpack-dev-server calls `compiler.watch()` itself.
  const { watch, ...options } = config;
  const compiler = webpack(options);
  console.error(`🦊 Running ${config.mode} build…`);
  if (watch) {
    suppressDevServerInfoLogs(compiler);
    logWatchBuildStats(compiler, '🦊 Watching for changes…');
    const WebpackDevServer: typeof WebpackDevServerType = require('webpack-dev-server');
    const server = new WebpackDevServer(DEV_SERVER_OPTIONS, compiler);
    if (options.cache && options.cache.type === 'filesystem') {
      setupGracefulWatchShutdown({ compiler, server });
    }
    server
      .start()
      .catch((error: unknown) => {
        console.error(
          `🦊 Failed to start dev server on ${server.options.host ?? 'localhost'}:${server.options.port ?? '(auto)'}.`,
        );
        console.error(error);
        process.exit(1);
      });
  } else {
    compiler.run((err, stats) => {
      logStats(err ?? undefined, stats);
      // `onComplete` must be called synchronously _before_ `compiler.close`
      // or the caller might observe output from the `close` command.
      onComplete();
      compiler.close(noop);
    });
  }
}
