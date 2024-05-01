import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../shared/constants/security-provider';
import { createPPOMMiddleware } from './ppom-middleware';
import { normalizePPOMRequest } from './ppom-util';

jest.mock('./ppom-util');

Object.defineProperty(globalThis, 'fetch', {
  writable: true,
  value: () => undefined,
});

Object.defineProperty(globalThis, 'performance', {
  writable: true,
  value: () => undefined,
});

const createMiddleWare = (
  usePPOM?: any,
  securityAlertsEnabled?: boolean,
  chainId?: string,
) => {
  const usePPOMMock = jest.fn();
  const ppomController = {
    usePPOM: usePPOM || usePPOMMock,
  };
  const preferenceController = {
    store: {
      getState: () => ({
        securityAlertsEnabled:
          securityAlertsEnabled === undefined ?? securityAlertsEnabled,
      }),
    },
  };
  const networkController = {
    state: { providerConfig: { chainId: chainId || CHAIN_IDS.MAINNET } },
  };
  const appStateController = {
    addSignatureSecurityAlertResponse: () => undefined,
  };

  return createPPOMMiddleware(
    ppomController as any,
    preferenceController as any,
    networkController as any,
    appStateController as any,
    () => undefined,
  );
};

describe('PPOMMiddleware', () => {
  const normalizePPOMRequestMock = jest.mocked(normalizePPOMRequest);

  beforeEach(() => {
    jest.resetAllMocks();

    normalizePPOMRequestMock.mockImplementation((txParams) => txParams);
  });

  it('should call ppomController.usePPOM for requests of type confirmation', async () => {
    const usePPOMMock = jest.fn();
    const middlewareFunction = createMiddleWare(usePPOMMock);
    await middlewareFunction(
      { method: 'eth_sendTransaction' },
      undefined,
      () => undefined,
    );
    expect(usePPOMMock).toHaveBeenCalledTimes(1);
  });

  it('should add validation response on confirmation requests', async () => {
    const usePPOM = async () => Promise.resolve('VALIDATION_RESULT');
    const middlewareFunction = createMiddleWare(usePPOM);
    const req = {
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };
    await middlewareFunction(req, undefined, () => undefined);
    expect(req.securityAlertResponse).toBeDefined();
  });

  it('should not do validation if user has not enabled preference', async () => {
    const usePPOM = async () => Promise.resolve('VALIDATION_RESULT');
    const middlewareFunction = createMiddleWare(usePPOM, false);
    const req = {
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };
    await middlewareFunction(req, undefined, () => undefined);
    expect(req.securityAlertResponse).toBeUndefined();
  });

  it('should not do validation if user is not on mainnet', async () => {
    const usePPOM = async () => Promise.resolve('VALIDATION_RESULT');
    const middlewareFunction = createMiddleWare(usePPOM, false, '0x2');
    const req = {
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };
    await middlewareFunction(req, undefined, () => undefined);
    expect(req.securityAlertResponse).toBeUndefined();
  });

  it('should set error type in response if usePPOM throw error', async () => {
    const usePPOM = async () => {
      throw new Error('some error');
    };
    const middlewareFunction = createMiddleWare({ usePPOM });
    const req = {
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };
    await middlewareFunction(req, undefined, () => undefined);
    expect((req.securityAlertResponse as any)?.result_type).toBe(
      BlockaidResultType.Errored,
    );
    expect((req.securityAlertResponse as any)?.reason).toBe(
      BlockaidReason.errored,
    );
  });

  it('should call next method when ppomController.usePPOM completes', async () => {
    const ppom = {
      validateJsonRpc: () => undefined,
    };
    const usePPOM = async (callback: any) => {
      callback(ppom);
    };
    const middlewareFunction = createMiddleWare(usePPOM);
    const nextMock = jest.fn();
    await middlewareFunction(
      { method: 'eth_sendTransaction' },
      undefined,
      nextMock,
    );
    expect(nextMock).toHaveBeenCalledTimes(1);
  });

  it('should call next method when ppomController.usePPOM throws error', async () => {
    const usePPOM = async (_callback: any) => {
      throw Error('Some error');
    };
    const middlewareFunction = createMiddleWare(usePPOM);
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
    const usePPOM = async (callback: any) => {
      callback(ppom);
    };
    const middlewareFunction = createMiddleWare(usePPOM);
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
    const usePPOM = async (callback: any) => {
      callback(ppom);
    };
    const middlewareFunction = createMiddleWare(usePPOM);
    await middlewareFunction(
      { method: 'eth_someRequest' },
      undefined,
      () => undefined,
    );
    expect(validateMock).toHaveBeenCalledTimes(0);
  });

  it('normalizes transaction requests before validation', async () => {
    const requestMock1 = {
      method: 'eth_sendTransaction',
      params: [{ data: '0x1' }],
    };

    const requestMock2 = {
      ...requestMock1,
      params: [{ data: '0x2' }],
    };

    const validateMock = jest.fn();

    normalizePPOMRequestMock.mockReturnValue(requestMock2);

    const ppom = {
      validateJsonRpc: validateMock,
    };

    const usePPOM = async (callback: any) => {
      callback(ppom);
    };

    const middlewareFunction = createMiddleWare(usePPOM);

    await middlewareFunction(requestMock1, undefined, () => undefined);

    expect(normalizePPOMRequestMock).toHaveBeenCalledTimes(1);
    expect(normalizePPOMRequestMock).toHaveBeenCalledWith(requestMock1);

    expect(validateMock).toHaveBeenCalledTimes(1);
    expect(validateMock).toHaveBeenCalledWith(requestMock2);
  });
});
