import { resolve } from 'node:path';
import type { Compiler } from 'webpack';
import type WebpackDevServer from 'webpack-dev-server';

/**
 * @param devServer - The running webpack dev server.
 * @returns The WebSocket URL the dev server clients connect to. Must
 * be read after the server has started: `port: 'auto'` is only resolved to
 * the actual port then.
 */
function getWebSocketUrl(devServer: WebpackDevServer): string {
  const { host, port } = devServer.options;
  return `ws://${host ?? 'localhost'}:${port}/ws`;
}

/**
 * Builds the webpack request for a dev-server client: the client module's
 * absolute path with the dev server's WebSocket URL in its query. webpack
 * preserves the query as `__resourceQuery`, which the client reads at runtime
 * to know where to connect.
 *
 * @param devServer - The running webpack dev server.
 * @param filename - The client module's filename, relative to this directory.
 * @returns The request for the client module.
 */
export function getClientRequest(
  devServer: WebpackDevServer,
  filename: string,
): string {
  const webSocketUrl = getWebSocketUrl(devServer);
  return `${resolve(__dirname, filename)}?url=${encodeURIComponent(webSocketUrl)}`;
}

/**
 * Creates an announcer for one WebSocket message type: a function that
 * records the latest value per compiler and announces the combined state — to
 * all connected clients, and to every client that connects later.
 * Announcements are state, not events: a client that was disconnected while a
 * build completed (an idle-terminated MV3 service worker, a page mid-reload)
 * still receives the current state on (re)connect and converges, instead of
 * missing a one-shot message.
 *
 * @param devServer - The running webpack dev server.
 * @param messageType - The WebSocket message type to announce with.
 * @returns The announcer: records `value` as `compiler`'s latest and
 * broadcasts the combined payload.
 */
export function createAnnouncer(
  devServer: WebpackDevServer,
  messageType: string,
): (compiler: Compiler, value: string) => void {
  // The latest value per compiler, combined into the announced payload.
  const values = new Map<Compiler, string>();
  let announced: string | undefined;
  let connectionListenerInstalled = false;

  return (compiler, value) => {
    values.set(compiler, value);
    const server = devServer.webSocketServer;
    if (!server) {
      // Not created yet (it appears early in `WebpackDevServer.start()`, long
      // before the first build finishes); the next build re-announces.
      return;
    }
    if (!connectionListenerInstalled) {
      connectionListenerInstalled = true;
      // Push the current state to every (re)connecting client.
      // `implementation` is the underlying `ws` server (the default
      // transport).
      server.implementation.on('connection', (socket) => {
        if (announced !== undefined) {
          devServer.sendMessage([socket], messageType, announced);
        }
      });
    }
    // Sort so the payload doesn't depend on which compiler finished last.
    announced = [...values.values()].sort().join('|');
    devServer.sendMessage(server.clients, messageType, announced);
  };
}
