import { normalizeTxParams } from '@metamask/transaction-controller';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../shared/constants/security-provider';
import { createPPOMMiddleware } from './ppom-middleware';

jest.mock('@metamask/transaction-controller', () => ({
  ...jest.requireActual('@metamask/transaction-controller'),
  normalizeTxParams: jest.fn(),
}));

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
  const normalizeTxParamsMock = jest.mocked(normalizeTxParams);

  beforeEach(() => {
    jest.resetAllMocks();

    normalizeTxParamsMock.mockImplementation((txParams) => txParams);
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
    const transactionParamsMock1 = { from: '0x1', to: '0x2', value: '0x3' };
    const transactionParamsMock2 = { from: '0x2', to: '0x3', value: '0x4' };

    const validateMock = jest.fn();

    normalizeTxParamsMock.mockReturnValue(transactionParamsMock2);

    const ppom = {
      validateJsonRpc: validateMock,
    };

    const usePPOM = async (callback: any) => {
      callback(ppom);
    };

    const middlewareFunction = createMiddleWare(usePPOM);

    await middlewareFunction(
      { method: 'eth_sendTransaction', params: [transactionParamsMock1] },
      undefined,
      () => undefined,
    );

    expect(normalizeTxParamsMock).toHaveBeenCalledTimes(1);
    expect(normalizeTxParamsMock).toHaveBeenCalledWith(transactionParamsMock1);

    expect(validateMock).toHaveBeenCalledTimes(1);
    expect(validateMock).toHaveBeenCalledWith(
      expect.objectContaining({ params: [transactionParamsMock2] }),
    );
  });
});
