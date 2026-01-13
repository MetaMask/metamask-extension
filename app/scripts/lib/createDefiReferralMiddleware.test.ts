import { PendingJsonRpcResponse } from '@metamask/utils';
import { ValidPermission, type Caveat } from '@metamask/permission-controller';
import type { Json } from '@metamask/utils';
import log from 'loglevel';
import {
  DEFI_REFERRAL_PARTNERS,
  DefiReferralPartner,
} from '../../../shared/constants/defi-referrals';
import {
  createDefiReferralMiddleware,
  ReferralTriggerType,
  type ExtendedJSONRPCRequest,
} from './createDefiReferralMiddleware';

jest.mock('loglevel', () => ({
  error: jest.fn(),
}));

const HYPERLIQUID_ORIGIN = DEFI_REFERRAL_PARTNERS[DefiReferralPartner.Hyperliquid].origin;

const createMockRequest = (origin: string): ExtendedJSONRPCRequest => ({
  id: 1,
  jsonrpc: '2.0',
  method: 'wallet_requestPermissions',
  origin,
  tabId: 123,
});

const createMockResponse = (
  origin: string,
): PendingJsonRpcResponse<ValidPermission<string, Caveat<string, Json>>[]> => ({
  id: 1,
  jsonrpc: '2.0',
  result: [
    {
      parentCapability: 'eth_accounts',
      caveats: null,
      date: Date.now(),
      id: 'permission-id',
      invoker: origin,
    },
  ],
});

describe('createDefiReferralMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('triggers referral for Hyperliquid when permissions are granted', async () => {
    const mockHandleReferral = jest.fn().mockResolvedValue(undefined);
    const middleware = createDefiReferralMiddleware(mockHandleReferral);

    const mockNext = jest.fn((cb) => {
      if (cb) cb();
    });

    await new Promise<void>((resolve) => {
      middleware(
        createMockRequest(HYPERLIQUID_ORIGIN),
        createMockResponse(HYPERLIQUID_ORIGIN),
        mockNext,
        () => resolve(),
      );
    });

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockHandleReferral).toHaveBeenCalledTimes(1);
    expect(mockHandleReferral).toHaveBeenCalledWith(
      DEFI_REFERRAL_PARTNERS[DefiReferralPartner.Hyperliquid],
      123,
      ReferralTriggerType.NewConnection,
    );
  });

  it('does not trigger referral for non-partner origins', async () => {
    const mockHandleReferral = jest.fn();
    const middleware = createDefiReferralMiddleware(mockHandleReferral);

    const mockNext = jest.fn((cb) => {
      if (cb) cb();
    });

    await new Promise<void>((resolve) => {
      middleware(
        createMockRequest('https://example.com'),
        createMockResponse('https://example.com'),
        mockNext,
        () => resolve(),
      );
    });

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockHandleReferral).not.toHaveBeenCalled();
  });

  it('does not trigger referral if method is not wallet_requestPermissions', async () => {
    const mockHandleReferral = jest.fn();
    const middleware = createDefiReferralMiddleware(mockHandleReferral);

    const request: ExtendedJSONRPCRequest = {
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_requestAccounts',
      params: [],
      origin: HYPERLIQUID_ORIGIN,
      tabId: 123,
    };

    const mockNext = jest.fn((cb) => {
      if (cb) cb();
    });

    await new Promise<void>((resolve) => {
      middleware(
        request,
        createMockResponse(HYPERLIQUID_ORIGIN),
        mockNext,
        () => resolve(),
      );
    });

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockHandleReferral).not.toHaveBeenCalled();
  });

  it('does not trigger referral when result is missing eth_accounts permission', async () => {
    const mockHandleReferral = jest.fn();
    const middleware = createDefiReferralMiddleware(mockHandleReferral);

    const responseNoEthAccounts: PendingJsonRpcResponse<
      ValidPermission<string, Caveat<string, Json>>[]
    > = {
      id: 1,
      jsonrpc: '2.0',
      result: [
        {
          parentCapability: 'other_permission',
          caveats: null,
          date: Date.now(),
          id: 'permission-id',
          invoker: HYPERLIQUID_ORIGIN,
        } as unknown as ValidPermission<string, Caveat<string, Json>>,
      ],
    };

    const mockNext = jest.fn((cb) => {
      if (cb) cb();
    });

    await new Promise<void>((resolve) => {
      middleware(
        createMockRequest(HYPERLIQUID_ORIGIN),
        responseNoEthAccounts,
        mockNext,
        () => resolve(),
      );
    });

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockHandleReferral).not.toHaveBeenCalled();
  });

  it('handles errors in referral handler gracefully', async () => {
    const error = new Error('Referral handler failed');
    const mockHandleReferral = jest.fn().mockRejectedValue(error);
    const middleware = createDefiReferralMiddleware(mockHandleReferral);

    const mockNext = jest.fn((cb) => {
      if (cb) cb();
    });

    await new Promise<void>((resolve) => {
      middleware(
        createMockRequest(HYPERLIQUID_ORIGIN),
        createMockResponse(HYPERLIQUID_ORIGIN),
        mockNext,
        () => resolve(),
      );
    });

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockHandleReferral).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith(
      'Failed to handle Hyperliquid referral after wallet_requestPermissions grant: ',
      error,
    );
  });

  it('does not trigger referral when request is missing origin or tabId', async () => {
    const mockHandleReferral = jest.fn();
    const middleware = createDefiReferralMiddleware(mockHandleReferral);

    const requestMissingOrigin = {
      id: 1,
      jsonrpc: '2.0' as const,
      method: 'wallet_requestPermissions',
      tabId: 123,
    };

    const mockNext = jest.fn((cb) => {
      if (cb) cb();
    });

    await new Promise<void>((resolve) => {
      middleware(
        requestMissingOrigin,
        createMockResponse(HYPERLIQUID_ORIGIN),
        mockNext,
        () => resolve(),
      );
    });

    expect(mockHandleReferral).not.toHaveBeenCalled();
  });
});

