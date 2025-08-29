// eslint-disable-next-line @typescript-eslint/no-shadow
import { WebSocket } from 'ws';
import LocalWebSocketServer from './websocket-server';

/**
 * WebSocket Solana mocks
 * This function should be called after the WebSocket server is started
 */
export async function setSolanaWebsocketMocks(): Promise<void> {
  const localWebSocketServer = LocalWebSocketServer.getServerInstance();
  const wsServer = localWebSocketServer.getServer();

  // Add Solana-specific message handlers to the existing server
  wsServer.on('connection', (socket: WebSocket) => {
    console.log('Client connected to the local WebSocket server');

    // Handle messages from the client
    socket.on('message', (data) => {
      const message = data.toString();
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
        }, 500); // Delay the message by 500ms
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
        }, 500); // Delay the message by 500ms
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
        }, 500); // Delay the message by 500ms
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
        }, 500); // Delay the message by 500ms
      }
    });
  });
}
