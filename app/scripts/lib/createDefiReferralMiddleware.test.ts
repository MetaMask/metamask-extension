import { PendingJsonRpcResponse } from '@metamask/utils';
import { ValidPermission, type Caveat } from '@metamask/permission-controller';
import type { Json } from '@metamask/utils';
import {
  DEFI_REFERRAL_PARTNERS,
  DefiReferralPartner,
} from '../../../shared/constants/defi-referrals';
import { SECOND } from '../../../shared/constants/time';
import type { ExtendedJSONRPCRequest } from './createDefiReferralMiddleware';

const mockLogError = jest.fn();
jest.mock('loglevel', () => ({ error: mockLogError }));

let createDefiReferralMiddleware: typeof import('./createDefiReferralMiddleware').createDefiReferralMiddleware;
let ReferralTriggerType: typeof import('./createDefiReferralMiddleware').ReferralTriggerType;

const TEST_PARTNER = DEFI_REFERRAL_PARTNERS[DefiReferralPartner.Hyperliquid];
const TEST_PARTNER_ORIGIN = TEST_PARTNER.origin;
const NON_PARTNER_ORIGIN = 'https://example.com';
const TEST_PARTNER_2_STEP =
  DEFI_REFERRAL_PARTNERS[DefiReferralPartner.AsterDEX];
const TEST_PARTNER_2_STEP_ORIGIN = TEST_PARTNER_2_STEP.origin;

const createMockRequest = (
  origin: string,
  method = 'wallet_requestPermissions',
  tabId: number | undefined = 123,
): ExtendedJSONRPCRequest => ({
  id: 1,
  jsonrpc: '2.0',
  method,
  origin,
  tabId,
});

const createWalletRequestPermissionsResponse = (
  origin: string,
  parentCapability = 'eth_accounts',
): PendingJsonRpcResponse<ValidPermission<string, Caveat<string, Json>>[]> => ({
  id: 1,
  jsonrpc: '2.0',
  result: [
    {
      parentCapability,
      caveats: null,
      date: Date.now(),
      id: 'permission-id',
      invoker: origin,
    },
  ],
});

const createEthRequestAccountsResponse = (
  accounts: string[] = ['0x1234567890abcdef1234567890abcdef12345678'],
): PendingJsonRpcResponse<string[]> => ({
  id: 1,
  jsonrpc: '2.0',
  result: accounts,
});

const signTypedDataV4Response: PendingJsonRpcResponse<string> = {
  id: 1,
  jsonrpc: '2.0',
  result: '0xabcd1234',
};

describe('createDefiReferralMiddleware', () => {
  let mockHandleReferral: jest.Mock;
  let mockNext: jest.Mock;

  beforeEach(async () => {
    // Dynamic import so each test gets a fresh map (pending reset in afterEach)
    // eslint-disable-next-line import-x/extensions
    const module = await import('./createDefiReferralMiddleware.ts');
    createDefiReferralMiddleware = module.createDefiReferralMiddleware;
    ReferralTriggerType = module.ReferralTriggerType;
    jest.clearAllMocks();
    mockHandleReferral = jest.fn().mockResolvedValue(undefined);
    mockNext = jest.fn((cb) => cb?.());
  });

  afterEach(() => {
    jest.resetModules(); // Reset the ./createDefiReferralMiddleware.ts import
  });

  const runMiddleware = (
    request: ExtendedJSONRPCRequest,
    response: PendingJsonRpcResponse<Json>,
  ) => {
    const middleware = createDefiReferralMiddleware(mockHandleReferral);
    return new Promise<void>((resolve) => {
      middleware(
        request,
        response as PendingJsonRpcResponse<
          ValidPermission<string, Caveat<string, Json>>[]
        >,
        mockNext,
        () => resolve(),
      );
    });
  };

  describe('Partners with single-step `permissions` connection flow', () => {
    describe('wallet_requestPermissions requests', () => {
      it('triggers referral when eth_accounts permission is granted', async () => {
        await runMiddleware(
          createMockRequest(TEST_PARTNER_ORIGIN),
          createWalletRequestPermissionsResponse(TEST_PARTNER_ORIGIN),
        );

        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockHandleReferral).toHaveBeenCalledTimes(1);
        expect(mockHandleReferral).toHaveBeenCalledWith(
          TEST_PARTNER,
          123,
          ReferralTriggerType.NewConnection,
        );
      });

      it('does not trigger referral when eth_accounts permission is not in result', async () => {
        await runMiddleware(
          createMockRequest(TEST_PARTNER_ORIGIN),
          createWalletRequestPermissionsResponse(
            TEST_PARTNER_ORIGIN,
            'other_permission',
          ),
        );

        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockHandleReferral).not.toHaveBeenCalled();
      });
    });

    describe('eth_requestAccounts requests', () => {
      it('triggers referral when accounts are returned', async () => {
        await runMiddleware(
          createMockRequest(TEST_PARTNER_ORIGIN, 'eth_requestAccounts'),
          createEthRequestAccountsResponse(),
        );

        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockHandleReferral).toHaveBeenCalledTimes(1);
        expect(mockHandleReferral).toHaveBeenCalledWith(
          TEST_PARTNER,
          123,
          ReferralTriggerType.NewConnection,
        );
      });

      it('does not trigger referral when result is empty', async () => {
        await runMiddleware(
          createMockRequest(TEST_PARTNER_ORIGIN, 'eth_requestAccounts'),
          createEthRequestAccountsResponse([]),
        );

        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockHandleReferral).not.toHaveBeenCalled();
      });
    });
  });

  describe('non-triggering RPC methods', () => {
    it('does not trigger referral for other methods', async () => {
      await runMiddleware(
        createMockRequest(TEST_PARTNER_ORIGIN, 'eth_chainId'),
        { id: 1, jsonrpc: '2.0', result: '0x1' },
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockHandleReferral).not.toHaveBeenCalled();
    });
  });

  describe('non-partner origins', () => {
    it('does not trigger referral for unknown origins', async () => {
      await runMiddleware(
        createMockRequest(NON_PARTNER_ORIGIN),
        createWalletRequestPermissionsResponse(NON_PARTNER_ORIGIN),
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockHandleReferral).not.toHaveBeenCalled();
    });
  });

  describe('invalid requests', () => {
    it('does not trigger referral when origin is missing', async () => {
      const requestMissingOrigin = {
        id: 1,
        jsonrpc: '2.0' as const,
        method: 'wallet_requestPermissions',
        tabId: 123,
      };

      await runMiddleware(
        requestMissingOrigin as ExtendedJSONRPCRequest,
        createWalletRequestPermissionsResponse(TEST_PARTNER_ORIGIN),
      );

      expect(mockHandleReferral).not.toHaveBeenCalled();
    });

    it('does not trigger referral when tabId is missing', async () => {
      const requestMissingTabId = {
        id: 1,
        jsonrpc: '2.0' as const,
        method: 'wallet_requestPermissions',
        origin: TEST_PARTNER_ORIGIN,
      };

      await runMiddleware(
        requestMissingTabId as ExtendedJSONRPCRequest,
        createWalletRequestPermissionsResponse(TEST_PARTNER_ORIGIN),
      );

      expect(mockHandleReferral).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('logs error when referral handler fails', async () => {
      const error = new Error('Referral handler failed');
      mockHandleReferral.mockRejectedValue(error);

      await runMiddleware(
        createMockRequest(TEST_PARTNER_ORIGIN),
        createWalletRequestPermissionsResponse(TEST_PARTNER_ORIGIN),
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockHandleReferral).toHaveBeenCalledTimes(1);
      expect(mockLogError).toHaveBeenCalledTimes(1);
      expect(mockLogError).toHaveBeenCalledWith(
        `Failed to handle ${TEST_PARTNER.name} referral after permissions grant: `,
        error,
      );
    });
  });

  describe('Partners with two-step `permissions_then_signature` connection flow', () => {
    it('does not trigger on permissions alone', async () => {
      await runMiddleware(
        createMockRequest(
          TEST_PARTNER_2_STEP_ORIGIN,
          'wallet_requestPermissions',
        ),
        createWalletRequestPermissionsResponse(TEST_PARTNER_2_STEP_ORIGIN),
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockHandleReferral).not.toHaveBeenCalled();
    });

    it('triggers after permissions then eth_signTypedData_v4 success', async () => {
      await runMiddleware(
        createMockRequest(
          TEST_PARTNER_2_STEP_ORIGIN,
          'wallet_requestPermissions',
        ),
        createWalletRequestPermissionsResponse(TEST_PARTNER_2_STEP_ORIGIN),
      );
      expect(mockHandleReferral).not.toHaveBeenCalled();

      await runMiddleware(
        createMockRequest(TEST_PARTNER_2_STEP_ORIGIN, 'eth_signTypedData_v4'),
        signTypedDataV4Response,
      );

      expect(mockHandleReferral).toHaveBeenCalledTimes(1);
      expect(mockHandleReferral).toHaveBeenCalledWith(
        TEST_PARTNER_2_STEP,
        123,
        ReferralTriggerType.NewConnection,
      );
    });

    it('does not trigger when eth_signTypedData_v4 has no prior permissions', async () => {
      await runMiddleware(
        createMockRequest(
          TEST_PARTNER_2_STEP_ORIGIN,
          'eth_signTypedData_v4',
          123,
        ),
        signTypedDataV4Response,
      );

      expect(mockHandleReferral).not.toHaveBeenCalled();
    });

    it('does not trigger when eth_signTypedData_v4 result is not a string', async () => {
      await runMiddleware(
        createMockRequest(
          TEST_PARTNER_2_STEP_ORIGIN,
          'wallet_requestPermissions',
        ),
        createWalletRequestPermissionsResponse(TEST_PARTNER_2_STEP_ORIGIN),
      );
      await runMiddleware(
        createMockRequest(
          TEST_PARTNER_2_STEP_ORIGIN,
          'eth_signTypedData_v4',
          123,
        ),
        { id: 1, jsonrpc: '2.0', result: null },
      );

      expect(mockHandleReferral).not.toHaveBeenCalled();
    });

    it('does not trigger when eth_signTypedData_v4 is after the wait window', async () => {
      jest.useFakeTimers();

      await runMiddleware(
        createMockRequest(
          TEST_PARTNER_2_STEP_ORIGIN,
          'wallet_requestPermissions',
        ),
        createWalletRequestPermissionsResponse(TEST_PARTNER_2_STEP_ORIGIN),
      );
      expect(mockHandleReferral).not.toHaveBeenCalled();

      // Advance past WAIT_AFTER_FIRST_REQUEST_MS so the interval prunes the entry
      jest.advanceTimersByTime(SECOND * 10 + 1);

      await runMiddleware(
        createMockRequest(TEST_PARTNER_2_STEP_ORIGIN, 'eth_signTypedData_v4'),
        signTypedDataV4Response,
      );

      expect(mockHandleReferral).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });
});
