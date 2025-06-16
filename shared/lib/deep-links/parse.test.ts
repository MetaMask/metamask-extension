import log from 'loglevel';
import { parse } from './parse';
import { VALID, verify } from './verify';
import { Route, routes } from './routes';

const mockVerify = verify as jest.MockedFunction<typeof verify>;
const mockRoutes = routes as jest.Mocked<Map<string, Route>>;

jest.mock('./verify', () => ({
  VALID: 'VALID',
  verify: jest.fn(),
}));
jest.mock('./routes', () => ({
  routes: new Map(),
}));
jest.mock('loglevel');

describe('parse', () => {
  const mockHandler = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoutes.clear();
  });

  it('returns false if no route handler is found', async () => {
    const urlStr = 'https://example.com/unknown';
    const result = await parse(urlStr);
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

  it('returns a parsed deep link object with signed=true if signature is valid', async () => {
    mockRoutes.set('/test', { handler: mockHandler } as unknown as Route);
    mockHandler.mockReturnValue('destination-value');
    mockVerify.mockResolvedValue(VALID);

    const urlStr = 'https://example.com/test?foo=bar';
    const result = await parse(new URL(urlStr));

    expect(result).toStrictEqual({
      destination: 'destination-value',
      route: {
        handler: expect.any(Function),
      },
      signed: true,
    });
    expect(mockHandler).toHaveBeenCalledWith(new URL(urlStr).searchParams);
  });

  it('returns a parsed deep link object with signed=false if signature is invalid', async () => {
    mockRoutes.set('/test', { handler: mockHandler } as unknown as Route);
    mockHandler.mockReturnValue('destination-value');
    mockVerify.mockResolvedValue('INVALID');

    const urlStr = 'https://example.com/test?foo=bar';
    const result = await parse(new URL(urlStr));

    expect(result).toStrictEqual({
      destination: 'destination-value',
      route: {
        handler: expect.any(Function),
      },
      signed: false,
    });
  });

  it('calls verify with the correct URL', async () => {
    mockRoutes.set('/test', { handler: mockHandler } as unknown as Route);
    mockHandler.mockReturnValue('destination-value');
    mockVerify.mockResolvedValue(VALID);

    const urlStr = 'https://example.com/test?foo=bar';
    await parse(new URL(urlStr));

    expect(mockVerify).toHaveBeenCalledWith(new URL(urlStr));
  });
});
