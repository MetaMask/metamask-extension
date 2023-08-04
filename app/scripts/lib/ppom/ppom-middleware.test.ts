import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../shared/constants/security-provider';
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
    const ppomController = {
      usePPOM: useMock,
    };
    const preferenceController = {
      store: { getState: () => ({ securityAlertsEnabled: true }) },
    };
    const middlewareFunction = createPPOMMiddleware(
      ppomController as any,
      preferenceController as any,
    );
    await middlewareFunction(
      { method: 'eth_sendTransaction' },
      undefined,
      () => undefined,
    );
    expect(useMock).toHaveBeenCalledTimes(1);
  });

  it('should add validation response on confirmation requests', async () => {
    const ppomController = {
      usePPOM: async () => Promise.resolve('VALIDATION_RESULT'),
    };
    const preferenceController = {
      store: { getState: () => ({ securityAlertsEnabled: true }) },
    };
    const middlewareFunction = createPPOMMiddleware(
      ppomController as any,
      preferenceController as any,
    );
    const req = {
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };
    await middlewareFunction(req, undefined, () => undefined);
    expect(req.securityAlertResponse).toBeDefined();
  });

  it('should not do validation if user has not enabled preference', async () => {
    const ppomController = {
      usePPOM: async () => Promise.resolve('VALIDATION_RESULT'),
    };
    const preferenceController = {
      store: { getState: () => ({ securityAlertsEnabled: false }) },
    };
    const middlewareFunction = createPPOMMiddleware(
      ppomController as any,
      preferenceController as any,
    );
    const req = {
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };
    await middlewareFunction(req, undefined, () => undefined);
    expect(req.securityAlertResponse).toBeUndefined();
  });

  it('should set Failed type in response if usePPOM throw error', async () => {
    const ppomController = {
      usePPOM: async () => {
        throw new Error('some error');
      },
    };
    const preferenceController = {
      store: { getState: () => ({ securityAlertsEnabled: true }) },
    };
    const middlewareFunction = createPPOMMiddleware(
      ppomController as any,
      preferenceController as any,
    );
    const req = {
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };
    await middlewareFunction(req, undefined, () => undefined);
    expect((req.securityAlertResponse as any)?.result_type).toBe(
      BlockaidResultType.Failed,
    );
    expect((req.securityAlertResponse as any)?.reason).toBe(
      BlockaidReason.failed,
    );
  });

  it('should call next method when ppomController.usePPOM completes', async () => {
    const ppom = {
      validateJsonRpc: () => undefined,
    };
    const ppomController = {
      usePPOM: async (callback: any) => {
        callback(ppom);
      },
    };
    const preferenceController = {
      store: { getState: () => ({ securityAlertsEnabled: true }) },
    };
    const middlewareFunction = createPPOMMiddleware(
      ppomController as any,
      preferenceController as any,
    );
    const nextMock = jest.fn();
    await middlewareFunction(
      { method: 'eth_sendTransaction' },
      undefined,
      nextMock,
    );
    expect(nextMock).toHaveBeenCalledTimes(1);
  });

  it('should call next method when ppomController.usePPOM throws error', async () => {
    const ppomController = {
      usePPOM: async (_callback: any) => {
        throw Error('Some error');
      },
    };
    const preferenceController = {
      store: { getState: () => ({ securityAlertsEnabled: true }) },
    };
    const middlewareFunction = createPPOMMiddleware(
      ppomController as any,
      preferenceController as any,
    );
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
    const ppomController = {
      usePPOM: async (callback: any) => {
        callback(ppom);
      },
    };
    const preferenceController = {
      store: { getState: () => ({ securityAlertsEnabled: true }) },
    };
    const middlewareFunction = createPPOMMiddleware(
      ppomController as any,
      preferenceController as any,
    );
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
    const ppomController = {
      usePPOM: async (callback: any) => {
        callback(ppom);
      },
    };
    const preferenceController = {
      store: { getState: () => ({ securityAlertsEnabled: true }) },
    };
    const middlewareFunction = createPPOMMiddleware(
      ppomController as any,
      preferenceController as any,
    );
    await middlewareFunction(
      { method: 'eth_someRequest' },
      undefined,
      () => undefined,
    );
    expect(validateMock).toHaveBeenCalledTimes(0);
  });
});
