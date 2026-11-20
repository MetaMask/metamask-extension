import createOriginMiddleware from './createOriginMiddleware';

describe('createOriginMiddleware', () => {
  it('should return a middleware function', () => {
    const middleware = createOriginMiddleware({ origin: 'example.com' });
    expect(typeof middleware).toBe('function');
  });

  it('should set the origin on the request object', () => {
    const origin = 'https://example.metamask.io';
    const middleware = createOriginMiddleware({ origin });
    const req = {};
    const res = {};
    const next = jest.fn();

    middleware(req, res, next);

    expect(req.origin).toBe(origin);
  });

  it('should call next after setting origin', () => {
    const middleware = createOriginMiddleware({ origin: 'test.com' });
    const req = {};
    const res = {};
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should overwrite existing origin on request', () => {
    const middleware = createOriginMiddleware({ origin: 'new-origin.com' });
    const req = { origin: 'old-origin.com' };
    const res = {};
    const next = jest.fn();

    middleware(req, res, next);

    expect(req.origin).toBe('new-origin.com');
  });

  it('should preserve other properties on the request object', () => {
    const middleware = createOriginMiddleware({ origin: 'test.com' });
    const req = { method: 'eth_call', params: ['0x1'] };
    const res = {};
    const next = jest.fn();

    middleware(req, res, next);

    expect(req.method).toBe('eth_call');
    expect(req.params).toStrictEqual(['0x1']);
    expect(req.origin).toBe('test.com');
  });

  it('should handle empty string origin', () => {
    const middleware = createOriginMiddleware({ origin: '' });
    const req = {};
    const next = jest.fn();

    middleware(req, {}, next);

    expect(req.origin).toBe('');
    expect(next).toHaveBeenCalled();
  });
});
