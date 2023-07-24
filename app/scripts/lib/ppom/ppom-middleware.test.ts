import { createPPOMMiddleware } from './ppom-middleware';

Object.defineProperty(globalThis, 'fetch', {
  writable: true,
  value: () => undefined,
});

Object.defineProperty(globalThis, 'performance', {
  writable: true,
  value: () => undefined,
});

describe('PPOMMiddleware', () => {
  it('should call ppomController.usePPOM for requests of type confirmation', async () => {
    const useMock = jest.fn();
    const controller = {
      usePPOM: useMock,
    };
    const middlewareFunction = createPPOMMiddleware(controller as any);
    await middlewareFunction(
      { method: 'eth_sendTransaction' },
      undefined,
      () => undefined,
    );
    expect(useMock).toHaveBeenCalledTimes(1);
  });

  it('should add validation response on confirmation requests', async () => {
    const controller = {
      usePPOM: async () => Promise.resolve('VALIDATION_RESULT'),
    };
    const middlewareFunction = createPPOMMiddleware(controller as any);
    const req = { method: 'eth_sendTransaction', ppomResponse: undefined };
    await middlewareFunction(req, undefined, () => undefined);
    expect(req.ppomResponse).toBeDefined();
  });

  it('should call next method when ppomController.usePPOM completes', async () => {
    const ppom = {
      validateJsonRpc: () => undefined,
    };
    const controller = {
      usePPOM: async (callback: any) => {
        callback(ppom);
      },
    };
    const middlewareFunction = createPPOMMiddleware(controller as any);
    const nextMock = jest.fn();
    await middlewareFunction(
      { method: 'eth_sendTransaction' },
      undefined,
      nextMock,
    );
    expect(nextMock).toHaveBeenCalledTimes(1);
  });

  it('should call next method when ppomController.usePPOM throws error', async () => {
    const controller = {
      usePPOM: async (_callback: any) => {
        throw Error('Some error');
      },
    };
    const middlewareFunction = createPPOMMiddleware(controller as any);
    const nextMock = jest.fn();
    await middlewareFunction(
      { method: 'eth_sendTransaction' },
      undefined,
      nextMock,
    );
    expect(nextMock).toHaveBeenCalledTimes(1);
  });

  it('should call ppom.validateJsonRpc when invoked', async () => {
    const validateMock = jest.fn();
    const ppom = {
      validateJsonRpc: validateMock,
    };
    const controller = {
      usePPOM: async (callback: any) => {
        callback(ppom);
      },
    };
    const middlewareFunction = createPPOMMiddleware(controller as any);
    await middlewareFunction(
      { method: 'eth_sendTransaction' },
      undefined,
      () => undefined,
    );
    expect(validateMock).toHaveBeenCalledTimes(1);
  });

  it('should not call ppom.validateJsonRpc when request is not for confirmation method', async () => {
    const validateMock = jest.fn();
    const ppom = {
      validateJsonRpc: validateMock,
    };
    const controller = {
      usePPOM: async (callback: any) => {
        callback(ppom);
      },
    };
    const middlewareFunction = createPPOMMiddleware(controller as any);
    await middlewareFunction(
      { method: 'eth_someRequest' },
      undefined,
      () => undefined,
    );
    expect(validateMock).toHaveBeenCalledTimes(0);
  });
});
