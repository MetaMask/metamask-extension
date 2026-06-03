/**
 * Configuration for a WebSocket message mock
 */

import type { WebSocketMessageMock } from '../../../websocket/types';

export const DEFAULT_SOLANA_WS_MOCKS: WebSocketMessageMock[] = [
  {
    messageIncludes: 'signatureSubscribe',
    response: {
      jsonrpc: '2.0',
      result: 8648699534240963,
      id: '1',
    },
    delay: 500,
    followUpResponse: {
      jsonrpc: '2.0',
      method: 'signatureNotification',
      params: {
        result: {
          context: { slot: 342840492 },
          value: { err: null },
        },
        subscription: 8648699534240963,
      },
    },
    followUpDelay: 1500,
    logMessage: 'Signature subscribe message received from client',
  },
  {
    messageIncludes: 'accountSubscribe',
    response: {
      jsonrpc: '2.0',
      result:
        'b07ebf7caf2238a9b604d4dfcaf1934280fcd347d6eded62bc0def6cbb767d11',
      id: '1',
    },
    delay: 500,
    logMessage: 'Account subscribe message received from client',
  },
  {
    messageIncludes: [
      'programSubscribe',
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    ],
    response: {
      jsonrpc: '2.0',
      result:
        '568eafd45635c108d0d426361143de125a841628a58679f5a024cbab9a20b41c',
      id: '1',
    },
    delay: 500,
    logMessage: 'Program subscribe message received from client',
  },
  {
    messageIncludes: [
      'programSubscribe',
      'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
    ],
    response: {
      jsonrpc: '2.0',
      result:
        'f33dd9975158af47bf16c7f6062a73191d4595c59cfec605d5a51e25c65ffb51',
      id: '1',
    },
    delay: 500,
    logMessage: 'Program subscribe message received from client',
  },
];
