import {
  type Hex,
  JsonRpcRequestStruct,
  JsonRpcResponseStruct,
} from '@metamask/utils';
import { waitFor } from '@testing-library/react';
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
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  usePPOM?: any,
  options: {
    securityAlertsEnabled?: boolean;
    chainId?: Hex;
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUpdateSecurityAlertResponseByTxId?: any;
  } = {
    mockUpdateSecurityAlertResponseByTxId: () => undefined,
  },
) => {
  const {
    securityAlertsEnabled,
    chainId,
    mockUpdateSecurityAlertResponseByTxId,
  } = options;
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
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ppomController as any,
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    preferenceController as any,
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    networkController as any,
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appStateController as any,
    mockUpdateSecurityAlertResponseByTxId,
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
      { ...JsonRpcRequestStruct, method: 'eth_sendTransaction' },
      { ...JsonRpcResponseStruct },
      () => undefined,
    );
    expect(usePPOMMock).toHaveBeenCalledTimes(1);
  });

  it('adds loading response to confirmation requests while validation is in progress', async () => {
    const usePPOM = async () => Promise.resolve('VALIDATION_RESULT');
    const middlewareFunction = createMiddleWare(usePPOM);
    const req = {
      ...JsonRpcRequestStruct,
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };
    await middlewareFunction(
      req,
      { ...JsonRpcResponseStruct },
      () => undefined,
    );

    expect(req.securityAlertResponse.reason).toBe(BlockaidResultType.Loading);
    expect(req.securityAlertResponse.result_type).toBe(
      BlockaidReason.inProgress,
    );
  });

  it('adds validation response to confirmation requests on supported networks', async () => {
    const validateMock = jest.fn().mockImplementation(() =>
      Promise.resolve({
        result_type: BlockaidResultType.Malicious,
        reason: BlockaidReason.permitFarming,
      }),
    );

    const ppom = {
      validateJsonRpc: validateMock,
    };
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usePPOM = async (callback: any) => {
      callback(ppom);
    };
    const mockUpdateSecurityAlertResponseByTxId = jest.fn();
    const middlewareFunction = createMiddleWare(usePPOM, {
      chainId: '0xa',
      mockUpdateSecurityAlertResponseByTxId,
    });
    const req = {
      ...JsonRpcRequestStruct,
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };
    await middlewareFunction(
      req,
      { ...JsonRpcResponseStruct },
      () => undefined,
    );

    await waitFor(() => {
      const mockCallSecurityAlertResponse =
        mockUpdateSecurityAlertResponseByTxId.mock.calls[0][1];

      expect(mockCallSecurityAlertResponse.result_type).toBe(
        BlockaidResultType.Malicious,
      );
      expect(mockCallSecurityAlertResponse.reason).toBe(
        BlockaidReason.permitFarming,
      );
      expect(mockCallSecurityAlertResponse.securityAlertId).toBeDefined();
      expect(req.securityAlertResponse).toBeDefined();
    });
  });

  it('does not do validation if the user has not enabled the preference', async () => {
    const usePPOM = async () => Promise.resolve('VALIDATION_RESULT');
    const middlewareFunction = createMiddleWare(usePPOM, {
      securityAlertsEnabled: false,
    });
    const req = {
      ...JsonRpcRequestStruct,
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };
    await middlewareFunction(req, undefined, () => undefined);
    expect(req.securityAlertResponse).toBeUndefined();
  });

  it('does not do validation if user is not on a supported network', async () => {
    const usePPOM = async () => Promise.resolve('VALIDATION_RESULT');
    const middlewareFunction = createMiddleWare(usePPOM, {
      chainId: '0x2',
    });
    const req = {
      ...JsonRpcRequestStruct,
      method: 'eth_sendTransaction',
      securityAlertResponse: undefined,
    };
    await middlewareFunction(
      req,
      { ...JsonRpcResponseStruct },
      () => undefined,
    );
    expect(req.securityAlertResponse).toBeUndefined();
  });

  it('sets error types in the response if usePPOM throws an error', async () => {
    const usePPOM = async () => {
      throw new Error('some error');
    };
    const mockUpdateSecurityAlertResponseByTxId = jest.fn();
    const middlewareFunction = createMiddleWare(usePPOM, {
      mockUpdateSecurityAlertResponseByTxId,
    });
    const req = {
      ...JsonRpcRequestStruct,
      method: 'eth_sendTransaction',
    };
    await middlewareFunction(
      req,
      { ...JsonRpcResponseStruct },
      () => undefined,
    );

    await waitFor(() => {
      const mockCallSecurityAlertResponse =
        mockUpdateSecurityAlertResponseByTxId.mock.calls[0][1];
      expect(mockCallSecurityAlertResponse.description).toBe(
        'Error: some error',
      );
      expect(mockCallSecurityAlertResponse.result_type).toBe(
        BlockaidResultType.Errored,
      );
      expect(mockCallSecurityAlertResponse.result_type).toBe(
        BlockaidReason.errored,
      );
      expect(mockCallSecurityAlertResponse.securityAlertId).toBeDefined();
    });
  });

  it('calls next method when ppomController.usePPOM completes', async () => {
    const ppom = {
      validateJsonRpc: () => undefined,
    };
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usePPOM = async (callback: any) => {
      callback(ppom);
    };
    const middlewareFunction = createMiddleWare(usePPOM);
    const nextMock = jest.fn();
    await middlewareFunction(
      { ...JsonRpcRequestStruct, method: 'eth_sendTransaction' },
      { ...JsonRpcResponseStruct },
      nextMock,
    );
    expect(nextMock).toHaveBeenCalledTimes(1);
  });

  it('calls next method when ppomController.usePPOM throws error', async () => {
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usePPOM = async (_callback: any) => {
      throw Error('Some error');
    };
    const middlewareFunction = createMiddleWare(usePPOM);
    const nextMock = jest.fn();
    await middlewareFunction(
      { ...JsonRpcRequestStruct, method: 'eth_sendTransaction' },
      { ...JsonRpcResponseStruct },
      nextMock,
    );
    expect(nextMock).toHaveBeenCalledTimes(1);
  });
  it('calls ppom.validateJsonRpc when invoked', async () => {
    const validateMock = jest.fn();
    const ppom = {
      validateJsonRpc: validateMock,
    };
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usePPOM = async (callback: any) => {
      callback(ppom);
    };
    const middlewareFunction = createMiddleWare(usePPOM);
    await middlewareFunction(
      { ...JsonRpcRequestStruct, method: 'eth_sendTransaction' },
      { ...JsonRpcResponseStruct },
      () => undefined,
    );
    expect(validateMock).toHaveBeenCalledTimes(1);
  });

  it('does not call ppom.validateJsonRpc when request is not for confirmation method', async () => {
    const validateMock = jest.fn();
    const ppom = {
      validateJsonRpc: validateMock,
    };
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usePPOM = async (callback: any) => {
      callback(ppom);
    };
    const middlewareFunction = createMiddleWare(usePPOM);
    await middlewareFunction(
      { ...JsonRpcRequestStruct, method: 'eth_someRequest' },
      undefined,
      () => undefined,
    );
    expect(validateMock).toHaveBeenCalledTimes(0);
  });

  it('normalizes transaction requests before validation', async () => {
    const requestMock1 = {
      ...JsonRpcRequestStruct,
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

    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usePPOM = async (callback: any) => {
      callback(ppom);
    };

    const middlewareFunction = createMiddleWare(usePPOM);

    await middlewareFunction(
      requestMock1,
      { ...JsonRpcResponseStruct },
      () => undefined,
    );

    expect(normalizePPOMRequestMock).toHaveBeenCalledTimes(1);
    expect(normalizePPOMRequestMock).toHaveBeenCalledWith(requestMock1);

    expect(validateMock).toHaveBeenCalledTimes(1);
    expect(validateMock).toHaveBeenCalledWith(requestMock2);
  });
});
