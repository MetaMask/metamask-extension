import createTabIdMiddleware from './createTabIdMiddleware';

describe('createTabIdMiddleware', () => {
  it('should return a middleware function', () => {
    const middleware = createTabIdMiddleware({ tabId: 123 });
    expect(typeof middleware).toBe('function');
  });

  it('should set the tabId on the request object', () => {
    const tabId = 42;
    const middleware = createTabIdMiddleware({ tabId });
    const req = {};
    const next = jest.fn();

    middleware(req, {}, next);

    expect(req.tabId).toBe(42);
  });

  it('should call next after setting tabId', () => {
    const middleware = createTabIdMiddleware({ tabId: 1 });
    const req = {};
    const next = jest.fn();

    middleware(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should overwrite existing tabId on the request', () => {
    const middleware = createTabIdMiddleware({ tabId: 99 });
    const req = { tabId: 1 };
    const next = jest.fn();

    middleware(req, {}, next);

    expect(req.tabId).toBe(99);
  });

  it('should preserve other properties on the request object', () => {
    const middleware = createTabIdMiddleware({ tabId: 7 });
    const req = { method: 'eth_sendTransaction', origin: 'dapp.com' };
    const next = jest.fn();

    middleware(req, {}, next);

    expect(req.method).toBe('eth_sendTransaction');
    expect(req.origin).toBe('dapp.com');
    expect(req.tabId).toBe(7);
  });

  it('should handle tabId of 0', () => {
    const middleware = createTabIdMiddleware({ tabId: 0 });
    const req = {};
    const next = jest.fn();

    middleware(req, {}, next);

    expect(req.tabId).toBe(0);
  });
});
