// eslint-disable-next-line @typescript-eslint/no-shadow
import { WebSocket, WebSocketServer } from 'ws';

class LocalWebSocketServer {
  private static instance: LocalWebSocketServer; // Singleton instance

  private server: WebSocketServer | null = null; // WebSocket server instance

  private static readonly port = 8088;

  private websocketConnections: WebSocket[] = []; // Track active connections

  /**
   * Get the singleton instance of the LocalWebSocketServer
   *
   * @returns The singleton instance of LocalWebSocketServer
   */
  public static getServerInstance(): LocalWebSocketServer {
    if (!LocalWebSocketServer.instance) {
      LocalWebSocketServer.instance = new LocalWebSocketServer();
    }
    return LocalWebSocketServer.instance;
  }

  public getServer(): WebSocketServer {
    if (!this.server) {
      throw new Error('WebSocket server has not been started yet.');
    }
    return this.server;
  }

  /**
   * Start the WebSocket server
   */
  public start(): void {
    if (this.server) {
      console.log(
        `WebSocket server is already running on ws://localhost:${LocalWebSocketServer.port}`,
      );
      return; // Do nothing if the server is already running
    }

    this.server = new WebSocketServer({ port: LocalWebSocketServer.port });

    this.server.on('connection', (socket: WebSocket) => {
      console.log('Client connected to the WebSocket server');
      this.websocketConnections.push(socket);

      // Handle client disconnection
      socket.addEventListener('close', () => {
        console.log('Client disconnected from the WebSocket server');
        const index = this.websocketConnections.indexOf(socket);
        if (index > -1) {
          this.websocketConnections.splice(index, 1);
        }
      });

      socket.on('message', (data) => {
        console.log('Message received from client:', data.toString());
        // Echo the message back to the client (pure WebSocket server behavior)
        socket.send(data.toString());
      });
    });

    console.log(
      `WebSocket server running on ws://localhost:${LocalWebSocketServer.port}`,
    );
  }

  /**
   * Stop the WebSocket server
   */
  public stop(): void {
    if (this.server) {
      this.server.close(() => {
        console.log(
          `WebSocket server stopped on ws://localhost:${LocalWebSocketServer.port}`,
        );
      });
      this.server = null;
    } else {
      console.log('WebSocket server is not running');
    }
  }

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
   * Get the count of active WebSocket connections
   *
   * @returns The number of active connections
   */
  public getWebsocketConnectionCount(): number {
    if (!this.server) {
      return 0;
    }
    const serverClientCount = this.server.clients.size;
    console.log(
      `Server has ${serverClientCount} clients, tracked array has ${this.websocketConnections.length}`,
    );
    return serverClientCount;
  }

  /**
   * Stop the WebSocket server and close all connections
   */
  public async stopAndCleanup(): Promise<void> {
    if (!this.server) {
      console.log('WebSocket server is not running');
      return;
    }

    const serverClients = Array.from(this.server.clients);
    console.log(`Found ${serverClients.length} active server clients`);

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
        console.warn('Error closing server client:', error);
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
        console.warn('Error closing tracked websocket connection:', error);
      }
    }

    this.websocketConnections = [];

    // Stop the server
    this.stop();

    // Force reset the singleton instance to ensure fresh server for next test
    // @ts-expect-error - accessing private static property for cleanup
    LocalWebSocketServer.instance = undefined;

    // Give a delay to ensure all connections are fully closed
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

export default LocalWebSocketServer;
