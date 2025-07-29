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
import { addTransaction } from '../../store/actions';
import { encodeDisableDelegation } from '../../../shared/lib/delegation/delegation';
import { useRevokeGatorPermissions } from './useRevokeGatorPermissions';

// Mock the dependencies
jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
  addTransaction: jest.fn(),
}));

jest.mock('../../store/controller-actions/transaction-controller', () => ({
  addTransactionBatch: jest.fn(),
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
const mockDecodeDelegations = decodeDelegations as jest.MockedFunction<
  typeof decodeDelegations
>;
const mockEncodeDisableDelegation =
  encodeDisableDelegation as jest.MockedFunction<
    typeof encodeDisableDelegation
  >;

const mockStore = configureStore();

describe('useRevokeGatorPermissions', () => {
  let store: Store;
  const mockChainId = '0x1' as Hex;
  const mockPermissionContext = '0x1234567890abcdef' as Hex;
  const mockDelegationManagerAddress =
    '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3' as Hex;
  const mockSelectedAccountAddress =
    '0x4f71DA06987BfeDE90aF0b33E1e3e4ffDCEE7a63';

  // Type the mock delegation to match what decodeDelegations returns from @metamask/delegation-core'
  const mockDelegation = {
    delegator: mockSelectedAccountAddress as Hex,
    delegate: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778' as Hex,
    authority:
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' as Hex,
    caveats: [],
    salt: 12345n,
    signature: '0x1234567' as Hex,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any; // Use any to bypass the complex DelegationStruct type

  const mockTransactionMeta = {
    id: 'test-transaction-id',
    chainId: mockChainId,
    hash: '0x1234567890abcdef',
    txParams: {
      from: mockSelectedAccountAddress,
      to: mockDelegationManagerAddress,
      data: '0xencodeddata',
      value: '0x0',
    },
    type: TransactionType.contractInteraction,
    status: TransactionStatus.unapproved,
    time: Date.now(),
  } as TransactionMeta;

  beforeEach(() => {
    store = mockStore({
      metamask: {
        networkConfigurationsByChainId: {
          [mockChainId]: {
            chainId: mockChainId,
            nickname: 'Ethereum Mainnet',
            rpcEndpoints: [
              {
                url: 'https://mainnet.infura.io/v3/test',
                networkClientId: 'mock-network-client-id',
                defaultRpcEndpointIndex: 0,
              },
            ],
            defaultRpcEndpointIndex: 0,
          },
        },
      },
    });

    jest.clearAllMocks();
    mockConfirmations.length = 0;
    mockNavigateToId.mockClear();

    // Setup default mock implementations
    mockDecodeDelegations.mockReturnValue([mockDelegation]);
    mockEncodeDisableDelegation.mockReturnValue(
      '0xencodeddata' as `0x${string}`,
    );
    mockAddTransaction.mockResolvedValue(mockTransactionMeta as never);
  });

  describe('revokeGatorPermission', () => {
    it('should revoke a single gator permission', async () => {
      const mockDispatch = jest.fn().mockResolvedValue(mockTransactionMeta);
      store.dispatch = mockDispatch;

      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
            accountAddress: mockSelectedAccountAddress as `0x${string}`,
            chainId: mockChainId,
          }),
        {
          wrapper: ({ children }) => (
            <Provider store={store}>{children}</Provider>
          ),
        },
      );

      await act(async () => {
        const transactionMeta = await result.current.revokeGatorPermission(
          mockPermissionContext,
          mockDelegationManagerAddress,
        );

        expect(transactionMeta).toBe(mockTransactionMeta);
      });

      expect(mockDecodeDelegations).toHaveBeenCalledWith(mockPermissionContext);
      expect(mockEncodeDisableDelegation).toHaveBeenCalledWith({
        delegation: {
          ...mockDelegation,
          salt: mockDelegation.salt.toString() as `0x${string}`,
        },
      });
      expect(mockAddTransaction).toHaveBeenCalledWith(
        {
          from: mockSelectedAccountAddress,
          to: mockDelegationManagerAddress,
          data: '0xencodeddata',
          value: '0x0',
        },
        {
          networkClientId: 'mock-network-client-id',
          type: TransactionType.contractInteraction,
        },
      );
    });

    it('should throw error when delegator address does not match account address', async () => {
      const differentAccountAddress =
        '0x1234567890123456789012345678901234567890';
      const mockDelegationWithDifferentDelegator = {
        ...mockDelegation,
        delegator: differentAccountAddress as Hex,
      };

      mockDecodeDelegations.mockReturnValue([
        mockDelegationWithDifferentDelegator,
      ]);

      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
            accountAddress: mockSelectedAccountAddress as `0x${string}`,
            chainId: mockChainId,
          }),
        {
          wrapper: ({ children }) => (
            <Provider store={store}>{children}</Provider>
          ),
        },
      );

      await act(async () => {
        await expect(
          result.current.revokeGatorPermission(
            mockPermissionContext,
            mockDelegationManagerAddress,
          ),
        ).rejects.toThrow(
          `Delegator address does not match. Expected: ${mockSelectedAccountAddress}, Got: ${differentAccountAddress}`,
        );
      });

      expect(mockDecodeDelegations).toHaveBeenCalledWith(mockPermissionContext);
      expect(mockEncodeDisableDelegation).not.toHaveBeenCalled();
      expect(mockAddTransaction).not.toHaveBeenCalled();
    });

    it('should handle navigation when transaction is pending', async () => {
      mockConfirmations.push({
        id: 'test-transaction-id',
        status: TransactionStatus.unapproved,
      } as unknown as ApprovalRequest<Record<string, Json>>);

      const mockOnRedirect = jest.fn();

      const mockDispatch = jest.fn().mockResolvedValue(mockTransactionMeta);
      store.dispatch = mockDispatch;

      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
            accountAddress: mockSelectedAccountAddress as `0x${string}`,
            chainId: mockChainId,
            onRedirect: mockOnRedirect,
          }),
        {
          wrapper: ({ children }) => (
            <Provider store={store}>{children}</Provider>
          ),
        },
      );

      await act(async () => {
        await result.current.revokeGatorPermission(
          mockPermissionContext,
          mockDelegationManagerAddress,
        );
      });

      expect(mockNavigateToId).toHaveBeenCalledWith('test-transaction-id');
      expect(mockOnRedirect).toHaveBeenCalled();
    });

    it('should not navigate when transaction is not pending', async () => {
      const mockOnRedirect = jest.fn();

      const mockDispatch = jest.fn().mockResolvedValue(mockTransactionMeta);
      store.dispatch = mockDispatch;

      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
            accountAddress: mockSelectedAccountAddress as `0x${string}`,
            chainId: mockChainId,
            onRedirect: mockOnRedirect,
          }),
        {
          wrapper: ({ children }) => (
            <Provider store={store}>{children}</Provider>
          ),
        },
      );

      await act(async () => {
        await result.current.revokeGatorPermission(
          mockPermissionContext,
          mockDelegationManagerAddress,
        );
      });

      expect(mockNavigateToId).not.toHaveBeenCalled();
      expect(mockOnRedirect).not.toHaveBeenCalled();
    });

    it('should handle missing defaultRpcEndpoint', async () => {
      const storeWithoutRpc = mockStore({
        metamask: {
          networkConfigurationsByChainId: {
            [mockChainId]: {
              chainId: mockChainId,
              nickname: 'Ethereum Mainnet',
              rpcEndpoints: [],
              defaultRpcEndpointIndex: 0,
            },
          },
        },
      });

      mockAddTransaction.mockRejectedValue(
        new Error('Failed to add transaction'),
      );

      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
            accountAddress: mockSelectedAccountAddress as `0x${string}`,
            chainId: mockChainId,
          }),
        {
          wrapper: ({ children }) => (
            <Provider store={storeWithoutRpc}>{children}</Provider>
          ),
        },
      );

      await act(async () => {
        await expect(
          result.current.revokeGatorPermission(
            mockPermissionContext,
            mockDelegationManagerAddress,
          ),
        ).rejects.toThrow('Failed to add transaction');
      });

      expect(mockDecodeDelegations).toHaveBeenCalledWith(mockPermissionContext);
      expect(mockEncodeDisableDelegation).toHaveBeenCalled();
      expect(mockAddTransaction).toHaveBeenCalled();
    });

    it('should throw error when no delegation is found in permission context', async () => {
      mockDecodeDelegations.mockReturnValue([]);

      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
            accountAddress: mockSelectedAccountAddress as `0x${string}`,
            chainId: mockChainId,
          }),
        {
          wrapper: ({ children }) => (
            <Provider store={store}>{children}</Provider>
          ),
        },
      );

      await act(async () => {
        await expect(
          result.current.revokeGatorPermission(
            mockPermissionContext,
            mockDelegationManagerAddress,
          ),
        ).rejects.toThrow('No delegation found');
      });

      expect(mockDecodeDelegations).toHaveBeenCalledWith(mockPermissionContext);
      expect(mockEncodeDisableDelegation).not.toHaveBeenCalled();
      expect(mockAddTransaction).not.toHaveBeenCalled();
    });

    it('should handle transaction meta without id', async () => {
      const mockTransactionMetaWithoutId = {
        ...mockTransactionMeta,
        id: undefined,
      };

      mockAddTransaction.mockResolvedValue(
        mockTransactionMetaWithoutId as never,
      );

      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
            accountAddress: mockSelectedAccountAddress as `0x${string}`,
            chainId: mockChainId,
          }),
        {
          wrapper: ({ children }) => (
            <Provider store={store}>{children}</Provider>
          ),
        },
      );

      await act(async () => {
        const transactionMeta = await result.current.revokeGatorPermission(
          mockPermissionContext,
          mockDelegationManagerAddress,
        );

        expect(transactionMeta).toBe(mockTransactionMetaWithoutId);
      });

      expect(mockDecodeDelegations).toHaveBeenCalledWith(mockPermissionContext);
      expect(mockEncodeDisableDelegation).toHaveBeenCalled();
      expect(mockAddTransaction).toHaveBeenCalled();
    });

    it('should handle onRedirect callback when provided', async () => {
      const mockOnRedirect = jest.fn();
      mockConfirmations.push({
        id: 'test-transaction-id',
        status: TransactionStatus.unapproved,
      } as unknown as ApprovalRequest<Record<string, Json>>);

      const mockDispatch = jest.fn().mockResolvedValue(mockTransactionMeta);
      store.dispatch = mockDispatch;

      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
            accountAddress: mockSelectedAccountAddress as `0x${string}`,
            chainId: mockChainId,
            onRedirect: mockOnRedirect,
          }),
        {
          wrapper: ({ children }) => (
            <Provider store={store}>{children}</Provider>
          ),
        },
      );

      await act(async () => {
        await result.current.revokeGatorPermission(
          mockPermissionContext,
          mockDelegationManagerAddress,
        );
      });

      expect(mockNavigateToId).toHaveBeenCalledWith('test-transaction-id');
      expect(mockOnRedirect).toHaveBeenCalled();
    });

    it('should handle case when onRedirect is not provided', async () => {
      mockConfirmations.push({
        id: 'test-transaction-id',
        status: TransactionStatus.unapproved,
      } as unknown as ApprovalRequest<Record<string, Json>>);

      const mockDispatch = jest.fn().mockResolvedValue(mockTransactionMeta);
      store.dispatch = mockDispatch;

      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
            accountAddress: mockSelectedAccountAddress as `0x${string}`,
            chainId: mockChainId,
          }),
        {
          wrapper: ({ children }) => (
            <Provider store={store}>{children}</Provider>
          ),
        },
      );

      await act(async () => {
        await result.current.revokeGatorPermission(
          mockPermissionContext,
          mockDelegationManagerAddress,
        );
      });

      expect(mockNavigateToId).toHaveBeenCalledWith('test-transaction-id');
    });
  });
});
