import type { Compilation, Compiler, Stats } from 'webpack';
import type { Configuration } from 'webpack-dev-server';
import { logStats } from '../helpers';
import { setupUiClient, type UiClientRule } from './setup-ui-client';
import { setupBackgroundClient } from './setup-background-client';

export function getDevServerOptions({
  uiClientRule,
}: {
  uiClientRule: UiClientRule;
}): Configuration {
  return {
    // Keep WDS from injecting its HMR runtime into every extension entry.
    // We manually wire React Refresh mode into the UI entrypoints.
    hot: false,
    // We use our own logic to decide when to hot-update UI pages or reload the extension.
    liveReload: false,
    // always use loopback, as 0.0.0.0 tends to fail on some machines (WSL2?)
    host: 'localhost',
    // pick a free port at startup.
    port: 'auto',
    // client injection is disabled because clients are registered by `setupMiddlewares` below.
    client: false,
    devMiddleware: {
      // browsers need actual files on disk; extension pages are loaded via
      // `chrome-extension://`, not from the dev-server HTTP origin.
      writeToDisk: true,
    },
    // we don't need/have a "static" directory, so disable it
    static: false,
    allowedHosts: 'all',
    // Wire up the UI and background clients here so that we can read the resolved port from
    // `devServer.options` — by this point `port: 'auto'` has been replaced with
    // the actual numeric port the server is listening on.
    setupMiddlewares: (middlewares, devServer) => {
      const compilers =
        'compilers' in devServer.compiler
          ? devServer.compiler.compilers
          : [devServer.compiler];
      // Registers the UI client into UI pages.
      setupUiClient(devServer, compilers, { rule: uiClientRule });
      // Registers the background client into the background/service worker context.
      setupBackgroundClient(devServer, compilers);
      return middlewares;
    },
  };
}

/**
 * Injects an entrypoint's files as `<script>` tags into an HTML page, just before `</head>`.
 *
 * @param content - The HTML page content.
 * @param compilation - The current compilation.
 * @param entryName - The entrypoint whose files to inject.
 * @returns The HTML content with the entrypoint's files injected.
 */
export const injectEntryScripts = (
  content: string,
  compilation: Compilation,
  entryName: string,
): string => {
  const entrypoint = compilation.entrypoints.get(entryName);
  if (!entrypoint) {
    throw new Error(
      `Entry "${entryName}" is missing from the compilation, it should have been registered before running injectEntryScripts.`,
    );
  }
  const tags = entrypoint
    .getFiles()
    .filter((file) => file.endsWith('.js') && !file.includes('.hot-update.'))
    .map((file) => `<script src="${file}" defer></script>`)
    .join('');
  return content.replace('</head>', `${tags}</head>`);
};

/**
 * Suppresses routine webpack-dev-server info logs while leaving warnings and
 * errors visible.
 *
 * webpack-dev-server logs startup and shutdown banners through webpack's
 * infrastructure logger. Those banners interrupt webpack's progress status
 * line, so the webpack launcher prints its own concise watch message instead.
 *
 * @param compiler - The webpack compiler.
 */
export function suppressDevServerInfoLogs(compiler: Compiler): void {
  compiler.hooks.infrastructureLog.tap(
    'MetaMaskDevServerInfoLogSuppressor',
    (name, type) =>
      name === 'webpack-dev-server' && type === 'info' ? true : undefined,
  );
}

/**
 * Logs watch-mode build stats and writes a line once the build is ready for
 * more changes.
 *
 * webpack-dev-server starts listening before webpack finishes the initial
 * compilation. Hooking the compiler completion keeps the output aligned with
 * webpack watch mode: stats first, then the watch-ready line.
 *
 * @param compiler - The webpack compiler.
 * @param message - The message to write.
 */
export function logWatchBuildStats(compiler: Compiler, message: string): void {
  const logBuild = (error?: Error | null, stats?: Stats) => {
    compiler.getInfrastructureLogger('webpack.Progress').status();
    logStats(error, stats);
    console.error(message);
  };

  compiler.hooks.done.tap('MetaMaskWatchBuildLogger', (stats) => {
    logBuild(undefined, stats);
  });
  compiler.hooks.failed.tap('MetaMaskWatchBuildLogger', (error) => {
    logBuild(error);
  });
}
