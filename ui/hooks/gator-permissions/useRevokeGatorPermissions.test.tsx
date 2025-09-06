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
  PermissionTypes,
  SignerParam,
  StoredGatorPermissionSanitized,
} from '@metamask/gator-permissions-controller';
import { RpcEndpointType } from '@metamask/network-controller';
import { addTransaction } from '../../store/actions';
import { encodeDisableDelegation } from '../../../shared/lib/delegation/delegation';
import {
  getInternalAccounts,
  selectDefaultRpcEndpointByChainId,
} from '../../selectors';
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

// Mock the selectors
jest.mock('../../selectors', () => ({
  getInternalAccounts: jest.fn(),
  selectDefaultRpcEndpointByChainId: jest.fn(),
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

const mockGetInternalAccounts = getInternalAccounts as jest.MockedFunction<
  typeof getInternalAccounts
>;
const mockSelectDefaultRpcEndpointByChainId =
  selectDefaultRpcEndpointByChainId as jest.MockedFunction<
    typeof selectDefaultRpcEndpointByChainId
  >;

const mockStore = configureStore();

describe('useRevokeGatorPermissions', () => {
  let store: Store;
  const mockChainId = '0x1' as Hex;
  const mockPermissionContext = '0x1234567890abcdef' as Hex;
  const mockPermissionContext2 = '0x9876543210fedcba' as Hex;
  const mockDelegationManagerAddress =
    '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3' as Hex;
  const mockSelectedAccountAddress =
    '0x4f71DA06987BfeDE90aF0b33E1e3e4ffDCEE7a63';
  const mockNetworkClientId = 'mock-network-client-id';

  const mockGatorPermission: StoredGatorPermissionSanitized<
    SignerParam,
    PermissionTypes
  > = {
    permissionResponse: {
      chainId: mockChainId,
      address: mockSelectedAccountAddress,
      expiry: 1750291200,
      permission: {
        type: 'native-token-stream',
        data: {
          maxAmount: '0x22b1c8c1227a0000',
          initialAmount: '0x6f05b59d3b20000',
          amountPerSecond: '0x6f05b59d3b20000',
          startTime: 1747699200,
          justification:
            'This is a very important request for streaming allowance for some very important thing',
        },
        rules: {},
      },
      context: mockPermissionContext,
      signerMeta: {
        delegationManager: mockDelegationManagerAddress,
      },
    },
    siteOrigin: 'http://localhost:8000',
  };

  const mockGatorPermissions: StoredGatorPermissionSanitized<
    SignerParam,
    PermissionTypes
  >[] = [
    mockGatorPermission,
    {
      ...mockGatorPermission,
      permissionResponse: {
        ...mockGatorPermission.permissionResponse,
        context: mockPermissionContext2,
      },
    },
  ];

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

  const mockTransactionMeta2 = {
    id: 'test-transaction-id-2',
    chainId: mockChainId,
    hash: '0xabcdef1234567890',
    txParams: {
      from: mockSelectedAccountAddress,
      to: mockDelegationManagerAddress,
      data: '0xencodeddata2',
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
                networkClientId: mockNetworkClientId,
                defaultRpcEndpointIndex: 0,
              },
            ],
            defaultRpcEndpointIndex: 0,
          },
        },
        internalAccounts: {
          accounts: {
            'mock-account-id': {
              id: 'mock-account-id',
              address: mockSelectedAccountAddress,
              type: 'eoa',
              metadata: {
                name: 'Mock Account',
                keyring: {
                  type: 'hd',
                },
              },
            },
          },
          selectedAccount: 'mock-account-id',
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

    // Setup selector mocks
    mockGetInternalAccounts.mockReturnValue([
      {
        id: 'mock-account-id',
        address: mockSelectedAccountAddress,
        type: 'eip155:eoa',
        options: {},
        metadata: {
          name: 'Mock Account',
          importTime: Date.now(),
          keyring: {
            type: 'hd',
          },
        },
        scopes: ['eip155:1'],
        methods: ['eth_sendTransaction'],
      },
    ]);
    mockSelectDefaultRpcEndpointByChainId.mockReturnValue({
      url: 'https://mainnet.infura.io/v3/test',
      networkClientId: mockNetworkClientId,
      type: RpcEndpointType.Custom,
    });
  });

  describe('revokeGatorPermission', () => {
    it('should revoke a single gator permission', async () => {
      const mockDispatch = jest.fn().mockResolvedValue(mockTransactionMeta);
      store.dispatch = mockDispatch;

      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
            chainId: mockChainId,
          }),
        {
          wrapper: ({ children }) => (
            <Provider store={store}>{children}</Provider>
          ),
        },
      );

      await act(async () => {
        const transactionMeta =
          await result.current.revokeGatorPermission(mockGatorPermission);

        expect(transactionMeta).toBe(mockTransactionMeta);
      });

      expect(mockDecodeDelegations).toHaveBeenCalledWith(mockPermissionContext);
      expect(mockEncodeDisableDelegation).toHaveBeenCalledWith({
        delegation: {
          ...mockDelegation,
          salt: `0x${mockDelegation.salt.toString(16)}` as `0x${string}`,
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
          networkClientId: mockNetworkClientId,
          type: TransactionType.contractInteraction,
        },
      );
    });

    it('should throw error when no gator permission provided', async () => {
      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
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
          result.current.revokeGatorPermission(undefined as never),
        ).rejects.toThrow('No gator permission provided');
      });

      expect(mockDecodeDelegations).not.toHaveBeenCalled();
      expect(mockEncodeDisableDelegation).not.toHaveBeenCalled();
      expect(mockAddTransaction).not.toHaveBeenCalled();
    });

    it('should throw error when chain ID does not match the chain ID of the hook', async () => {
      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
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
          result.current.revokeGatorPermission({
            ...mockGatorPermission,
            permissionResponse: {
              ...mockGatorPermission.permissionResponse,
              chainId: '0x2',
            },
          }),
        ).rejects.toThrow('Chain ID does not match');
      });
    });

    it('should throw error when delegator address does not match account address in internal accounts', async () => {
      const differentAccountAddress =
        '0x1234567890123456789012345678901234567890';

      // Create a gator permission with a different address that doesn't exist in internal accounts
      const mockGatorPermissionWithDifferentAddress = {
        ...mockGatorPermission,
        permissionResponse: {
          ...mockGatorPermission.permissionResponse,
          address: differentAccountAddress as `0x${string}`,
        },
      };

      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
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
            mockGatorPermissionWithDifferentAddress,
          ),
        ).rejects.toThrow(
          'Internal account not found for delegator of permission',
        );
      });

      expect(mockDecodeDelegations).not.toHaveBeenCalled();
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
        await result.current.revokeGatorPermission(mockGatorPermission);
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
        await result.current.revokeGatorPermission(mockGatorPermission);
      });

      expect(mockNavigateToId).not.toHaveBeenCalled();
      expect(mockOnRedirect).not.toHaveBeenCalled();
    });

    it('should handle missing defaultRpcEndpoint', async () => {
      // Override the selector mock to return undefined for this test
      mockSelectDefaultRpcEndpointByChainId.mockReturnValue(undefined);

      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
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
          result.current.revokeGatorPermission(mockGatorPermission),
        ).rejects.toThrow('No default RPC endpoint found');
      });

      expect(mockDecodeDelegations).not.toHaveBeenCalled();
      expect(mockEncodeDisableDelegation).not.toHaveBeenCalled();
      expect(mockAddTransaction).not.toHaveBeenCalled();
    });

    it('should throw error when no delegation is found in permission context', async () => {
      mockDecodeDelegations.mockReturnValue([]);

      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
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
          result.current.revokeGatorPermission(mockGatorPermission),
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
            chainId: mockChainId,
          }),
        {
          wrapper: ({ children }) => (
            <Provider store={store}>{children}</Provider>
          ),
        },
      );

      await act(async () => {
        const transactionMeta =
          await result.current.revokeGatorPermission(mockGatorPermission);

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
        await result.current.revokeGatorPermission(mockGatorPermission);
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
            chainId: mockChainId,
          }),
        {
          wrapper: ({ children }) => (
            <Provider store={store}>{children}</Provider>
          ),
        },
      );

      await act(async () => {
        await result.current.revokeGatorPermission(mockGatorPermission);
      });

      expect(mockNavigateToId).toHaveBeenCalledWith('test-transaction-id');
    });

    it('should find delegator from internal accounts', () => {
      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
            chainId: mockChainId,
          }),
        {
          wrapper: ({ children }) => (
            <Provider store={store}>{children}</Provider>
          ),
        },
      );

      const foundAccount = result.current.findDelegatorFromInternalAccounts(
        mockSelectedAccountAddress as Hex,
      );

      expect(foundAccount).toBeDefined();
      expect(foundAccount?.address).toBe(mockSelectedAccountAddress);
      expect(foundAccount?.id).toBe('mock-account-id');
    });

    it('should return undefined when delegator is not found in internal accounts', () => {
      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
            chainId: mockChainId,
          }),
        {
          wrapper: ({ children }) => (
            <Provider store={store}>{children}</Provider>
          ),
        },
      );

      const foundAccount = result.current.findDelegatorFromInternalAccounts(
        '0x1234567890123456789012345678901234567890' as Hex,
      );

      expect(foundAccount).toBeUndefined();
    });
  });

  describe('revokeGatorPermissionBatch', () => {
    it('should revoke multiple gator permissions in batch', async () => {
      mockAddTransaction
        .mockResolvedValueOnce(mockTransactionMeta)
        .mockResolvedValueOnce(mockTransactionMeta2);

      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
            chainId: mockChainId,
          }),
        {
          wrapper: ({ children }) => (
            <Provider store={store}>{children}</Provider>
          ),
        },
      );

      await act(async () => {
        const transactionMetas =
          await result.current.revokeGatorPermissionBatch(mockGatorPermissions);

        expect(transactionMetas).toHaveLength(2);
        expect(transactionMetas[0]).toBe(mockTransactionMeta);
        expect(transactionMetas[1]).toBe(mockTransactionMeta2);
      });

      expect(mockDecodeDelegations).toHaveBeenCalledTimes(2);
      expect(mockEncodeDisableDelegation).toHaveBeenCalledTimes(2);
      expect(mockAddTransaction).toHaveBeenCalledTimes(2);
    });

    it('should throw error when no gator permissions provided', async () => {
      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
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
        ).rejects.toThrow('No gator permissions provided');
      });

      expect(mockDecodeDelegations).not.toHaveBeenCalled();
      expect(mockEncodeDisableDelegation).not.toHaveBeenCalled();
      expect(mockAddTransaction).not.toHaveBeenCalled();
    });

    it('should throw error when chain ID does not match the chain ID of the hook in batch', async () => {
      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
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
              ...mockGatorPermissions[0],
              permissionResponse: {
                ...mockGatorPermissions[0].permissionResponse,
                chainId: '0x2',
              },
            },
            mockGatorPermissions[1],
          ]),
        ).rejects.toThrow('Chain ID does not match');
      });

      expect(mockDecodeDelegations).not.toHaveBeenCalled();
      expect(mockEncodeDisableDelegation).not.toHaveBeenCalled();
      expect(mockAddTransaction).not.toHaveBeenCalled();
    });

    it('should throw error when delegator address does not match account address in internal accounts in batch', async () => {
      const differentAccountAddress =
        '0x1234567890123456789012345678901234567890';

      // Create a gator permission with a different address that doesn't exist in internal accounts
      const mockGatorPermissionWithDifferentAddress = {
        ...mockGatorPermissions[0],
        permissionResponse: {
          ...mockGatorPermissions[0].permissionResponse,
          address: differentAccountAddress as `0x${string}`,
        },
      };

      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
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
            mockGatorPermissionWithDifferentAddress,
          ]),
        ).rejects.toThrow(
          'Internal account not found for delegator of permission',
        );
      });

      expect(mockDecodeDelegations).not.toHaveBeenCalled();
      expect(mockEncodeDisableDelegation).not.toHaveBeenCalled();
      expect(mockAddTransaction).not.toHaveBeenCalled();
    });

    it('should throw error when no delegation is found in permission context in batch', async () => {
      mockDecodeDelegations.mockReturnValue([]);

      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
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
          result.current.revokeGatorPermissionBatch([mockGatorPermissions[0]]),
        ).rejects.toThrow('No delegation found');
      });

      expect(mockDecodeDelegations).toHaveBeenCalledWith(mockPermissionContext);
      expect(mockEncodeDisableDelegation).not.toHaveBeenCalled();
      expect(mockAddTransaction).not.toHaveBeenCalled();
    });

    it('should handle navigation when first transaction is pending', async () => {
      mockConfirmations.push({
        id: 'test-transaction-id',
        status: TransactionStatus.unapproved,
      } as unknown as ApprovalRequest<Record<string, Json>>);

      const mockOnRedirect = jest.fn();

      mockAddTransaction
        .mockResolvedValueOnce(mockTransactionMeta)
        .mockResolvedValueOnce(mockTransactionMeta2);

      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
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
        await result.current.revokeGatorPermissionBatch(mockGatorPermissions);
      });

      expect(mockNavigateToId).toHaveBeenCalledWith('test-transaction-id');
      expect(mockOnRedirect).toHaveBeenCalled();
    });

    it('should handle single permission context in batch', async () => {
      mockAddTransaction.mockResolvedValue(mockTransactionMeta);

      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
            chainId: mockChainId,
          }),
        {
          wrapper: ({ children }) => (
            <Provider store={store}>{children}</Provider>
          ),
        },
      );

      await act(async () => {
        const transactionMetas =
          await result.current.revokeGatorPermissionBatch([
            mockGatorPermissions[0],
          ]);

        expect(transactionMetas).toHaveLength(1);
        expect(transactionMetas[0]).toBe(mockTransactionMeta);
      });

      expect(mockDecodeDelegations).toHaveBeenCalledWith(mockPermissionContext);
      expect(mockEncodeDisableDelegation).toHaveBeenCalled();
      expect(mockAddTransaction).toHaveBeenCalled();
    });

    it('should handle transaction failure in batch', async () => {
      mockAddTransaction.mockRejectedValue(
        new Error('Failed to add transaction'),
      );

      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
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
          result.current.revokeGatorPermissionBatch(mockGatorPermissions),
        ).rejects.toThrow('Failed to add transaction');
      });

      expect(mockDecodeDelegations).toHaveBeenCalledWith(mockPermissionContext);
      expect(mockEncodeDisableDelegation).toHaveBeenCalled();
      expect(mockAddTransaction).toHaveBeenCalled();
    });

    it('should handle different delegation manager addresses in batch', async () => {
      mockAddTransaction
        .mockResolvedValueOnce(mockTransactionMeta)
        .mockResolvedValueOnce(mockTransactionMeta2);

      const { result } = renderHook(
        () =>
          useRevokeGatorPermissions({
            chainId: mockChainId,
          }),
        {
          wrapper: ({ children }) => (
            <Provider store={store}>{children}</Provider>
          ),
        },
      );

      await act(async () => {
        const transactionMetas =
          await result.current.revokeGatorPermissionBatch(mockGatorPermissions);

        expect(transactionMetas).toHaveLength(2);
      });

      expect(mockAddTransaction).toHaveBeenCalledTimes(2);
    });
  });
});
