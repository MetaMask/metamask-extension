/** @jest-environment node */
import { it as jestIt } from '@jest/globals';
import { RPC_VALIDATION_REQUEST_ID } from '../../../shared/lib/rpc-endpoint-validation';
import { requestRpcChainId } from './rpc-endpoint-validation-request';

function createResponse(chunks: Uint8Array[], status = 200) {
  const read = jest.fn();
  for (const value of chunks) {
    read.mockResolvedValueOnce({ done: false, value });
  }
  read.mockResolvedValue({ done: true });
  const cancel = jest.fn().mockResolvedValue(undefined);
  const getReader = jest.fn().mockReturnValue({ read, cancel });
  const response = {
    status,
    ok: status >= 200 && status < 300,
    body: { getReader },
  } as unknown as Response;
  return { response, read, cancel, getReader };
}

function jsonResponse(payload: unknown, status = 200) {
  return createResponse(
    [new TextEncoder().encode(JSON.stringify(payload))],
    status,
  );
}

describe('requestRpcChainId', () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('sends only the fixed chain-ID request with restrictive fetch options', async () => {
    const { response } = jsonResponse({
      id: RPC_VALIDATION_REQUEST_ID,
      jsonrpc: '2.0',
      result: '0xAB',
    });
    fetchMock.mockResolvedValue(response);

    const result = await requestRpcChainId(
      'https://rpc.example/v1/token?network=1#fragment',
    );

    expect(result).toStrictEqual({ chainId: '0xab' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://rpc.example/v1/token?network=1',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: RPC_VALIDATION_REQUEST_ID,
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
        }),
        credentials: 'omit',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
        signal: expect.any(AbortSignal),
      },
    );
    expect(jest.getTimerCount()).toBe(0);
  });

  it('ignores caller-provided request bodies and fetch options', async () => {
    const { response } = jsonResponse({
      id: RPC_VALIDATION_REQUEST_ID,
      jsonrpc: '2.0',
      result: '0x1',
    });
    fetchMock.mockResolvedValue(response);
    const invokeWithExtraArguments = requestRpcChainId as (
      ...args: unknown[]
    ) => ReturnType<typeof requestRpcChainId>;

    await invokeWithExtraArguments('https://rpc.example', {
      method: 'PUT',
      headers: { Authorization: 'secret' },
      body: 'arbitrary data',
      redirect: 'follow',
      credentials: 'include',
    });

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toStrictEqual({
      id: RPC_VALIDATION_REQUEST_ID,
      jsonrpc: '2.0',
      method: 'eth_chainId',
      params: [],
    });
    expect(options.headers).toStrictEqual({
      'Content-Type': 'application/json',
    });
    expect(options.redirect).toBe('error');
    expect(options.credentials).toBe('omit');
  });

  it('moves explicitly supplied URL credentials into Basic authentication', async () => {
    const { response } = jsonResponse({
      id: RPC_VALIDATION_REQUEST_ID,
      jsonrpc: '2.0',
      result: '0x1',
    });
    fetchMock.mockResolvedValue(response);

    await requestRpcChainId('https://alice:p%40ss@rpc.example/path#fragment');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://rpc.example/path',
      expect.objectContaining({
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic YWxpY2U6cEBzcw==',
        },
      }),
    );
  });

  jestIt.each(['file:///tmp/rpc', 'data:,secret', 'ws://rpc.example', '/rpc'])(
    'rejects a non-HTTP endpoint before fetching: %s',
    async (url: string) => {
      await expect(requestRpcChainId(url)).rejects.toThrow();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
    },
  );

  it('does not expose redirect or network error details', async () => {
    fetchMock.mockRejectedValue(
      new TypeError('Redirect to https://private.example/secret rejected'),
    );

    expect(await requestRpcChainId('https://rpc.example')).toStrictEqual({
      error: {},
    });
    expect(fetchMock.mock.calls[0][1].redirect).toBe('error');
    expect(jest.getTimerCount()).toBe(0);
  });

  it('returns only HTTP status for rate limits without reading the body', async () => {
    const { response, getReader } = jsonResponse(
      { secret: 'server-controlled response' },
      429,
    );
    fetchMock.mockResolvedValue(response);

    expect(await requestRpcChainId('https://rpc.example')).toStrictEqual({
      error: { httpStatus: 429 },
    });
    expect(getReader).not.toHaveBeenCalled();
  });

  it('sanitizes JSON-RPC errors to numeric codes', async () => {
    const { response } = jsonResponse({
      id: RPC_VALIDATION_REQUEST_ID,
      jsonrpc: '2.0',
      error: {
        code: -32005,
        message: 'secret server response',
        data: { nested: 'untrusted data' },
      },
    });
    fetchMock.mockResolvedValue(response);

    expect(await requestRpcChainId('https://rpc.example')).toStrictEqual({
      error: { httpStatus: 200, code: -32005 },
    });
  });

  it('omits non-numeric JSON-RPC error codes', async () => {
    const { response } = jsonResponse({ error: { code: 'server-controlled' } });
    fetchMock.mockResolvedValue(response);

    expect(await requestRpcChainId('https://rpc.example')).toStrictEqual({
      error: { httpStatus: 200 },
    });
  });

  jestIt.each([
    null,
    [],
    '0x1',
    { id: 'wrong-id', jsonrpc: '2.0', result: '0x1' },
    { id: RPC_VALIDATION_REQUEST_ID, jsonrpc: '1.0', result: '0x1' },
    { id: RPC_VALIDATION_REQUEST_ID, jsonrpc: '2.0', result: 1 },
    { id: RPC_VALIDATION_REQUEST_ID, jsonrpc: '2.0', result: '0x01' },
    { id: RPC_VALIDATION_REQUEST_ID, jsonrpc: '2.0', result: '0x' },
    { id: RPC_VALIDATION_REQUEST_ID, jsonrpc: '2.0', result: '0xzz' },
    {
      id: RPC_VALIDATION_REQUEST_ID,
      jsonrpc: '2.0',
      result: `0x${'f'.repeat(65)}`,
    },
  ])('rejects an invalid JSON-RPC response: %p', async (payload: unknown) => {
    fetchMock.mockResolvedValue(jsonResponse(payload).response);

    expect(await requestRpcChainId('https://rpc.example')).toStrictEqual({
      error: { httpStatus: 200 },
    });
  });

  it('does not expose malformed JSON', async () => {
    fetchMock.mockResolvedValue(
      createResponse([new TextEncoder().encode('private server error')])
        .response,
    );

    expect(await requestRpcChainId('https://rpc.example')).toStrictEqual({
      error: {},
    });
  });

  it('decodes a response streamed across multiple chunks', async () => {
    const bytes = new TextEncoder().encode(
      JSON.stringify({
        id: RPC_VALIDATION_REQUEST_ID,
        jsonrpc: '2.0',
        result: '0x0',
      }),
    );
    fetchMock.mockResolvedValue(
      createResponse([bytes.slice(0, 12), bytes.slice(12)]).response,
    );

    expect(await requestRpcChainId('https://rpc.example')).toStrictEqual({
      chainId: '0x0',
    });
  });

  it('cancels the stream as soon as the 64 KiB response limit is exceeded', async () => {
    const { response, read, cancel } = createResponse([
      new Uint8Array(64 * 1024),
      new Uint8Array(1),
      new Uint8Array(1),
    ]);
    fetchMock.mockResolvedValue(response);

    expect(await requestRpcChainId('https://rpc.example')).toStrictEqual({
      error: { httpStatus: 200 },
    });
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(read).toHaveBeenCalledTimes(2);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('aborts an unfinished request after ten seconds', async () => {
    fetchMock.mockImplementation(
      (_url: string, options: RequestInit) =>
        new Promise((_resolve, reject) => {
          options.signal?.addEventListener('abort', () =>
            reject(new Error('Private timeout details')),
          );
        }),
    );

    const pendingRequest = requestRpcChainId('https://rpc.example');
    jest.advanceTimersByTime(9_999);
    const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
    expect(signal.aborted).toBe(false);
    jest.advanceTimersByTime(1);

    expect(await pendingRequest).toStrictEqual({ error: {} });
    expect(signal.aborted).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });
});
