import { webpack } from 'webpack';
import type WebpackDevServerType from 'webpack-dev-server';
import { noop, logStats } from './utils/helpers';
import config from './webpack.config';
import { MODES } from './utils/constants';

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

  const { watch, ...options } = config;
  const compiler = webpack(options);
  if (isDevelopment && watch) {
    const WebpackDevServer: typeof WebpackDevServerType = require('webpack-dev-server');
    const serverOptions = {
      hot: false,
      liveReload: true,
      // always use loopback, as 0.0.0.0 tends to fail on some machines (WSL2?)
      host: 'localhost',
      // if you change the port here, also update the matching value in
      // `app/scripts/load/bootstrap.ts` — the bootstrap import URL hardcodes it
      port: 8080,
      // client injection is disabled because the live-reload client is wired up
      // explicitly from `app/scripts/load/bootstrap.ts` only for UI entries.
      client: false,
      devMiddleware: {
        // browsers need actual files on disk; extension pages are loaded via
        // `chrome-extension://`, not from the dev-server HTTP origin.
        writeToDisk: true,
      },
      // we don't need/have a "static" directory, so disable it
      static: false,
      allowedHosts: 'all',
    } as const satisfies WebpackDevServerType.Configuration;

    const server = new WebpackDevServer(serverOptions, compiler);
    server.start().then(() => console.log('🦊 Watching for changes…'));
  } else {
    console.error(`🦊 Running ${options.mode} build…`);
    if (watch) {
      // `--mode production --watch` falls through here: rebuild on change,
      // no dev server, no HMR.
      compiler.watch(options.watchOptions, (err, stats) => {
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
