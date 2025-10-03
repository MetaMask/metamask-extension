import { PendingJsonRpcResponse } from '@metamask/utils';
import { ValidPermission, type Caveat } from '@metamask/permission-controller';
import type { Json } from '@metamask/utils';
import log from 'loglevel';
import { HYPERLIQUID_ORIGIN } from '../../../shared/constants/referrals';
import {
  createHyperliquidReferralMiddleware,
  HyperliquidPermissionTriggerType,
  type ExtendedJSONRPCRequest,
} from './createHyperliquidReferralMiddleware';

jest.mock('loglevel', () => ({
  error: jest.fn(),
}));

const mockValidRequest: ExtendedJSONRPCRequest = {
  id: 1,
  jsonrpc: '2.0',
  method: 'wallet_requestPermissions',
  origin: HYPERLIQUID_ORIGIN,
  tabId: 123,
};

const mockValidResponse: PendingJsonRpcResponse<
  ValidPermission<string, Caveat<string, Json>>[]
> = {
  id: 1,
  jsonrpc: '2.0',
  result: [
    {
      parentCapability: 'eth_accounts',
      caveats: null,
      date: Date.now(),
      id: 'permission-id',
      invoker: HYPERLIQUID_ORIGIN,
    },
  ],
};

describe('createHyperliquidReferralMiddleware', () => {
  it('triggers referral when Hyperliquid permissions are granted', async () => {
    const mockHandleReferral = jest.fn();
    const middleware = createHyperliquidReferralMiddleware(mockHandleReferral);

    const mockNext = jest.fn((cb) => {
      if (cb) {
        cb();
      }
    });

    await new Promise<void>((resolve) => {
      middleware(mockValidRequest, mockValidResponse, mockNext, () => {
        resolve();
      });
    });

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockHandleReferral).toHaveBeenCalledTimes(1);
    expect(mockHandleReferral).toHaveBeenCalledWith(
      123,
      HyperliquidPermissionTriggerType.NewConnection,
    );
  });

  it('does not trigger referral if origin is not Hyperliquid', async () => {
    const mockHandleReferral = jest.fn();
    const middleware = createHyperliquidReferralMiddleware(mockHandleReferral);

    const request: ExtendedJSONRPCRequest = {
      id: 1,
      jsonrpc: '2.0',
      method: 'wallet_requestPermissions',
      origin: 'https://example.com', // Not Hyperliquid origin
      tabId: 123,
    };

    const response: PendingJsonRpcResponse<
      ValidPermission<string, Caveat<string, Json>>[]
    > = {
      id: 1,
      jsonrpc: '2.0',
      result: [
        {
          parentCapability: 'eth_accounts',
          caveats: null,
          date: Date.now(),
          id: 'permission-id',
          invoker: 'https://example.com',
        } as unknown as ValidPermission<string, Caveat<string, Json>>,
      ],
    };

    const mockNext = jest.fn((cb) => {
      if (cb) {
        cb();
      }
    });

    await new Promise<void>((resolve) => {
      middleware(request, response, mockNext, () => {
        resolve();
      });
    });

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockHandleReferral).not.toHaveBeenCalled();
  });

  it('does not trigger referral if method is not wallet_requestPermissions', async () => {
    const mockHandleReferral = jest.fn();
    const middleware = createHyperliquidReferralMiddleware(mockHandleReferral);

    const request: ExtendedJSONRPCRequest = {
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_requestAccounts', // Different method
      params: [],
      origin: HYPERLIQUID_ORIGIN,
      tabId: 123,
    };

    const mockNext = jest.fn((cb) => {
      if (cb) {
        cb();
      }
    });

    await new Promise<void>((resolve) => {
      middleware(request, mockValidResponse, mockNext, () => {
        resolve();
      });
    });

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockHandleReferral).not.toHaveBeenCalled();
  });

  it('does not trigger referral when result type is invalid or missing eth_accounts permission', async () => {
    const mockHandleReferral = jest.fn();
    const middleware = createHyperliquidReferralMiddleware(mockHandleReferral);

    // Test with undefined result
    const responseUndefined: PendingJsonRpcResponse<
      ValidPermission<string, Caveat<string, Json>>[]
    > = {
      id: 1,
      jsonrpc: '2.0',
      result: undefined, // Not an array
    };

    const mockNext1 = jest.fn((cb) => {
      if (cb) {
        cb();
      }
    });

    await new Promise<void>((resolve) => {
      middleware(mockValidRequest, responseUndefined, mockNext1, () => {
        resolve();
      });
    });

    expect(mockNext1).toHaveBeenCalledTimes(1);
    expect(mockHandleReferral).not.toHaveBeenCalled();

    // Test with array but no eth_accounts permission
    const requestNoEthAccounts: ExtendedJSONRPCRequest = {
      id: 2,
      jsonrpc: '2.0',
      method: 'wallet_requestPermissions',
      origin: HYPERLIQUID_ORIGIN,
      tabId: 456,
    };

    const responseNoEthAccounts: PendingJsonRpcResponse<
      ValidPermission<string, Caveat<string, Json>>[]
    > = {
      id: 2,
      jsonrpc: '2.0',
      result: [
        {
          parentCapability: 'other_permission', // Not eth_accounts
          caveats: null,
          date: Date.now(),
          id: 'permission-id',
          invoker: HYPERLIQUID_ORIGIN,
        } as unknown as ValidPermission<string, Caveat<string, Json>>,
      ],
    };

    const mockNext2 = jest.fn((cb) => {
      if (cb) {
        cb();
      }
    });

    await new Promise<void>((resolve) => {
      middleware(requestNoEthAccounts, responseNoEthAccounts, mockNext2, () => {
        resolve();
      });
    });

    expect(mockNext2).toHaveBeenCalledTimes(1);
    expect(mockHandleReferral).not.toHaveBeenCalled();
  });

  it('handles errors in referral handler gracefully', async () => {
    const error = new Error('Referral handler failed');
    const mockHandleReferral = jest.fn(() => {
      return Promise.reject(error);
    });
    const middleware = createHyperliquidReferralMiddleware(mockHandleReferral);

    const mockNext = jest.fn((cb) => {
      if (cb) {
        cb();
      }
    });

    // Clear any previous calls to log.error
    jest.clearAllMocks();

    await new Promise<void>((resolve) => {
      middleware(mockValidRequest, mockValidResponse, mockNext, () => {
        resolve();
      });
    });

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockHandleReferral).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith(
      'Failed to handle Hyperliquid referral after wallet_requestPermissions grant: ',
      error,
    );
  });
});
