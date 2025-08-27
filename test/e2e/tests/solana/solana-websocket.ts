import { Mockttp } from 'mockttp';
import WebSocketLocalServer from '../../websocket-server';

let websocketConnections: WebSocket[] = [];

export async function startSolanaWebsocketServer(mockServer: Mockttp) {
  const port = 8088;
  // Start a WebSocket server to handle the connection
  const localWebSocketServer = WebSocketLocalServer.getServerInstance(port);
  localWebSocketServer.start();
  const wsServer = localWebSocketServer.getServer();
  wsServer.on('connection', (socket: WebSocket) => {
    console.log('Client connected to the local WebSocket server');
    websocketConnections.push(socket);

    // Handle messages from the client
    socket.addEventListener('message', (event: MessageEvent) => {
      const message = event.data.toString();
      console.log('Message received from client:', message);
      if (message.includes('signatureSubscribe')) {
        console.log('Signature subscribe message received from client');
        setTimeout(() => {
          socket.send(
            JSON.stringify({
              jsonrpc: '2.0',
              result: 8648699534240963,
              id: '1',
            }),
          );
          console.log('Simulated message sent to the client');
        }, 500); // Delay the message by 5 second
      }
      if (message.includes('accountSubscribe')) {
        console.log('Account subscribe message received from client');
        setTimeout(() => {
          socket.send(
            JSON.stringify({
              jsonrpc: '2.0',
              result:
                'b07ebf7caf2238a9b604d4dfcaf1934280fcd347d6eded62bc0def6cbb767d11',
              id: '1',
            }),
          );
          console.log(
            'Simulated message for accountSubscribe sent to the client',
          );
        }, 500); // Delay the message by 5 second
      }
      if (
        message.includes('programSubscribe') &&
        message.includes('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
      ) {
        console.log('Program subscribe message received from client');
        setTimeout(() => {
          socket.send(
            JSON.stringify({
              jsonrpc: '2.0',
              result:
                '568eafd45635c108d0d426361143de125a841628a58679f5a024cbab9a20b41c',
              id: '1',
            }),
          );
          console.log(
            'Simulated message for programSubscribe Token2022 sent to the client',
          );
        }, 500); // Delay the message by 5 second
      }
      if (
        message.includes('programSubscribe') &&
        message.includes('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')
      ) {
        console.log('Program subscribe message received from client');
        setTimeout(() => {
          socket.send(
            JSON.stringify({
              jsonrpc: '2.0',
              result:
                'f33dd9975158af47bf16c7f6062a73191d4595c59cfec605d5a51e25c65ffb51',
              id: '1',
            }),
          );
          console.log(
            'Simulated message for programSubscribe sent to the client',
          );
        }, 500); // Delay the message by 5 second
      }
    });

    // Handle client disconnection
    socket.addEventListener('close', () => {
      console.log('Client disconnected from the local WebSocket server');
      const index = websocketConnections.indexOf(socket);
      if (index > -1) {
        websocketConnections.splice(index, 1);
      }
    });
  });

  // Intercept WebSocket handshake requests
  await mockServer
    .forAnyWebSocket()
    .matching((req) =>
      /^wss:\/\/solana-(mainnet|devnet)\.infura\.io\//u.test(req.url),
    )
    .thenForwardTo(`ws://localhost:${port}`);
}

export function getWebsocketConnectionCount(): number {
  try {
    // Get the actual count from the WebSocket server
    const localWebSocketServer = WebSocketLocalServer.getServerInstance(8088);
    const wsServer = localWebSocketServer.getServer();
    const serverClientCount = wsServer.clients.size;
    console.log(
      `Server has ${serverClientCount} clients, tracked array has ${websocketConnections.length}`,
    );
    return serverClientCount;
  } catch (error) {
    console.warn(
      'Error getting server client count, falling back to tracked count:',
      error,
    );
    return websocketConnections.length;
  }
}

export async function stopSolanaWebsocketServer(): Promise<void> {
  try {
    const localWebSocketServer = WebSocketLocalServer.getServerInstance(8088);
    const wsServer = localWebSocketServer.getServer();

    const serverClients = Array.from(wsServer.clients);
    console.log(`Found ${serverClients.length} active server clients`);

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

    // Stop the WebSocket server completely
    localWebSocketServer.stop();

    // Force reset the singleton instance to ensure fresh server for next test
    // @ts-expect-error - accessing private static property for cleanup
    WebSocketLocalServer.instance = undefined;
  } catch (error) {
    console.warn('Error accessing WebSocket server during cleanup:', error);
  }

  for (const socket of websocketConnections) {
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

  websocketConnections = [];

  // Give a longer delay to ensure all connections and the server are fully closed
  await new Promise((resolve) => setTimeout(resolve, 500));
}
