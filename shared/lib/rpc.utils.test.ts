import { jsonRpcRequest } from './rpc.utils';

jest.mock('./fetch-with-timeout', () => {
  const mockFetch = jest.fn();
  return jest.fn(() => mockFetch);
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const getFetchWithTimeout = require('./fetch-with-timeout') as jest.Mock;

function getMockFetch(): jest.Mock {
  return getFetchWithTimeout();
}

function makeHttpResponse(body: unknown) {
  return Promise.resolve({ json: () => Promise.resolve(body) });
}

const RPC_URL = 'https://mainnet.example.com/rpc';

describe('jsonRpcRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful responses', () => {
    it('returns the result field from the JSON-RPC response', async () => {
      getMockFetch().mockReturnValue(makeHttpResponse({ result: 'success' }));

      const result = await jsonRpcRequest(RPC_URL, 'eth_blockNumber');

      expect(result).toBe('success');
    });

    it('returns undefined when result is not present', async () => {
      getMockFetch().mockReturnValue(makeHttpResponse({ result: undefined }));

      const result = await jsonRpcRequest(RPC_URL, 'eth_blockNumber');

      expect(result).toBeUndefined();
    });
  });

  describe('invalid response shape', () => {
    it('throws when the response is not an object', async () => {
      getMockFetch().mockReturnValue(makeHttpResponse('not-an-object'));

      await expect(jsonRpcRequest(RPC_URL, 'eth_blockNumber')).rejects.toThrow(
        `RPC endpoint ${RPC_URL} returned non-object response.`,
      );
    });

    it('throws when the response is an array', async () => {
      getMockFetch().mockReturnValue(makeHttpResponse([{ result: 1 }]));

      await expect(jsonRpcRequest(RPC_URL, 'eth_blockNumber')).rejects.toThrow(
        `RPC endpoint ${RPC_URL} returned non-object response.`,
      );
    });

    it('throws when the response is null', async () => {
      getMockFetch().mockReturnValue(makeHttpResponse(null));

      await expect(jsonRpcRequest(RPC_URL, 'eth_blockNumber')).rejects.toThrow(
        `RPC endpoint ${RPC_URL} returned non-object response.`,
      );
    });
  });

  describe('RPC error field handling', () => {
    it('throws with the message when error is an object with a message property', async () => {
      getMockFetch().mockReturnValue(
        makeHttpResponse({ error: { message: 'execution reverted' } }),
      );

      await expect(jsonRpcRequest(RPC_URL, 'eth_call')).rejects.toThrow(
        'execution reverted',
      );
    });

    it('throws with JSON.stringify when error is an object without a message property', async () => {
      const errorObj = { code: -32000, data: 'insufficient funds' };
      getMockFetch().mockReturnValue(makeHttpResponse({ error: errorObj }));

      await expect(
        jsonRpcRequest(RPC_URL, 'eth_sendTransaction'),
      ).rejects.toThrow(JSON.stringify(errorObj));
    });

    it('throws with JSON.stringify when error object message property is undefined', async () => {
      const errorObj = { code: -32603 };
      getMockFetch().mockReturnValue(makeHttpResponse({ error: errorObj }));

      await expect(jsonRpcRequest(RPC_URL, 'eth_call')).rejects.toThrow(
        JSON.stringify(errorObj),
      );
    });

    it('throws with the string directly when error is a string', async () => {
      getMockFetch().mockReturnValue(
        makeHttpResponse({ error: 'method not found' }),
      );

      await expect(
        jsonRpcRequest(RPC_URL, 'eth_unknownMethod'),
      ).rejects.toThrow('method not found');
    });
  });

  describe('Authorization header from URL credentials', () => {
    it('converts basic-auth URL credentials to an Authorization header', async () => {
      getMockFetch().mockReturnValue(makeHttpResponse({ result: 'ok' }));

      const urlWithAuth = 'https://user:pass@mainnet.example.com/rpc';
      await jsonRpcRequest(urlWithAuth, 'eth_blockNumber');

      const [calledUrl, calledOptions] = getMockFetch().mock.calls[0];
      const expectedToken = Buffer.from('user:pass').toString('base64');

      expect(calledUrl).toBe('https://mainnet.example.com/rpc');
      expect(calledOptions.headers.Authorization).toBe(
        `Basic ${expectedToken}`,
      );
    });

    it('does not add an Authorization header for URLs without credentials', async () => {
      getMockFetch().mockReturnValue(makeHttpResponse({ result: 'ok' }));

      await jsonRpcRequest(RPC_URL, 'eth_blockNumber');

      const [, calledOptions] = getMockFetch().mock.calls[0];
      expect(calledOptions.headers.Authorization).toBeUndefined();
    });
  });

  describe('custom headers', () => {
    it('merges extra headers into the request', async () => {
      getMockFetch().mockReturnValue(makeHttpResponse({ result: 'ok' }));

      await jsonRpcRequest(RPC_URL, 'eth_blockNumber', [], {
        headers: { 'X-Api-Key': 'secret' },
      });

      const [, calledOptions] = getMockFetch().mock.calls[0];
      expect(calledOptions.headers['X-Api-Key']).toBe('secret');
      expect(calledOptions.headers['Content-Type']).toBe('application/json');
    });
  });
});
