// eslint-disable-next-line @typescript-eslint/no-shadow
import { WebSocket, WebSocketServer } from 'ws';

/**
 * A local WebSocket server for e2e tests.
 *
 * Each instance manages its own port, connections, and lifecycle.
 * Instances are created by the WebSocketRegistry — one per service
 * (Solana, AccountActivity, etc.).
 */
class LocalWebSocketServer {
  private readonly name: string;

  private readonly port: number;

  private server: WebSocketServer | null = null;

  private websocketConnections: WebSocket[] = [];

  constructor(name: string, port: number) {
    this.name = name;
    this.port = port;
  }

  /**
   * Get the underlying WebSocketServer instance.
   *
   * @returns The ws WebSocketServer
   */
  public getServer(): WebSocketServer {
    if (!this.server) {
      throw new Error(
        `WebSocket server '${this.name}' has not been started yet.`,
      );
    }
    return this.server;
  }

  /**
   * Start the WebSocket server.
   * The base server only tracks connections. Protocol-specific message
   * handling is added by each service's setup function.
   */
  public start(): void {
    if (this.server) {
      console.log(
        `[${this.name}] WebSocket server is already running on ws://localhost:${this.port}`,
      );
      return;
    }

    this.server = new WebSocketServer({ port: this.port });

    this.server.on('connection', (socket: WebSocket) => {
      console.log(
        `[${this.name}] Client connected to ws://localhost:${this.port}`,
      );
      this.websocketConnections.push(socket);

      socket.addEventListener('close', () => {
        console.log(
          `[${this.name}] Client disconnected from ws://localhost:${this.port}`,
        );
        const index = this.websocketConnections.indexOf(socket);
        if (index > -1) {
          this.websocketConnections.splice(index, 1);
        }
      });
    });

    console.log(
      `[${this.name}] WebSocket server running on ws://localhost:${this.port}`,
    );
  }

  /**
   * Stop the WebSocket server.
   */
  public stop(): void {
    if (this.server) {
      this.server.close(() => {
        console.log(
          `[${this.name}] WebSocket server stopped on ws://localhost:${this.port}`,
        );
      });
      this.server = null;
    } else {
      console.log(`[${this.name}] WebSocket server is not running`);
    }
  }

  /**
   * Broadcast a message to all connected clients.
   *
   * @param message - The message string to send
   */
  public sendMessage(message: string): void {
    if (this.server) {
      this.server.clients.forEach((client: WebSocket) => {
        if (client.readyState === 1) {
          // 1 === WebSocket.OPEN
          client.send(message);
        }
      });
    }
  }

  /**
   * Get the count of active WebSocket connections.
   *
   * @returns The number of active connections
   */
  public getWebsocketConnectionCount(): number {
    if (!this.server) {
      return 0;
    }
    const serverClientCount = this.server.clients.size;
    console.log(
      `[${this.name}] Server has ${serverClientCount} clients, tracked array has ${this.websocketConnections.length}`,
    );
    return serverClientCount;
  }

  /**
   * Get the name of this server instance.
   *
   * @returns The service name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Get the port of this server instance.
   *
   * @returns The port number
   */
  public getPort(): number {
    return this.port;
  }

  /**
   * Stop the WebSocket server and close all connections.
   */
  public async stopAndCleanup(): Promise<void> {
    if (!this.server) {
      console.log(`[${this.name}] WebSocket server is not running`);
      return;
    }

    const serverClients = Array.from(this.server.clients);
    console.log(
      `[${this.name}] Found ${serverClients.length} active server clients`,
    );

    // Close all client connections
    for (const client of serverClients) {
      try {
        if (
          client.readyState === client.OPEN ||
          client.readyState === client.CONNECTING
        ) {
          client.close();
        }
      } catch (error) {
        console.warn(`[${this.name}] Error closing server client:`, error);
      }
    }

    // Clean up tracked connections
    for (const socket of this.websocketConnections) {
      try {
        if (
          socket.readyState === socket.OPEN ||
          socket.readyState === socket.CONNECTING
        ) {
          socket.close();
        }
      } catch (error) {
        console.warn(
          `[${this.name}] Error closing tracked websocket connection:`,
          error,
        );
      }
    }

    this.websocketConnections = [];

    // Stop the server
    this.stop();

    // Give a delay to ensure all connections are fully closed
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

export default LocalWebSocketServer;
