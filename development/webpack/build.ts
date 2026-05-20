import { webpack } from 'webpack';
import type WebpackDevServerType from 'webpack-dev-server';
import { noop, logStats } from './utils/helpers';
import config from './webpack.config';
import { DEV_SERVER_OPTIONS, MODES } from './utils/constants';

// disable browserslist stats as it needlessly traverses the filesystem multiple
// times looking for a stats file that doesn't exist.
require('browserslist/node').getStat = noop;

/**
 * Builds the extension
 *
 * @param onComplete
 */
export function build(onComplete: () => void = noop) {
  const isDevelopment = config.mode === MODES.DEVELOPMENT;

  const compiler = webpack(config);
  if (isDevelopment && config.watch) {
    const WebpackDevServer: typeof WebpackDevServerType = require('webpack-dev-server');
    const server = new WebpackDevServer(DEV_SERVER_OPTIONS, compiler);
    server.start().then(() => console.log('🦊 Watching for changes…'));
  } else {
    console.error(`🦊 Running ${config.mode} build…`);
    if (config.watch) {
      // `--mode production --watch` falls through here: rebuild on change,
      // no dev server, no HMR.
      compiler.watch(config.watchOptions, (err, stats) => {
        logStats(err ?? undefined, stats);
        console.error('🦊 Watching for changes…');
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
}
