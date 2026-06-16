import { webpack } from 'webpack';
import type WebpackDevServerType from 'webpack-dev-server';
import {
  logStats,
  noop,
  ignoreCacheShutdownSignal,
  suppressDevServerInfoLogs,
} from './utils/helpers';
import config from './webpack.config';
import { DEV_SERVER_OPTIONS } from './utils/constants';
import {
  createAsteroidsBuildGame,
  getBuildStatusPrompt,
} from './utils/asteroids';

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
  const asteroids = createAsteroidsBuildGame(process);
  const logBuildComplete = async (
    err: Error | undefined,
    stats: Parameters<typeof logStats>[1],
    waitForResume: boolean,
    {
      beforeLog = noop,
      afterLog = noop,
    }: { beforeLog?: () => void; afterLog?: () => void } = {},
  ) => {
    if (!asteroids.isActive()) {
      beforeLog();
      logStats(err, stats);
      afterLog();
      return;
    }

    asteroids.suspendForBuildLog();
    beforeLog();
    logStats(err, stats);
    afterLog();
    await asteroids.showBuildStatus(getBuildStatusPrompt(err, stats), {
      waitForResume,
    });
  };
  console.error(`🦊 Running ${config.mode} build…`);
  if (watch) {
    suppressDevServerInfoLogs(compiler);
    const logWatchBuild = (error?: Error | null, stats?: Parameters<typeof logStats>[1]) => {
      void logBuildComplete(error ?? undefined, stats, false, {
        beforeLog: () =>
          compiler.getInfrastructureLogger('webpack.Progress').status(),
        afterLog: () => console.error('🦊 Watching for changes…'),
      });
    };
    compiler.hooks.done.tap('TerminalAsteroidsBuildGame', (stats) => {
      logWatchBuild(undefined, stats);
    });
    compiler.hooks.failed.tap('TerminalAsteroidsBuildGame', (error) => {
      logWatchBuild(error);
    });
    const WebpackDevServer: typeof WebpackDevServerType = require('webpack-dev-server');
    const server = new WebpackDevServer(DEV_SERVER_OPTIONS, compiler);
    server.start().catch((error: unknown) => {
      console.error(
        `🦊 Failed to start dev server on ${server.options.host ?? 'localhost'}:${server.options.port ?? '(auto)'}.`,
      );
      console.error(error);
      process.exit(1);
    });
  } else {
    compiler.run((err, stats) => {
      void (async () => {
        await logBuildComplete(err ?? undefined, stats, asteroids.isActive());
        asteroids.dispose();
        // Install before `onComplete` signals the parent process so shutdown
        // signals forwarded during that handoff cannot interrupt cache writes.
        const removeCacheShutdownSignalHandlers =
          options.cache.type === 'filesystem'
            ? ignoreCacheShutdownSignal(process)
            : noop;
        try {
          // `onComplete` must be called synchronously _before_ `compiler.close`
          // or the caller might observe output from the `close` command.
          onComplete();
          compiler.close(() => removeCacheShutdownSignalHandlers());
        } catch (error) {
          removeCacheShutdownSignalHandlers();
          throw error;
        }
      })().catch((error) => {
        asteroids.dispose();
        compiler.close(() => {
          throw error;
        });
      });
    });
  }
}
