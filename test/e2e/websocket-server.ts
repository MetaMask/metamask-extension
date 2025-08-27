// eslint-disable-next-line @typescript-eslint/no-shadow
import { WebSocket, WebSocketServer } from 'ws';

class WebSocketLocalServer {
  private static instance: WebSocketLocalServer; // Singleton instance

  private server: WebSocketServer | null = null; // WebSocket server instance

  private port: number;

  private constructor(port: number) {
    this.port = port;
  }

  /**
   * Get the singleton instance of the WebSocketLocalServer
   *
   * @param port - The port to run the WebSocket server on
   * @returns The singleton instance of WebSocketLocalServer
   */
  public static getServerInstance(port: number): WebSocketLocalServer {
    if (!WebSocketLocalServer.instance) {
      WebSocketLocalServer.instance = new WebSocketLocalServer(port);
    }
    return WebSocketLocalServer.instance;
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
        `WebSocket server is already running on ws://localhost:${this.port}`,
      );
      return; // Do nothing if the server is already running
    }

    this.server = new WebSocketServer({ port: this.port });

    this.server.on('connection', (socket: WebSocket) => {
      console.log('Client connected to the WebSocket server');

      socket.on('message', (data) => {
        console.log('Message received from client:', data.toString());
        // Parse the incoming message
        const parsedMessage = JSON.parse(data.toString());

        // Check the content of the message and respond accordingly
        if (parsedMessage.method === 'signatureSubscribe') {
          console.log('Intercepted "signatureSubscribe" method');

          // Send the mocked response to the client
          socket.send(
            JSON.stringify({
              jsonrpc: '2.0',
              result: 8648699534240963, // Mocked subscription ID
              id: parsedMessage.id, // Use the same ID from the client's request
            }),
          );

          // Simulate a notification for the subscription
          setTimeout(() => {
            socket.send(
              JSON.stringify({
                jsonrpc: '2.0',
                method: 'signatureNotification',
                params: {
                  subscription: 8648699534240963,
                  result: {
                    context: { slot: 12345678 },
                    value: { err: null }, // Mock success response
                  },
                },
              }),
            );
          }, 2000); // Delay the notification to simulate real-world behavior
        } else {
          // Default response for other messages
          socket.send(
            JSON.stringify({
              jsonrpc: '2.0',
              error: {
                code: -32601,
                message: 'Method not mocked',
              },
              id: parsedMessage.id,
            }),
          );
        }
      });
    });
    // Handle client disconnection
    this.server.on('close', () => {
      console.log('Client disconnected from the WebSocket server');
    });

    console.log(`WebSocket server running on ws://localhost:${this.port}`);
  }

  /**
   * Stop the WebSocket server
   */
  public stop(): void {
    if (this.server) {
      this.server.close(() => {
        console.log(`WebSocket server stopped on ws://localhost:${this.port}`);
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
}

export default WebSocketLocalServer;
