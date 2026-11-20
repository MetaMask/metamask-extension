import log from 'loglevel';
import { it as jestIt } from '@jest/globals';
import { NavigationOrigin, parse } from './parse';
import { VALID, INVALID, MISSING, verify } from './verify';
import { addRoute, routes } from './routes';
import { Route } from './routes/route';
import { SIG_PARAM } from './common';

const mockVerify = verify as jest.MockedFunction<typeof verify>;

jest.mock('./verify', () => ({
  INVALID: 'invalid',
  MISSING: 'missing',
  VALID: 'valid',
  verify: jest.fn(),
}));
jest.mock('loglevel');

describe('parse', () => {
  const mockHandler = jest.fn() as jest.MockedFunction<Route['handler']>;
  let testRoute: Route;

  beforeEach(() => {
    jest.clearAllMocks();
    mockHandler.mockReset();
    routes.clear();
    testRoute = new Route({
      pathname: '/test',
      getTitle: () => 'deepLink_theHomePage',
      handler: mockHandler,
    });
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
    addRoute({
      ...testRoute,
      handler: () => {
        throw new Error('fail');
      },
    });
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
    addRoute(testRoute);
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
      route: testRoute,
      signature: VALID,
    });
    expect(mockHandler).toHaveBeenCalledWith(new URLSearchParams());
  });

  it('returns a parsed deep link object with signature=invalid if signature is invalid', async () => {
    addRoute(testRoute);
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
      route: testRoute,
      signature: INVALID,
    });
  });

  it('returns a parsed deep link object with signature=missing if signature is missing', async () => {
    addRoute(testRoute);
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
      route: testRoute,
      signature: MISSING,
    });
  });

  it('calls verify with the correct URL', async () => {
    addRoute(testRoute);
    mockHandler.mockReturnValue({
      path: 'destination-value',
      query: new URLSearchParams(),
    });
    mockVerify.mockResolvedValue(VALID);

    const urlStr = 'https://example.com/test?sig=bar';
    await parse(new URL(urlStr));

    expect(mockVerify).toHaveBeenCalledWith(new URL(urlStr));
  });

  it('skips signature verification when `navigationOrigin` is `NavigationOrigin.INTERNAL`', async () => {
    addRoute(testRoute);
    mockHandler.mockReturnValue({
      path: 'destination-value',
      query: new URLSearchParams(),
    });

    const urlStr = 'https://example.com/test?sig=bar';
    const result = await parse(new URL(urlStr), {
      navigationOrigin: NavigationOrigin.INTERNAL,
    });

    expect(result).toStrictEqual({
      destination: {
        path: 'destination-value',
        query: new URLSearchParams(),
      },
      route: testRoute,
    });
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("removes the SIG_PARAMS_PARAM from the handler's query parameters", async () => {
    addRoute(testRoute);
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

  jestIt.each([VALID, INVALID, MISSING])(
    'preserves the original wildcard URL for verification with signature=%s',
    async (signature) => {
      const wildcardRoute = new Route({
        ...testRoute,
        pathname: '/social/*/whatever',
      });
      addRoute(wildcardRoute);
      const destination = {
        path: '/destination',
        query: new URLSearchParams(),
      };
      mockHandler.mockReturnValue(destination);
      mockVerify.mockResolvedValue(signature);
      const url = new URL(
        'https://link.metamask.io/SOCIAL/Alice%2FBob/WHATEVER?sig=example&sig_params=value&value=123&ignored=abc#details',
      );
      const originalUrl = url.href;

      const result = await parse(url);

      expect(result).toStrictEqual({
        destination,
        route: wildcardRoute,
        signature,
      });
      expect(mockHandler).toHaveBeenCalledWith(
        new URLSearchParams({ value: '123' }),
      );
      expect(mockVerify).toHaveBeenCalledWith(url);
      expect(url.href).toBe(originalUrl);
    },
  );

  jestIt.each([
    '/social//whatever',
    '/social/alice/bob/whatever',
    '/social/alice/whatever/extra',
  ])(
    'does not invoke a handler for the unmatched pathname %s',
    async (pathname) => {
      addRoute(new Route({ ...testRoute, pathname: '/social/*/whatever' }));

      expect(await parse(new URL(`https://link.metamask.io${pathname}`))).toBe(
        false,
      );
      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockVerify).not.toHaveBeenCalled();
    },
  );
});
