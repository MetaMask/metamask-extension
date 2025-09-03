import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import { Caip25CaveatValue } from '@metamask/chain-agnostic-permission';
import { CaipAccountId, CaipChainId, CaipNamespace } from '@metamask/utils';
import { EthAccountType, SolAccountType } from '@metamask/keyring-api';
import { AccountGroupType, AccountWalletType } from '@metamask/account-api';
import mockState from '../../test/data/mock-state.json';
import configureStore from '../store/store';
import { createMockInternalAccount } from '../../test/jest/mocks';
import { useAccountGroupsForPermissions } from './useAccountGroupsForPermissions';

const MOCK_WALLET_ID = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ';
const MOCK_GROUP_ID_1 = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0';
const MOCK_GROUP_ID_2 = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/1';
const MOCK_SOLANA_CHAIN_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

// Test constants
const EMPTY_REQUESTED_ACCOUNT_IDS: CaipAccountId[] = [];

const mockEvmAccount1 = createMockInternalAccount({
  id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
  name: 'EVM Account 1',
  address: '0x1111111111111111111111111111111111111111',
  type: EthAccountType.Eoa,
});

const mockEvmAccount2 = createMockInternalAccount({
  id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
  name: 'EVM Account 2',
  address: '0x2222222222222222222222222222222222222222',
  type: EthAccountType.Eoa,
});

const mockSolAccount1 = createMockInternalAccount({
  id: '784225f4-d30b-4e77-a900-c8bbce735b88',
  name: 'Solana Account 1',
  address: 'So1anaAddr1111111111111111111111111111111111',
  type: SolAccountType.DataAccount,
});

const mockSolAccount2 = createMockInternalAccount({
  id: '9b6b30a0-3c87-4a33-9d10-a27a2aba2ba2',
  name: 'Solana Account 2',
  address: 'So1anaAddr2222222222222222222222222222222222',
  type: SolAccountType.DataAccount,
});

const createEmptyPermission = (): Caip25CaveatValue => ({
  requiredScopes: {},
  optionalScopes: {},
  sessionProperties: {},
  isMultichainOrigin: false,
});

const createPermissionWithEvmAccounts = (
  addresses: string[],
): Caip25CaveatValue => ({
  requiredScopes: {
    'eip155:1': {
      accounts: addresses.map((addr) => `eip155:1:${addr}` as CaipAccountId),
    },
  },
  optionalScopes: {},
  sessionProperties: {},
  isMultichainOrigin: false,
});

const createMockState = (overrides = {}) => ({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    accountTree: {
      selectedAccountGroup: MOCK_GROUP_ID_1,
      wallets: {
        [MOCK_WALLET_ID]: {
          id: MOCK_WALLET_ID,
          type: AccountWalletType.Entropy,
          metadata: {
            name: 'Test Wallet 1',
            entropy: {
              id: '01JKAF3DSGM3AB87EM9N0K41AJ',
            },
          },
          groups: {
            [MOCK_GROUP_ID_1]: {
              id: MOCK_GROUP_ID_1,
              type: AccountGroupType.MultichainAccount,
              metadata: {
                name: 'Test Group 1',
                pinned: false,
                hidden: false,
                entropy: {
                  groupIndex: 0,
                },
              },
              accounts: [mockEvmAccount1.id, mockSolAccount1.id],
            },
            [MOCK_GROUP_ID_2]: {
              id: MOCK_GROUP_ID_2,
              type: AccountGroupType.MultichainAccount,
              metadata: {
                name: 'Test Group 2',
                pinned: false,
                hidden: false,
                entropy: {
                  groupIndex: 1,
                },
              },
              accounts: [mockEvmAccount2.id, mockSolAccount2.id],
            },
          },
        },
      },
    },
    internalAccounts: {
      accounts: {
        [mockEvmAccount1.id]: {
          ...mockEvmAccount1,
          scopes: ['eip155:0'],
        },
        [mockEvmAccount2.id]: {
          ...mockEvmAccount2,
          scopes: ['eip155:0'],
        },
        [mockSolAccount1.id]: {
          ...mockSolAccount1,
          scopes: [MOCK_SOLANA_CHAIN_ID],
        },
        [mockSolAccount2.id]: {
          ...mockSolAccount2,
          scopes: [MOCK_SOLANA_CHAIN_ID],
        },
      },
      selectedAccount: mockEvmAccount1.id,
    },
    ...overrides,
  },
});

const renderHookWithStore = (
  existingPermission: Caip25CaveatValue,
  requestedCaipAccountIds: CaipAccountId[],
  requestedChainIds: CaipChainId[],
  requestedNamespaces: CaipNamespace[],
  stateOverrides = {},
) => {
  const state = createMockState(stateOverrides);
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(Provider, { store: configureStore(state) }, children);

  return renderHook(
    () =>
      useAccountGroupsForPermissions(
        existingPermission,
        requestedCaipAccountIds,
        requestedChainIds,
        requestedNamespaces,
      ),
    { wrapper },
  );
};

describe('useAccountGroupsForPermissions', () => {
  describe('when no existing permissions', () => {
    it('returns empty connected account groups with available supported groups', () => {
      const emptyPermission = createEmptyPermission();
      const requestedChainIds: CaipChainId[] = ['eip155:1' as CaipChainId];
      const requestedNamespaces: CaipNamespace[] = [];

      const { result } = renderHookWithStore(
        emptyPermission,
        EMPTY_REQUESTED_ACCOUNT_IDS,
        requestedChainIds,
        requestedNamespaces,
      );

      expect(result.current.connectedAccountGroups).toEqual([]);
      expect(result.current.supportedAccountGroups).toHaveLength(2);
      expect(result.current.existingConnectedCaipAccountIds).toEqual([]);
    });
  });

  describe('when existing EVM permissions exist', () => {
    it('returns connected account groups for existing EVM accounts', () => {
      const existingPermission = createPermissionWithEvmAccounts([
        mockEvmAccount1.address,
      ]);
      const requestedChainIds: CaipChainId[] = ['eip155:1' as CaipChainId];
      const requestedNamespaces: CaipNamespace[] = [];

      const { result } = renderHookWithStore(
        existingPermission,
        EMPTY_REQUESTED_ACCOUNT_IDS,
        requestedChainIds,
        requestedNamespaces,
      );

      expect(result.current.connectedAccountGroups).toHaveLength(1);
      expect(result.current.connectedAccountGroups[0].id).toBe(MOCK_GROUP_ID_1);
      expect(result.current.supportedAccountGroups).toHaveLength(2);
      expect(result.current.existingConnectedCaipAccountIds).toEqual([
        `eip155:1:${mockEvmAccount1.address}`,
      ]);
    });
  });

  describe('EVM wildcard handling', () => {
    it('converts EVM chain IDs to wildcard format for deduplication', () => {
      const emptyPermission = createEmptyPermission();
      const requestedChainIds: CaipChainId[] = [
        'eip155:1' as CaipChainId,
        'eip155:137' as CaipChainId,
        'eip155:10' as CaipChainId,
      ];
      const requestedNamespaces: CaipNamespace[] = [];

      const { result } = renderHookWithStore(
        emptyPermission,
        [],
        requestedChainIds,
        requestedNamespaces,
      );

      expect(result.current.supportedAccountGroups).toHaveLength(2);
    });
  });

  describe('supportedAccountGroups when no chain IDs provided', () => {
    it('returns empty array when no namespaces are requested', () => {
      const emptyPermission = createEmptyPermission();
      const requestedChainIds: CaipChainId[] = [];
      const requestedNamespaces: CaipNamespace[] = [];

      const { result } = renderHookWithStore(
        emptyPermission,
        EMPTY_REQUESTED_ACCOUNT_IDS,
        requestedChainIds,
        requestedNamespaces,
      );

      expect(result.current.supportedAccountGroups).toEqual([]);
    });

    it('filters account groups by requested namespaces when no chain IDs provided', () => {
      const emptyPermission = createEmptyPermission();
      const requestedChainIds: CaipChainId[] = [];
      const requestedNamespaces: CaipNamespace[] = ['solana' as CaipNamespace];

      const { result } = renderHookWithStore(
        emptyPermission,
        EMPTY_REQUESTED_ACCOUNT_IDS,
        requestedChainIds,
        requestedNamespaces,
      );

      expect(result.current.supportedAccountGroups).toHaveLength(2);
    });

    it('handles multiple matching namespaces', () => {
      const emptyPermission = createEmptyPermission();
      const requestedChainIds: CaipChainId[] = [];
      const requestedNamespaces: CaipNamespace[] = [
        'eip155' as CaipNamespace,
        'solana' as CaipNamespace,
      ];

      const { result } = renderHookWithStore(
        emptyPermission,
        EMPTY_REQUESTED_ACCOUNT_IDS,
        requestedChainIds,
        requestedNamespaces,
      );

      expect(result.current.supportedAccountGroups).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('handles malformed CAIP account IDs', () => {
      const malformedPermission: Caip25CaveatValue = {
        requiredScopes: {
          'eip155:1': {
            accounts: [
              'invalid-caip-account-id' as CaipAccountId,
              `eip155:1:${mockEvmAccount1.address}` as CaipAccountId,
            ],
          },
        },
        optionalScopes: {},
        sessionProperties: {},
        isMultichainOrigin: false,
      };

      const requestedChainIds: CaipChainId[] = ['eip155:1' as CaipChainId];
      const requestedNamespaces: CaipNamespace[] = [];

      const { result } = renderHookWithStore(
        malformedPermission,
        EMPTY_REQUESTED_ACCOUNT_IDS,
        requestedChainIds,
        requestedNamespaces,
      );

      expect(result.current.existingConnectedCaipAccountIds).toEqual([
        'invalid-caip-account-id',
        `eip155:1:${mockEvmAccount1.address}`,
      ]);
    });

    it('handles missing account groups gracefully', () => {
      const stateOverrides = {
        accountTree: {
          selectedAccountGroup: MOCK_GROUP_ID_1,
          wallets: {},
        },
      };

      const existingPermission = createPermissionWithEvmAccounts([
        mockEvmAccount1.address,
      ]);
      const requestedChainIds: CaipChainId[] = ['eip155:1' as CaipChainId];
      const requestedNamespaces: CaipNamespace[] = [];

      const { result } = renderHookWithStore(
        existingPermission,
        EMPTY_REQUESTED_ACCOUNT_IDS,
        requestedChainIds,
        requestedNamespaces,
        stateOverrides,
      );

      expect(result.current.connectedAccountGroups).toEqual([]);
    });
  });

  describe('mixed namespace and chain scenarios', () => {
    it('handles mixed EVM and non-EVM chain requests', () => {
      const emptyPermission = createEmptyPermission();
      const requestedChainIds: CaipChainId[] = [
        'eip155:1' as CaipChainId,
        'eip155:137' as CaipChainId,
        'solana:mainnet' as CaipChainId,
        'bip122:000000000019d6689c085ae165831e93' as CaipChainId,
      ];
      const requestedNamespaces: CaipNamespace[] = [];

      const { result } = renderHookWithStore(
        emptyPermission,
        EMPTY_REQUESTED_ACCOUNT_IDS,
        requestedChainIds,
        requestedNamespaces,
      );

      expect(result.current.supportedAccountGroups).toHaveLength(2);
    });

    it('handles non-EVM existing permissions', () => {
      const solPermission: Caip25CaveatValue = {
        requiredScopes: {
          [MOCK_SOLANA_CHAIN_ID]: {
            accounts: [
              `${MOCK_SOLANA_CHAIN_ID}:${mockSolAccount1.address}` as CaipAccountId,
            ],
          },
        },
        optionalScopes: {},
        sessionProperties: {},
        isMultichainOrigin: false,
      };

      const requestedChainIds: CaipChainId[] = [
        MOCK_SOLANA_CHAIN_ID as CaipChainId,
      ];
      const requestedNamespaces: CaipNamespace[] = [];

      const { result } = renderHookWithStore(
        solPermission,
        EMPTY_REQUESTED_ACCOUNT_IDS,
        requestedChainIds,
        requestedNamespaces,
      );

      expect(result.current.connectedAccountGroups).toHaveLength(1);
      expect(result.current.connectedAccountGroups[0].id).toBe(MOCK_GROUP_ID_1);
      expect(result.current.existingConnectedCaipAccountIds).toEqual([
        `${MOCK_SOLANA_CHAIN_ID}:${mockSolAccount1.address}`,
      ]);
    });
  });

  it('handles empty permission scopes', () => {
    const emptyPermission = createEmptyPermission();
    const requestedChainIds: CaipChainId[] = [];
    const requestedNamespaces: CaipNamespace[] = [];

    const { result } = renderHookWithStore(
      emptyPermission,
      EMPTY_REQUESTED_ACCOUNT_IDS,
      requestedChainIds,
      requestedNamespaces,
    );

    expect(result.current.connectedAccountGroups).toEqual([]);
    expect(result.current.supportedAccountGroups).toEqual([]);
    expect(result.current.existingConnectedCaipAccountIds).toEqual([]);
  });

  it('handles permission with empty account arrays', () => {
    const emptyAccountsPermission: Caip25CaveatValue = {
      requiredScopes: {
        'eip155:1': {
          accounts: [],
        },
      },
      optionalScopes: {},
      sessionProperties: {},
      isMultichainOrigin: false,
    };

    const requestedChainIds: CaipChainId[] = ['eip155:1' as CaipChainId];
    const requestedNamespaces: CaipNamespace[] = [];

    const { result } = renderHookWithStore(
      emptyAccountsPermission,
      EMPTY_REQUESTED_ACCOUNT_IDS,
      requestedChainIds,
      requestedNamespaces,
    );

    expect(result.current.connectedAccountGroups).toEqual([]);
    expect(result.current.existingConnectedCaipAccountIds).toEqual([]);
  });

  it('handles accounts with no scopes when filtering by namespace', () => {
    const stateOverrides = {
      internalAccounts: {
        accounts: {
          [mockEvmAccount1.id]: {
            ...mockEvmAccount1,
            scopes: [],
          },
          [mockEvmAccount2.id]: {
            ...mockEvmAccount2,
            scopes: [],
          },
          [mockSolAccount1.id]: {
            ...mockSolAccount1,
            scopes: [],
          },
          [mockSolAccount2.id]: {
            ...mockSolAccount2,
            scopes: [],
          },
        },
        selectedAccount: mockEvmAccount1.id,
      },
    };

    const emptyPermission = createEmptyPermission();
    const requestedChainIds: CaipChainId[] = [];
    const requestedNamespaces: CaipNamespace[] = ['eip155' as CaipNamespace];

    const { result } = renderHookWithStore(
      emptyPermission,
      EMPTY_REQUESTED_ACCOUNT_IDS,
      requestedChainIds,
      requestedNamespaces,
      stateOverrides,
    );

    expect(result.current.supportedAccountGroups).toEqual([]);
  });

  describe('requestedAccountIds', () => {
    it('prioritizes account groups that fulfill requested account IDs in connected groups', () => {
      const existingPermission = createPermissionWithEvmAccounts([
        mockEvmAccount1.address,
        mockEvmAccount2.address,
      ]);
      const requestedCaipAccountIds: CaipAccountId[] = [
        `eip155:1:${mockEvmAccount2.address}` as CaipAccountId,
      ];
      const requestedChainIds: CaipChainId[] = ['eip155:1' as CaipChainId];
      const requestedNamespaces: CaipNamespace[] = [];

      const { result } = renderHookWithStore(
        existingPermission,
        requestedCaipAccountIds,
        requestedChainIds,
        requestedNamespaces,
      );

      expect(result.current.connectedAccountGroups).toHaveLength(2);
      // Group 2 (containing mockEvmAccount2) should appear first due to priority
      expect(result.current.connectedAccountGroups[0].id).toBe(MOCK_GROUP_ID_2);
      expect(result.current.connectedAccountGroups[1].id).toBe(MOCK_GROUP_ID_1);
    });

    it('prioritizes account groups that fulfill requested account IDs in supported groups', () => {
      const emptyPermission = createEmptyPermission();
      const requestedCaipAccountIds: CaipAccountId[] = [
        `eip155:1:${mockEvmAccount2.address}` as CaipAccountId,
      ];
      const requestedChainIds: CaipChainId[] = ['eip155:1' as CaipChainId];
      const requestedNamespaces: CaipNamespace[] = [];

      const { result } = renderHookWithStore(
        emptyPermission,
        requestedCaipAccountIds,
        requestedChainIds,
        requestedNamespaces,
      );

      expect(result.current.supportedAccountGroups).toHaveLength(2);
      // Group 2 (containing mockEvmAccount2) should appear first due to priority
      expect(result.current.supportedAccountGroups[0].id).toBe(MOCK_GROUP_ID_2);
      expect(result.current.supportedAccountGroups[1].id).toBe(MOCK_GROUP_ID_1);
    });

    it('includes priority groups even when they do not support requested chains/namespaces', () => {
      const emptyPermission = createEmptyPermission();
      const requestedCaipAccountIds: CaipAccountId[] = [
        'eip155:999:0xNonExistentAccount' as CaipAccountId,
      ];
      const requestedChainIds: CaipChainId[] = [];
      const requestedNamespaces: CaipNamespace[] = ['bitcoin' as CaipNamespace]; // Non-existent namespace

      const { result } = renderHookWithStore(
        emptyPermission,
        requestedCaipAccountIds,
        requestedChainIds,
        requestedNamespaces,
      );

      expect(result.current.supportedAccountGroups).toHaveLength(0);
      // No groups should appear since the requested account ID doesn't exist and no groups support bitcoin namespace
    });

    it('handles multiple requested account IDs with different priorities', () => {
      const emptyPermission = createEmptyPermission();
      const requestedCaipAccountIds: CaipAccountId[] = [
        `eip155:1:${mockEvmAccount1.address}` as CaipAccountId,
        `eip155:1:${mockEvmAccount2.address}` as CaipAccountId,
      ];
      const requestedChainIds: CaipChainId[] = ['eip155:1' as CaipChainId];
      const requestedNamespaces: CaipNamespace[] = [];

      const { result } = renderHookWithStore(
        emptyPermission,
        requestedCaipAccountIds,
        requestedChainIds,
        requestedNamespaces,
      );

      expect(result.current.supportedAccountGroups).toHaveLength(2);
      // Both groups should appear, with Group 1 first (mockEvmAccount1) and Group 2 second (mockEvmAccount2)
      expect(result.current.supportedAccountGroups[0].id).toBe(MOCK_GROUP_ID_1);
      expect(result.current.supportedAccountGroups[1].id).toBe(MOCK_GROUP_ID_2);
    });

    it('handles priority with namespace-based requests', () => {
      const emptyPermission = createEmptyPermission();
      const requestedCaipAccountIds: CaipAccountId[] = [
        `${MOCK_SOLANA_CHAIN_ID}:${mockSolAccount1.address}` as CaipAccountId,
      ];
      const requestedChainIds: CaipChainId[] = [];
      const requestedNamespaces: CaipNamespace[] = ['solana' as CaipNamespace];

      const { result } = renderHookWithStore(
        emptyPermission,
        requestedCaipAccountIds,
        requestedChainIds,
        requestedNamespaces,
      );

      expect(result.current.supportedAccountGroups).toHaveLength(2);
      // Group 1 (containing mockSolAccount1) should appear first due to priority
      expect(result.current.supportedAccountGroups[0].id).toBe(MOCK_GROUP_ID_1);
      expect(result.current.supportedAccountGroups[1].id).toBe(MOCK_GROUP_ID_2);
    });

    it('shows second group first when it has higher priority', () => {
      const emptyPermission = createEmptyPermission();
      const requestedCaipAccountIds: CaipAccountId[] = [
        `eip155:0:${mockEvmAccount2.address}` as CaipAccountId, // Group 2 account
      ];
      const requestedChainIds: CaipChainId[] = ['eip155:0' as CaipChainId];
      const requestedNamespaces: CaipNamespace[] = [];

      const { result } = renderHookWithStore(
        emptyPermission,
        requestedCaipAccountIds,
        requestedChainIds,
        requestedNamespaces,
      );

      expect(result.current.supportedAccountGroups).toHaveLength(2);
      // Group 2 should appear first due to priority (contains mockEvmAccount2)
      expect(result.current.supportedAccountGroups[0].id).toBe(MOCK_GROUP_ID_2);
      // Group 1 should appear second (supports the chain but doesn't have priority)
      expect(result.current.supportedAccountGroups[1].id).toBe(MOCK_GROUP_ID_1);
    });
  });
});
