/**
 * Configuration for a WebSocket message mock
 */
export type WebSocketMessageMock = {
  /** String(s) that the message should include to trigger this mock */
  messageIncludes: string | string[];
  /** The JSON response to send back */
  response: object;
  /** Delay before sending the response (in milliseconds) */
  delay?: number;
  /** Custom log message for this mock */
  logMessage?: string;
};

export const DEFAULT_SOLANA_WS_MOCKS: WebSocketMessageMock[] = [
  {
    messageIncludes: 'signatureSubscribe',
    response: {
      jsonrpc: '2.0',
      result: 8648699534240963,
      id: '1',
    },
    delay: 500,
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
