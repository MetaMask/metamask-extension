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
import { addTransactionBatch } from '../../store/controller-actions/transaction-controller';
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

// Mock useEIP7702Account hook
const mockUpgradeAccountEIP7702 = jest.fn();
const mockIsUpgraded = jest.fn();

jest.mock('../../pages/confirmations/hooks/useEIP7702Account', () => ({
  useEIP7702Account: () => ({
    upgradeAccount: mockUpgradeAccountEIP7702,
    isUpgraded: mockIsUpgraded,
  }),
}));

// Mock useEIP7702Networks hook
jest.mock('../../pages/confirmations/hooks/useEIP7702Networks', () => ({
  useEIP7702Networks: () => ({
    network7702List: [
      {
        chainId: '0x1',
        chainIdHex: '0x1',
        isSupported: true,
        upgradeContractAddress: '0x1234567890123456789012345678901234567890',
      },
    ],
    pending: false,
  }),
}));

const mockAddTransaction = addTransaction as jest.MockedFunction<
  typeof addTransaction
>;
const mockAddTransactionBatch = addTransactionBatch as jest.MockedFunction<
  typeof addTransactionBatch
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
    mockUpgradeAccountEIP7702.mockClear();
    mockIsUpgraded.mockClear();

    // Setup default mock implementations
    mockDecodeDelegations.mockReturnValue([mockDelegation]);
    mockEncodeDisableDelegation.mockReturnValue(
      '0xencodeddata' as `0x${string}`,
    );
    mockAddTransaction.mockResolvedValue(mockTransactionMeta as never);
    mockAddTransactionBatch.mockResolvedValue({ batchId: 'test-batch-id' });
    mockIsUpgraded.mockResolvedValue(true);
    mockUpgradeAccountEIP7702.mockResolvedValue(undefined);
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
  });

  describe('revokeGatorPermissionBatch', () => {
    it('should revoke multiple gator permissions in a batch', async () => {
      const mockDispatch = jest.fn().mockResolvedValue(mockTransactionMeta);
      store.dispatch = mockDispatch;

      const batchTransactionMeta = {
        ...mockTransactionMeta,
        id: 'test-batch-transaction-id',
        batchId: 'test-batch-id',
      };
      mockConfirmations.push(batchTransactionMeta);

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
        const transactionMeta = await result.current.revokeGatorPermissionBatch(
          [
            {
              permissionContext: '0x1234567890abcdef' as Hex,
              delegationManagerAddress: mockDelegationManagerAddress,
            },
            {
              permissionContext: '0xfedcba0987654321' as Hex,
              delegationManagerAddress: mockDelegationManagerAddress,
            },
          ],
        );

        expect(transactionMeta).toBe(batchTransactionMeta);
      });

      expect(mockIsUpgraded).toHaveBeenCalledWith(mockSelectedAccountAddress);
      expect(mockDecodeDelegations).toHaveBeenCalledTimes(2);
      expect(mockEncodeDisableDelegation).toHaveBeenCalledTimes(2);
      expect(mockAddTransactionBatch).toHaveBeenCalledWith({
        from: mockSelectedAccountAddress as `0x${string}`,
        networkClientId: 'mock-network-client-id',
        origin: 'metamask',
        requireApproval: true,
        securityAlertId: expect.any(String),
        transactions: [
          {
            params: {
              to: mockDelegationManagerAddress,
              data: '0xencodeddata',
              value: '0x0' as `0x${string}`,
            },
          },
          {
            params: {
              to: mockDelegationManagerAddress,
              data: '0xencodeddata',
              value: '0x0' as `0x${string}`,
            },
          },
        ],
      });
    });

    it('should handle empty permission contexts array', async () => {
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
          result.current.revokeGatorPermissionBatch([]),
        ).rejects.toThrow('No permission contexts provided');
      });

      expect(mockAddTransactionBatch).not.toHaveBeenCalled();
    });

    it('should handle batch transaction creation failure', async () => {
      mockAddTransactionBatch.mockRejectedValue(
        new Error('Batch creation failed'),
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
        await expect(
          result.current.revokeGatorPermissionBatch([
            {
              permissionContext: mockPermissionContext,
              delegationManagerAddress: mockDelegationManagerAddress,
            },
          ]),
        ).rejects.toThrow('Batch creation failed');
      });

      expect(mockAddTransactionBatch).toHaveBeenCalled();
    });
  });
});
