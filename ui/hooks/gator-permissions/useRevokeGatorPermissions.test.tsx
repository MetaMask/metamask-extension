import React from 'react';
import { Provider } from 'react-redux';
import { renderHook, act } from '@testing-library/react-hooks';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import type { Store } from 'redux';
import { Hex } from '@metamask/utils';
import { TransactionMeta, TransactionType, TransactionStatus } from '@metamask/transaction-controller';
import { addTransactionAndRouteToConfirmationPage } from '../../store/actions';
import { useRevokeGatorPermissions } from './useRevokeGatorPermissions';
import { decodeDelegations } from '@metamask/delegation-core';
import { encodeDisableDelegation } from '../../../shared/lib/delegation/delegation';

// Mock the dependencies
jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
  addTransactionAndRouteToConfirmationPage: jest.fn(),
}));

jest.mock('@metamask/delegation-core', () => ({
  decodeDelegations: jest.fn(),
}));

jest.mock('../../../shared/lib/delegation/delegation', () => ({
  encodeDisableDelegation: jest.fn(),
}));

jest.mock('../../pages/confirmations/hooks/useConfirmationNavigation', () => ({
  useConfirmationNavigation: jest.fn(),
}));

const mockAddTransactionAndRouteToConfirmationPage = addTransactionAndRouteToConfirmationPage as jest.MockedFunction<
  typeof addTransactionAndRouteToConfirmationPage
>;
const mockDecodeDelegations = decodeDelegations as jest.MockedFunction<typeof decodeDelegations>;
const mockEncodeDisableDelegation = encodeDisableDelegation as jest.MockedFunction<typeof encodeDisableDelegation>;

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('useRevokeGatorPermissions', () => {
  let store: Store;
  const mockChainId = '0x1' as Hex;
  const mockPermissionContext = '0x1234567890abcdef' as Hex;
  const mockDelegationManagerAddress = '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3' as Hex;
  const mockSelectedAccountAddress = '0x4f71DA06987BfeDE90aF0b33E1e3e4ffDCEE7a63';
  const mockAccountId = 'mock-account-id';

  // Type the mock delegation to match what decodeDelegations returns
  const mockDelegation = {
    delegator: mockSelectedAccountAddress as Hex,
    delegate: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778' as Hex,
    authority: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' as Hex,
    caveats: [],
    salt: 12345n,
    signature: '0x1234567' as Hex,
  };

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
        internalAccounts: {
          selectedAccount: mockAccountId,
          accounts: {
            [mockAccountId]: {
              id: mockAccountId,
              address: mockSelectedAccountAddress,
              type: 'eoa',
              metadata: {
                name: 'Test Account',
                keyring: {
                  type: 'hd',
                },
              },
            },
          },
        },
        networkConfigurationsByChainId: {
          '0x1': {
            chainId: mockChainId,
            nickname: 'Ethereum Mainnet',
            rpcEndpoints: [
              {
                url: 'https://mainnet.infura.io/v3/test',
                networkClientId: 'mainnet',
                defaultRpcEndpointIndex: 0,
              },
            ],
            defaultRpcEndpointIndex: 0,
          },
        },
      },
    });

    store.dispatch = jest.fn().mockImplementation((action) => {
      if (typeof action === 'function') {
        return action(store.dispatch, store.getState);
      }
      return Promise.resolve();
    });

    jest.clearAllMocks();

    mockDecodeDelegations.mockReturnValue([mockDelegation] as any);
    mockEncodeDisableDelegation.mockReturnValue('0xencodeddata' as Hex);
    mockAddTransactionAndRouteToConfirmationPage.mockResolvedValue(mockTransactionMeta as never);

    const { useConfirmationNavigation } = require('../../pages/confirmations/hooks/useConfirmationNavigation');
    useConfirmationNavigation.mockReturnValue({
      confirmations: [],
      navigateToId: jest.fn(),
    });
  });

  it('should return revokeGatorPermission function', () => {
    const { result } = renderHook(
      () => useRevokeGatorPermissions({ chainId: mockChainId }),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    expect(result.current.revokeGatorPermission).toBeDefined();
    expect(typeof result.current.revokeGatorPermission).toBe('function');
  });

  it('should successfully revoke gator permission', async () => {
    const mockDispatch = jest.fn().mockResolvedValue(mockTransactionMeta);
    store.dispatch = mockDispatch;

    const { result } = renderHook(
      () => useRevokeGatorPermissions({ chainId: mockChainId }),
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

      expect(transactionMeta).toEqual(mockTransactionMeta);
    });

    expect(mockDecodeDelegations).toHaveBeenCalledWith(mockPermissionContext);
    expect(mockEncodeDisableDelegation).toHaveBeenCalledWith({
      delegation: {
        ...mockDelegation,
        salt: mockDelegation.salt.toString() as `0x${string}`,
      },
    });
    expect(mockAddTransactionAndRouteToConfirmationPage).toHaveBeenCalledWith(
      {
        from: mockSelectedAccountAddress,
        to: mockDelegationManagerAddress,
        data: '0xencodeddata',
        value: '0x0',
      },
      {
        networkClientId: 'mainnet',
        type: TransactionType.contractInteraction,
      },
    );
  });

  it('should throw error when no delegation is found', async () => {
    mockDecodeDelegations.mockReturnValue([]);

    const { result } = renderHook(
      () => useRevokeGatorPermissions({ chainId: mockChainId }),
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
    expect(mockAddTransactionAndRouteToConfirmationPage).not.toHaveBeenCalled();
  });

  it('should handle errors from decodeDelegations', async () => {
    const error = new Error('Failed to decode delegations');
    mockDecodeDelegations.mockImplementation(() => {
      throw error;
    });

    const { result } = renderHook(
      () => useRevokeGatorPermissions({ chainId: mockChainId }),
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
      ).rejects.toThrow('Failed to decode delegations');
    });

    expect(mockDecodeDelegations).toHaveBeenCalledWith(mockPermissionContext);
    expect(mockEncodeDisableDelegation).not.toHaveBeenCalled();
    expect(mockAddTransactionAndRouteToConfirmationPage).not.toHaveBeenCalled();
  });

  it('should handle errors from encodeDisableDelegation', async () => {
    const error = new Error('Failed to encode disable delegation');
    mockEncodeDisableDelegation.mockImplementation(() => {
      throw error;
    });

    const { result } = renderHook(
      () => useRevokeGatorPermissions({ chainId: mockChainId }),
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
      ).rejects.toThrow('Failed to encode disable delegation');
    });

    expect(mockDecodeDelegations).toHaveBeenCalledWith(mockPermissionContext);
    expect(mockEncodeDisableDelegation).toHaveBeenCalled();
    expect(mockAddTransactionAndRouteToConfirmationPage).not.toHaveBeenCalled();
  });

  it('should handle errors from addTransactionAndRouteToConfirmationPage', async () => {
    const error = new Error('Failed to add transaction');

    // Mock dispatch to throw the error when addTransactionAndRouteToConfirmationPage is called
    const mockDispatch = jest.fn().mockImplementation((action) => {
      if (typeof action === 'function') {
        // Call the action function which will return a rejected promise
        return action(mockDispatch, store.getState);
      }
      return Promise.reject(error);
    });
    store.dispatch = mockDispatch;

    const { result } = renderHook(
      () => useRevokeGatorPermissions({ chainId: mockChainId }),
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
      ).rejects.toThrow('Failed to add transaction');
    });

    expect(mockDecodeDelegations).toHaveBeenCalledWith(mockPermissionContext);
    expect(mockEncodeDisableDelegation).toHaveBeenCalled();
    expect(mockAddTransactionAndRouteToConfirmationPage).toHaveBeenCalled();
  });

  it('should handle navigation when transaction is pending', async () => {
    const mockNavigateToId = jest.fn();
    const mockConfirmations = [
      { id: 'test-transaction-id', status: 'unapproved' },
    ];

    const { useConfirmationNavigation } = require('../../pages/confirmations/hooks/useConfirmationNavigation');
    useConfirmationNavigation.mockReturnValue({
      confirmations: mockConfirmations,
      navigateToId: mockNavigateToId,
    });

    const mockOnRedirect = jest.fn();

    // Mock dispatch to return the transaction meta
    const mockDispatch = jest.fn().mockResolvedValue(mockTransactionMeta);
    store.dispatch = mockDispatch;

    const { result } = renderHook(
      () => useRevokeGatorPermissions({
        chainId: mockChainId,
        onRedirect: mockOnRedirect
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

    // Wait for the effect to run
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockNavigateToId).toHaveBeenCalledWith('test-transaction-id');
    expect(mockOnRedirect).toHaveBeenCalled();
  });

  it('should not navigate when transaction is not pending', async () => {
    const mockNavigateToId = jest.fn();
    const mockConfirmations: any[] = [];

    const { useConfirmationNavigation } = require('../../pages/confirmations/hooks/useConfirmationNavigation');
    useConfirmationNavigation.mockReturnValue({
      confirmations: mockConfirmations,
      navigateToId: mockNavigateToId,
    });

    const mockOnRedirect = jest.fn();

    // Mock dispatch to return the transaction meta
    const mockDispatch = jest.fn().mockResolvedValue(mockTransactionMeta);
    store.dispatch = mockDispatch;

    const { result } = renderHook(
      () => useRevokeGatorPermissions({
        chainId: mockChainId,
        onRedirect: mockOnRedirect
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

    // Wait for the effect to run
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockNavigateToId).not.toHaveBeenCalled();
    expect(mockOnRedirect).not.toHaveBeenCalled();
  });

  it('should handle missing defaultRpcEndpoint', async () => {
    const storeWithoutRpc = mockStore({
      metamask: {
        internalAccounts: {
          selectedAccount: mockAccountId,
          accounts: {
            [mockAccountId]: {
              id: mockAccountId,
              address: mockSelectedAccountAddress,
              type: 'eoa',
              metadata: {
                name: 'Test Account',
                keyring: {
                  type: 'hd',
                },
              },
            },
          },
        },
        networkConfigurationsByChainId: {},
      },
    });

    const mockDispatch = jest.fn().mockResolvedValue(mockTransactionMeta);
    storeWithoutRpc.dispatch = mockDispatch;

    const { result } = renderHook(
      () => useRevokeGatorPermissions({ chainId: mockChainId }),
      {
        wrapper: ({ children }) => (
          <Provider store={storeWithoutRpc}>{children}</Provider>
        ),
      },
    );

    await act(async () => {
      const transactionMeta = await result.current.revokeGatorPermission(
        mockPermissionContext,
        mockDelegationManagerAddress,
      );

      expect(transactionMeta).toEqual(mockTransactionMeta);
    });

    expect(mockAddTransactionAndRouteToConfirmationPage).toHaveBeenCalledWith(
      {
        from: mockSelectedAccountAddress,
        to: mockDelegationManagerAddress,
        data: '0xencodeddata',
        value: '0x0',
      },
      {
        networkClientId: undefined,
        type: TransactionType.contractInteraction,
      },
    );
  });

  it('should handle different chain IDs', async () => {
    const differentChainId = '0x5' as Hex; // Goerli
    const storeWithDifferentChain = mockStore({
      metamask: {
        internalAccounts: {
          selectedAccount: mockAccountId,
          accounts: {
            [mockAccountId]: {
              id: mockAccountId,
              address: mockSelectedAccountAddress,
              type: 'eoa',
              metadata: {
                name: 'Test Account',
                keyring: {
                  type: 'hd',
                },
              },
            },
          },
        },
        networkConfigurationsByChainId: {
          '0x5': {
            chainId: differentChainId,
            nickname: 'Goerli Testnet',
            rpcEndpoints: [
              {
                url: 'https://goerli.infura.io/v3/test',
                networkClientId: 'goerli',
                defaultRpcEndpointIndex: 0,
              },
            ],
            defaultRpcEndpointIndex: 0,
          },
        },
      },
    });

    // Mock dispatch to return the transaction meta
    const mockDispatch = jest.fn().mockResolvedValue(mockTransactionMeta);
    storeWithDifferentChain.dispatch = mockDispatch;

    const { result } = renderHook(
      () => useRevokeGatorPermissions({ chainId: differentChainId }),
      {
        wrapper: ({ children }) => (
          <Provider store={storeWithDifferentChain}>{children}</Provider>
        ),
      },
    );

    await act(async () => {
      const transactionMeta = await result.current.revokeGatorPermission(
        mockPermissionContext,
        mockDelegationManagerAddress,
      );

      expect(transactionMeta).toEqual(mockTransactionMeta);
    });

    expect(mockAddTransactionAndRouteToConfirmationPage).toHaveBeenCalledWith(
      {
        from: mockSelectedAccountAddress,
        to: mockDelegationManagerAddress,
        data: '0xencodeddata',
        value: '0x0',
      },
      {
        networkClientId: 'goerli',
        type: TransactionType.contractInteraction,
      },
    );
  });


  it('should handle multiple delegations but use only the first one', async () => {
    const multipleDelegations = [
      mockDelegation,
      {
        delegator: '0xDifferentAddress' as Hex,
        delegate: '0xDifferentDelegate' as Hex,
        authority: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' as Hex,
        caveats: [],
        salt: 54321n,
        signature: '0x123' as Hex,
      },
    ];

    mockDecodeDelegations.mockReturnValue(multipleDelegations as any);

    const { result } = renderHook(
      () => useRevokeGatorPermissions({ chainId: mockChainId }),
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

    expect(mockEncodeDisableDelegation).toHaveBeenCalledWith({
      delegation: {
        ...mockDelegation,
        salt: mockDelegation.salt.toString() as `0x${string}`,
      },
    });
  });

  it('should handle undefined onRedirect callback', async () => {
    const mockNavigateToId = jest.fn();
    const mockConfirmations = [
      { id: 'test-transaction-id', status: 'unapproved' },
    ];

    const { useConfirmationNavigation } = require('../../pages/confirmations/hooks/useConfirmationNavigation');
    useConfirmationNavigation.mockReturnValue({
      confirmations: mockConfirmations,
      navigateToId: mockNavigateToId,
    });

    // Mock dispatch to return the transaction meta
    const mockDispatch = jest.fn().mockResolvedValue(mockTransactionMeta);
    store.dispatch = mockDispatch;

    const { result } = renderHook(
      () => useRevokeGatorPermissions({ chainId: mockChainId }),
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

    // Wait for the effect to run
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockNavigateToId).toHaveBeenCalledWith('test-transaction-id');
    // Should not throw error when onRedirect is undefined
  });
});
