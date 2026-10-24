import log from 'loglevel';
import createLoggerMiddleware from './createLoggerMiddleware';

jest.mock('loglevel');

describe('createLoggerMiddleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return a middleware function', () => {
    const middleware = createLoggerMiddleware({ origin: 'test.com' });
    expect(typeof middleware).toBe('function');
  });

  it('should call next', () => {
    const middleware = createLoggerMiddleware({ origin: 'test.com' });
    const req = { method: 'eth_call' };
    const res = {};
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(typeof next.mock.calls[0][0]).toBe('function');
  });

  it('should log error when response has error', () => {
    const middleware = createLoggerMiddleware({ origin: 'test.com' });
    const req = { method: 'eth_call' };
    const res = { error: { code: -32000, message: 'execution reverted' } };
    const next = jest.fn();

    middleware(req, res, next);

    const callback = next.mock.calls[0][0];
    const cb = jest.fn();
    callback(cb);

    expect(log.debug).toHaveBeenCalledWith('Error in RPC response:\n', res);
    expect(cb).toHaveBeenCalled();
  });

  it('should not log details for metamask internal requests', () => {
    const middleware = createLoggerMiddleware({ origin: 'metamask' });
    const req = { method: 'eth_call', isMetamaskInternal: true };
    const res = {};
    const next = jest.fn();

    middleware(req, res, next);

    const callback = next.mock.calls[0][0];
    const cb = jest.fn();
    callback(cb);

    expect(log.info).not.toHaveBeenCalled();
  });

  it('should log detailed info in debug mode', () => {
    process.env.METAMASK_DEBUG = 'true';
    const middleware = createLoggerMiddleware({ origin: 'dapp.io' });
    const req = { method: 'eth_getBalance' };
    const res = { result: '0x1' };
    const next = jest.fn();

    middleware(req, res, next);

    const callback = next.mock.calls[0][0];
    const cb = jest.fn();
    callback(cb);

    expect(log.info).toHaveBeenCalledWith(
      'RPC (dapp.io):',
      req,
      '->',
      res,
    );
    expect(cb).toHaveBeenCalled();
  });

  it('should log summary info in production mode', () => {
    delete process.env.METAMASK_DEBUG;
    const middleware = createLoggerMiddleware({ origin: 'dapp.io' });
    const req = { method: 'eth_chainId' };
    const res = { result: '0x1' };
    const next = jest.fn();

    middleware(req, res, next);

    const callback = next.mock.calls[0][0];
    const cb = jest.fn();
    callback(cb);

    expect(log.info).toHaveBeenCalledWith(
      'RPC (dapp.io): eth_chainId -> success',
    );
  });

  it('should log error status in production mode when response has error', () => {
    delete process.env.METAMASK_DEBUG;
    const middleware = createLoggerMiddleware({ origin: 'app.uniswap.org' });
    const req = { method: 'eth_sendTransaction' };
    const res = { error: { code: -32603, message: 'internal error' } };
    const next = jest.fn();

    middleware(req, res, next);

    const callback = next.mock.calls[0][0];
    const cb = jest.fn();
    callback(cb);

    expect(log.info).toHaveBeenCalledWith(
      'RPC (app.uniswap.org): eth_sendTransaction -> error',
    );
  });
});
