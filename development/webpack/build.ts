import { webpack } from 'webpack';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import type WebpackDevServerType from 'webpack-dev-server';
import { noop, logStats, __HMR_READY__ } from './utils/helpers';
import config from './webpack.config';

// disable browserslist stats as it needlessly traverses the filesystem multiple
// times looking for a stats file that doesn't exist.
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
require('browserslist/node').getStat = noop;

/**
 * Builds the extension
 *
 * @param onComplete
 */
export function build(onComplete: () => void = noop) {
  const isDevelopment = config.mode === 'development';

  const { watch, ...options } = config;
  const compiler = webpack(options);
  if (__HMR_READY__ && watch) {
    // DISABLED BECAUSE WE AREN'T `__HMR_READY__` YET
    // Use `webpack-dev-server` to enable HMR
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    const WebpackDevServer: typeof WebpackDevServerType = require('webpack-dev-server');
    const serverOptions = {
      hot: isDevelopment,
      liveReload: isDevelopment,
      server: {
        // TODO: is there any benefit to using https?
        type: 'https',
      },
      // always use loopback, as 0.0.0.0 tends to fail on some machines (WSL2?)
      host: 'localhost',
      devMiddleware: {
        // browsers need actual files on disk
        writeToDisk: true,
      },
      // we don't need/have a "static" directory, so disable it
      static: false,
      allowedHosts: 'all',
    } as const satisfies WebpackDevServerType.Configuration;

    const server = new WebpackDevServer(serverOptions, compiler);
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    server.start().then(() => console.log('🦊 Watching for changes…'));
  } else {
    console.error(`🦊 Running ${options.mode} build…`);
    if (watch) {
      // once HMR is ready (__HMR_READY__ variable), this section should be removed.
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
      // eslint-disable-next-line id-denylist
      compiler.watch(options.watchOptions, (err, stats) => {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
        // eslint-disable-next-line id-denylist
        logStats(err ?? undefined, stats);
        console.error('🦊 Watching for changes…');
      });
    } else {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
      // eslint-disable-next-line id-denylist
      compiler.run((err, stats) => {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
        // eslint-disable-next-line id-denylist
        logStats(err ?? undefined, stats);
        // `onComplete` must be called synchronously _before_ `compiler.close`
        // or the caller might observe output from the `close` command.
        onComplete();
        compiler.close(noop);
      });
    }
  }
}
