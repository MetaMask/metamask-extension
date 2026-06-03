import type { WebSocketMessageMock } from './types';
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
  /** Optional cleanup function called during stopAll to reset module-level state. */
  onCleanup?: () => void;
};

type WebSocketEntry = {
  port: number;
  setupFn: WebSocketSetupFn;
  onCleanup?: () => void;
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
      onCleanup: config.onCleanup,
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
    await Promise.all(
      allEntries.map(async ([name, entry]) => {
        const server = new LocalWebSocketServer(name, entry.port);
        server.start();
        entry.server = server;

        const serviceOverrides = overrides[name] ?? {};
        await entry.setupFn(
          server,
          serviceOverrides.mocks ?? [],
          serviceOverrides.options,
        );
      }),
    );
  }

  /**
   * Stop and clean up all running servers.
   * Safe to call even if some servers were never started.
   */
  static async stopAll(): Promise<void> {
    const cleanupPromises: Promise<void>[] = [];

    const allValues = Array.from(WebSocketRegistry.entries.values());
    for (const entry of allValues) {
      if (entry.onCleanup) {
        entry.onCleanup();
      }
      if (entry.server) {
        cleanupPromises.push(
          entry.server.stopAndCleanup().finally(() => {
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
   * Get a snapshot of open connections across all running servers.
   *
   * @returns Array of objects with service name, port, and connection count
   */
  static getOpenConnections(): { name: string; port: number; count: number }[] {
    const connections: { name: string; port: number; count: number }[] = [];
    for (const [name, entry] of WebSocketRegistry.entries.entries()) {
      if (entry.server) {
        const count = entry.server.getWebsocketConnectionCount();
        if (count > 0) {
          connections.push({ name, port: entry.port, count });
        }
      }
    }
    return connections;
  }
}

export default WebSocketRegistry;
