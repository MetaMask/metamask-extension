import React from 'react';
import { Provider } from 'react-redux';
import { renderHook, act } from '@testing-library/react-hooks';
import configureStore from 'redux-mock-store';
import type { Store } from 'redux';
import { Hex, Json } from '@metamask/utils';
import {
  TransactionMeta,
  TransactionType,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { decodeDelegations } from '@metamask/delegation-core';
import { ApprovalRequest } from '@metamask/approval-controller';
import {
  PermissionTypesWithCustom,
  Signer,
  StoredGatorPermissionSanitized,
} from '@metamask/gator-permissions-controller';
import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../store/actions';
import { encodeDisableDelegation } from '../../../shared/lib/delegation/delegation';
import { getMemoizedInternalAccountByAddress } from '../../selectors/accounts';
import {
  useRevokeGatorPermissionsMultiChain,
  RevokeGatorPermissionsMultiChainResults,
} from './useRevokeGatorPermissionsMultiChain';

// Mock the dependencies
jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
  addTransaction: jest.fn(),
  findNetworkClientIdByChainId: jest.fn(),
}));

jest.mock('@metamask/delegation-core', () => ({
  decodeDelegations: jest.fn(),
}));

jest.mock('../../../shared/lib/delegation/delegation', () => ({
  encodeDisableDelegation: jest.fn(),
}));

jest.mock('../../../shared/lib/delegation', () => ({
  getDeleGatorEnvironment: jest.fn(() => ({
    EIP7702StatelessDeleGatorImpl: '0x1234567890123456789012345678901234567890',
  })),
}));

// Mock the selectors
jest.mock('../../selectors/accounts', () => ({
  ...jest.requireActual('../../selectors/accounts'),
  getMemoizedInternalAccountByAddress: jest.fn(),
}));

// Mock useConfirmationNavigation hook
const mockNavigateToId = jest.fn();
const mockConfirmations: Partial<ApprovalRequest<Record<string, Json>>>[] = [];

jest.mock('../../pages/confirmations/hooks/useConfirmationNavigation', () => ({
  useConfirmationNavigation: () => ({
    confirmations: mockConfirmations,
    navigateToId: mockNavigateToId,
  }),
}));

const mockAddTransaction = addTransaction as jest.MockedFunction<
  typeof addTransaction
>;
const mockFindNetworkClientIdByChainId =
  findNetworkClientIdByChainId as jest.MockedFunction<
    typeof findNetworkClientIdByChainId
  >;
const mockDecodeDelegations = decodeDelegations as jest.MockedFunction<
  typeof decodeDelegations
>;
const mockEncodeDisableDelegation =
  encodeDisableDelegation as jest.MockedFunction<
    typeof encodeDisableDelegation
  >;
const mockGetMemoizedInternalAccountByAddress =
  getMemoizedInternalAccountByAddress as jest.MockedFunction<
    typeof getMemoizedInternalAccountByAddress
  >;

const mockStore = configureStore();

describe('useRevokeGatorPermissionsMultiChain', () => {
  let store: Store;
  const mockChainId1 = '0x1' as Hex;
  const mockChainId2 = '0x89' as Hex;
  const mockPermissionContext1 = '0x1234567890abcdef' as Hex;
  const mockPermissionContext2 = '0x9876543210fedcba' as Hex;
  const mockDelegationManagerAddress =
    '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3' as Hex;
  const mockSelectedAccountAddress =
    '0x4f71DA06987BfeDE90aF0b33E1e3e4ffDCEE7a63';
  const mockNetworkClientId1 = 'mock-network-client-id-1';
  const mockNetworkClientId2 = 'mock-network-client-id-2';

  const mockPermission1: StoredGatorPermissionSanitized<
    Signer,
    PermissionTypesWithCustom
  > = {
    permissionResponse: {
      permission: {
        type: 'custom' as const,
        data: {},
        isAdjustmentAllowed: false,
      },
      chainId: mockChainId1,
      address: mockSelectedAccountAddress as Hex,
      context: mockPermissionContext1,
      signerMeta: {
        delegationManager: mockDelegationManagerAddress,
      },
    },
    siteOrigin: 'example.com',
  };

  const mockPermission2: StoredGatorPermissionSanitized<
    Signer,
    PermissionTypesWithCustom
  > = {
    permissionResponse: {
      permission: {
        type: 'custom' as const,
        data: {},
        isAdjustmentAllowed: false,
      },
      chainId: mockChainId2,
      address: mockSelectedAccountAddress as Hex,
      context: mockPermissionContext2,
      signerMeta: {
        delegationManager: mockDelegationManagerAddress,
      },
    },
    siteOrigin: 'example.com',
  };

  const mockTransactionMeta1: TransactionMeta = {
    id: 'tx-id-1',
    status: TransactionStatus.unapproved,
    chainId: mockChainId1,
    time: Date.now(),
    txParams: {
      from: mockSelectedAccountAddress,
      to: mockDelegationManagerAddress,
    },
    type: TransactionType.contractInteraction,
    networkClientId: mockNetworkClientId1,
  };

  const mockTransactionMeta2: TransactionMeta = {
    id: 'tx-id-2',
    status: TransactionStatus.unapproved,
    chainId: mockChainId2,
    time: Date.now(),
    txParams: {
      from: mockSelectedAccountAddress,
      to: mockDelegationManagerAddress,
    },
    type: TransactionType.contractInteraction,
    networkClientId: mockNetworkClientId2,
  };

  // Type the mock delegation to match what decodeDelegations returns from @metamask/delegation-core
  const mockDelegation = {
    salt: BigInt('0x123'),
    delegate: new Uint8Array(20),
    delegator: new Uint8Array(20),
    authority: new Uint8Array(20),
    caveats: [],
    signature: new Uint8Array(65),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    store = mockStore({
      metamask: {
        internalAccounts: {
          accounts: [
            {
              address: mockSelectedAccountAddress,
              id: 'account-id-1',
            },
          ],
        },
      },
    });

    mockGetMemoizedInternalAccountByAddress.mockReturnValue({
      address: mockSelectedAccountAddress,
      id: 'account-id-1',
      metadata: {
        name: 'Test Account',
        importTime: Date.now(),
        keyring: {
          type: 'HD Key Tree',
        },
      },
      options: {},
      methods: [],
      type: 'eip155:eoa',
      scopes: [],
    });

    mockDecodeDelegations.mockReturnValue([mockDelegation]);
    mockEncodeDisableDelegation.mockReturnValue('0xencodedCallData' as Hex);
    mockFindNetworkClientIdByChainId.mockResolvedValue(
      mockNetworkClientId1 as never,
    );
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  describe('revokeGatorPermissionsBatchMultiChain', () => {
    it('should revoke permissions across multiple chains', async () => {
      mockFindNetworkClientIdByChainId
        .mockResolvedValueOnce(mockNetworkClientId1 as never)
        .mockResolvedValueOnce(mockNetworkClientId2 as never);

      mockAddTransaction
        .mockResolvedValueOnce(mockTransactionMeta1)
        .mockResolvedValueOnce(mockTransactionMeta2);

      const { result } = renderHook(
        () => useRevokeGatorPermissionsMultiChain(),
        { wrapper },
      );

      const permissionsByChain = {
        [mockChainId1]: [mockPermission1],
        [mockChainId2]: [mockPermission2],
      };

      let results: RevokeGatorPermissionsMultiChainResults | undefined;
      await act(async () => {
        results =
          await result.current.revokeGatorPermissionsBatchMultiChain(
            permissionsByChain,
          );
      });

      expect(results).toBeDefined();
      if (!results) {
        throw new Error('Results should be defined');
      }
      expect(results[mockChainId1].revoked).toHaveLength(1);
      expect(results[mockChainId2].revoked).toHaveLength(1);
      expect(results[mockChainId1].errors).toHaveLength(0);
      expect(results[mockChainId2].errors).toHaveLength(0);
      expect(mockAddTransaction).toHaveBeenCalledTimes(2);
    });

    it('should continue processing other chains when one chain fails to find network client', async () => {
      mockFindNetworkClientIdByChainId
        .mockRejectedValueOnce(new Error('Network not found') as never)
        .mockResolvedValueOnce(mockNetworkClientId2 as never);

      mockAddTransaction.mockResolvedValueOnce(mockTransactionMeta2);

      const { result } = renderHook(
        () => useRevokeGatorPermissionsMultiChain(),
        { wrapper },
      );

      const permissionsByChain = {
        [mockChainId1]: [mockPermission1],
        [mockChainId2]: [mockPermission2],
      };

      let results: RevokeGatorPermissionsMultiChainResults | undefined;
      await act(async () => {
        results =
          await result.current.revokeGatorPermissionsBatchMultiChain(
            permissionsByChain,
          );
      });

      if (!results) {
        throw new Error('Results should be defined');
      }
      expect(results[mockChainId1].errors).toHaveLength(1);
      expect(results[mockChainId1].errors[0].message).toContain(
        'No network client ID found',
      );
      expect(results[mockChainId2].revoked).toHaveLength(1);
    });

    it('should handle multiple permissions on same chain', async () => {
      const mockPermission1b = {
        ...mockPermission1,
        permissionResponse: {
          ...mockPermission1.permissionResponse,
          context: '0xdifferentcontext' as Hex,
        },
      };

      mockAddTransaction
        .mockResolvedValueOnce(mockTransactionMeta1)
        .mockResolvedValueOnce({
          ...mockTransactionMeta1,
          id: 'tx-id-1b',
        });

      const { result } = renderHook(
        () => useRevokeGatorPermissionsMultiChain(),
        { wrapper },
      );

      const permissionsByChain = {
        [mockChainId1]: [mockPermission1, mockPermission1b],
      };

      let results: RevokeGatorPermissionsMultiChainResults | undefined;
      await act(async () => {
        results =
          await result.current.revokeGatorPermissionsBatchMultiChain(
            permissionsByChain,
          );
      });

      if (!results) {
        throw new Error('Results should be defined');
      }
      expect(results[mockChainId1].revoked).toHaveLength(2);
      expect(mockAddTransaction).toHaveBeenCalledTimes(2);
    });

    it('should skip permissions when internal account is not found', async () => {
      mockGetMemoizedInternalAccountByAddress.mockReturnValue(undefined);

      const { result } = renderHook(
        () => useRevokeGatorPermissionsMultiChain(),
        { wrapper },
      );

      const permissionsByChain = {
        [mockChainId1]: [mockPermission1],
      };

      let results: RevokeGatorPermissionsMultiChainResults | undefined;
      await act(async () => {
        results =
          await result.current.revokeGatorPermissionsBatchMultiChain(
            permissionsByChain,
          );
      });

      if (!results) {
        throw new Error('Results should be defined');
      }
      expect(results[mockChainId1].skipped).toHaveLength(1);
      expect(results[mockChainId1].revoked).toHaveLength(0);
    });

    it('should handle empty permissionsByChain object', async () => {
      const { result } = renderHook(
        () => useRevokeGatorPermissionsMultiChain(),
        { wrapper },
      );

      let results: RevokeGatorPermissionsMultiChainResults | undefined;
      await act(async () => {
        results = await result.current.revokeGatorPermissionsBatchMultiChain(
          {},
        );
      });

      expect(results).toEqual({});
      expect(mockAddTransaction).not.toHaveBeenCalled();
    });

    it('should handle navigation when onRedirect callback is provided', async () => {
      const mockOnRedirect = jest.fn();
      mockConfirmations.push({ id: 'tx-id-1' } as ApprovalRequest<
        Record<string, Json>
      >);

      mockAddTransaction.mockResolvedValueOnce(mockTransactionMeta1);

      const { result, rerender } = renderHook(
        () =>
          useRevokeGatorPermissionsMultiChain({ onRedirect: mockOnRedirect }),
        { wrapper },
      );

      const permissionsByChain = {
        [mockChainId1]: [mockPermission1],
      };

      await act(async () => {
        await result.current.revokeGatorPermissionsBatchMultiChain(
          permissionsByChain,
        );
      });

      // Trigger useEffect by rerendering
      rerender();

      expect(mockNavigateToId).toHaveBeenCalledWith('tx-id-1');
      expect(mockOnRedirect).toHaveBeenCalled();

      // Cleanup
      mockConfirmations.pop();
    });
  });
});
