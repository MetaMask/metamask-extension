import log from 'loglevel';
import { parse } from './parse';
import { VALID, INVALID, MISSING, verify } from './verify';
import { type Route, routes } from './routes';
import { SIG_PARAM } from './constants';

const mockVerify = verify as jest.MockedFunction<typeof verify>;
const mockRoutes = routes as jest.Mocked<Map<string, Route>>;

jest.mock('./verify', () => ({
  verify: jest.fn(),
}));
jest.mock('./routes', () => ({
  routes: new Map(),
}));
jest.mock('loglevel');

describe('parse', () => {
  const mockHandler = jest.fn() as jest.MockedFunction<Route['handler']>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoutes.clear();
  });

  it('returns false if no route handler is found', async () => {
    const urlStr = 'https://example.com/unknown';
    const result = await parse(new URL(urlStr));
    expect(result).toBe(false);
    expect(log.debug).toHaveBeenCalledWith(
      'No handler found for the pathname:',
      '/unknown',
    );
  });

  it('returns false if handler throws an error', async () => {
    mockRoutes.set('/test', {
      handler: () => {
        throw new Error('fail');
      },
    } as unknown as Route);
    mockVerify.mockResolvedValue(VALID);
    const urlStr = 'https://example.com/test?foo=bar';
    const result = await parse(new URL(urlStr));
    expect(result).toBe(false);
    expect(log.debug).toHaveBeenCalledWith(
      'Error handling deep link:',
      expect.any(Error),
    );
  });

  it('returns a parsed deep link object with signature=valid if signature is valid', async () => {
    mockRoutes.set('/test', { handler: mockHandler } as unknown as Route);
    mockHandler.mockReturnValue({
      path: 'destination-value',
      query: new URLSearchParams([[SIG_PARAM, '123']]),
    });
    mockVerify.mockResolvedValue(VALID);

    const urlStr = 'https://example.com/test?sig=123';
    const result = await parse(new URL(urlStr));

    expect(result).toStrictEqual({
      destination: {
        path: 'destination-value',
        query: new URLSearchParams([[SIG_PARAM, '123']]),
      },
      route: {
        handler: mockHandler,
      },
      signature: VALID,
    });
    expect(mockHandler).toHaveBeenCalledWith(new URLSearchParams());
  });

  it('returns a parsed deep link object with signature=invalid if signature is invalid', async () => {
    mockRoutes.set('/test', { handler: mockHandler } as unknown as Route);
    mockHandler.mockReturnValue({
      path: 'destination-value',
      query: new URLSearchParams(),
    });
    mockVerify.mockResolvedValue(INVALID);

    const urlStr = 'https://example.com/test?sig=bad';
    const result = await parse(new URL(urlStr));

    expect(result).toStrictEqual({
      destination: {
        path: 'destination-value',
        query: new URLSearchParams(),
      },
      route: {
        handler: mockHandler,
      },
      signature: INVALID,
    });
  });

  it('returns a parsed deep link object with signature=missing if signature is missing', async () => {
    mockRoutes.set('/test', { handler: mockHandler } as unknown as Route);
    mockHandler.mockReturnValue({
      path: 'destination-value',
      query: new URLSearchParams(),
    });
    mockVerify.mockResolvedValue(MISSING);

    const urlStr = 'https://example.com/test?foo=bar';
    const result = await parse(new URL(urlStr));

    expect(result).toStrictEqual({
      destination: {
        path: 'destination-value',
        query: new URLSearchParams(),
      },
      route: {
        handler: mockHandler,
      },
      signature: MISSING,
    });
  });

  it('calls verify with the correct URL', async () => {
    mockRoutes.set('/test', { handler: mockHandler } as unknown as Route);
    mockHandler.mockReturnValue({
      path: 'destination-value',
      query: new URLSearchParams(),
    });
    mockVerify.mockResolvedValue(VALID);

    const urlStr = 'https://example.com/test?sig=bar';
    await parse(new URL(urlStr));

    expect(mockVerify).toHaveBeenCalledWith(new URL(urlStr));
  });

  it("removes the SIG_PARAMS_PARAM from the handler's query parameters", async () => {
    mockRoutes.set('/test', { handler: mockHandler } as unknown as Route);
    mockVerify.mockResolvedValue(VALID);

    const urlStr1 = 'https://example.com/test?sig=bar&sig_params=';
    await parse(new URL(urlStr1));
    // `sig_params` should be removed from the handler's searchParams
    expect(mockHandler).toHaveBeenCalledWith(new URLSearchParams());

    const urlStr2 =
      'https://example.com/test?sig=bar&sig_params=value&value=123';
    await parse(new URL(urlStr2));
    // `sig_params` should be removed from the handler's searchParams, `value`
    // should remain because it is listed in `sig_params`
    expect(mockHandler).toHaveBeenCalledWith(
      new URLSearchParams([['value', '123']]),
    );

    const urlStr3 = 'https://example.com/test?sig=bar&sig_params=&value=123';
    await parse(new URL(urlStr3));
    // `sig_params` should be removed from the handler's searchParams, `value`
    // should also be removed because it is not in `sig_params`
    expect(mockHandler).toHaveBeenCalledWith(new URLSearchParams());

    const urlStr4 =
      'https://example.com/test?sig=bar&sig_params=value&value=123&foo=bar';
    await parse(new URL(urlStr4));
    // `sig_params` should be removed from the handler's searchParams, `value`
    // should remain because it is listed in `sig_params`, `foo` should be removed
    // because it is not listed in `sig_params`
    expect(mockHandler).toHaveBeenCalledWith(
      new URLSearchParams([['value', '123']]),
    );
  });
});
