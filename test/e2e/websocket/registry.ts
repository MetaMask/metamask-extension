import type { WebSocketMessageMock } from '../tests/solana/mocks/websocketDefaultMocks';
import LocalWebSocketServer from './server';

/**
 * Setup function signature for websocket mock handlers.
 * Each mock file exports a function matching this shape.
 *
 * @param server - The LocalWebSocketServer instance (already started)
 * @param mocks - Per-test mock overrides (merged with defaults inside the setup fn)
 * @param options - Additional service-specific options
 */
type WebSocketSetupFn = (
  server: LocalWebSocketServer,
  mocks: WebSocketMessageMock[],
  options?: Record<string, unknown>,
) => Promise<void>;

export type WebSocketServiceConfig = {
  name: string;
  port: number;
  setup: WebSocketSetupFn;
};

type WebSocketEntry = {
  port: number;
  setupFn: WebSocketSetupFn;
  server: LocalWebSocketServer | null;
};

/**
 * Central registry for all WebSocket mock servers used in e2e tests.
 *
 * Each mock file exports a `WebSocketServiceConfig`. Registration happens
 * explicitly in `helpers.js` — no hidden side effects.
 *
 * Adding a new websocket service:
 * 1. Create `websocket/<name>-mocks.ts`, export a `WebSocketServiceConfig`
 * 2. Import and register it in `helpers.js`
 * 3. Add WSS forwarding rule in `mock-e2e.js`
 */
class WebSocketRegistry {
  private static entries: Map<string, WebSocketEntry> = new Map();

  /**
   * Register a websocket service with the registry.
   *
   * @param config - Service configuration (name, port, setup function)
   */
  static register(config: WebSocketServiceConfig): void {
    if (WebSocketRegistry.entries.has(config.name)) {
      throw new Error(
        `WebSocket service '${config.name}' is already registered. Each service must have a unique name.`,
      );
    }
    WebSocketRegistry.entries.set(config.name, {
      port: config.port,
      setupFn: config.setup,
      server: null,
    });
  }

  /**
   * Start all registered servers and run their setup functions.
   *
   * @param overrides - Per-service mock overrides and options, keyed by service name.
   * Example: `{ solana: { mocks: [...] }, accountActivity: { mocks: [...], options: { chainsUp: [...] } } }`
   */
  static async startAll(
    overrides: Record<
      string,
      { mocks?: WebSocketMessageMock[]; options?: Record<string, unknown> }
    > = {},
  ): Promise<void> {
    const allEntries = Array.from(WebSocketRegistry.entries.entries());
    for (const [name, entry] of allEntries) {
      const server = new LocalWebSocketServer(name, entry.port);
      server.start();
      entry.server = server;

      const serviceOverrides = overrides[name] ?? {};
      await entry.setupFn(
        server,
        serviceOverrides.mocks ?? [],
        serviceOverrides.options,
      );
    }
  }

  /**
   * Stop and clean up all running servers.
   * Safe to call even if some servers were never started.
   */
  static async stopAll(): Promise<void> {
    const cleanupPromises: Promise<void>[] = [];

    const allValues = Array.from(WebSocketRegistry.entries.values());
    for (const entry of allValues) {
      if (entry.server) {
        cleanupPromises.push(
          entry.server.stopAndCleanup().then(() => {
            entry.server = null;
          }),
        );
      }
    }

    await Promise.allSettled(cleanupPromises);
  }

  /**
   * Get a running server instance by name.
   * Use in specs to send messages, check connection counts, etc.
   *
   * @param name - The registered service name
   * @returns The LocalWebSocketServer instance
   */
  static getServer(name: string): LocalWebSocketServer {
    const entry = WebSocketRegistry.entries.get(name);
    if (!entry) {
      throw new Error(
        `WebSocket service '${name}' is not registered. ` +
          `Available: ${Array.from(WebSocketRegistry.entries.keys()).join(', ')}`,
      );
    }
    if (!entry.server) {
      throw new Error(
        `WebSocket service '${name}' is registered but not started. ` +
          `Call WebSocketRegistry.startAll() first.`,
      );
    }
    return entry.server;
  }

  /**
   * Get the port for a registered service.
   * Use in mock-e2e.js to set up WSS forwarding rules.
   *
   * @param name - The registered service name
   * @returns The port number
   */
  static getPort(name: string): number {
    const entry = WebSocketRegistry.entries.get(name);
    if (!entry) {
      throw new Error(
        `WebSocket service '${name}' is not registered. ` +
          `Available: ${Array.from(WebSocketRegistry.entries.keys()).join(', ')}`,
      );
    }
    return entry.port;
  }

  /**
   * Reset the registry. Only needed for testing the registry itself.
   */
  static reset(): void {
    WebSocketRegistry.entries.clear();
  }
}

export default WebSocketRegistry;
