import { renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import {
  Caip25CaveatType,
  Caip25CaveatValue,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import { AccountGroupId, AccountGroupType } from '@metamask/account-api';
import { CaipAccountId } from '@metamask/utils';
import { EthAccountType, SolAccountType } from '@metamask/keyring-api';
import mockState from '../../test/data/mock-state.json';
import configureStore from '../store/store';
import { createMockInternalAccount } from '../../test/jest/mocks';
import { useDisconnectAccountGroup } from './useDisconnectAccountGroup';

jest.mock('../store/actions', () => {
  const actualActions = jest.requireActual('../store/actions');
  return {
    ...actualActions,
    setPermittedAccounts: jest.fn().mockImplementation(() => {
      return async function () {
        await Promise.resolve();
      };
    }),
  };
});

const mockSetPermittedAccounts =
  jest.requireMock('../store/actions').setPermittedAccounts;

const walletId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ';
const groupId = `${walletId}/0` as AccountGroupId;
const otherGroupId = `${walletId}/1` as AccountGroupId;

const solanaChainId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const snapPermissionName = 'snap_dialog';

const evmAccount = createMockInternalAccount({
  id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
  name: 'EVM Account 1',
  address: '0x1111111111111111111111111111111111111111',
  type: EthAccountType.Eoa,
});

const solanaAccount = createMockInternalAccount({
  id: '784225f4-d30b-4e77-a900-c8bbce735b88',
  name: 'Solana Account 1',
  address: 'So1anaAddr1111111111111111111111111111111111',
  type: SolAccountType.DataAccount,
});

const otherEvmAccount = createMockInternalAccount({
  id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
  name: 'EVM Account 2',
  address: '0x2222222222222222222222222222222222222222',
  type: EthAccountType.Eoa,
});

const evmAccountId = `eip155:1:${evmAccount.address}` as CaipAccountId;
const solanaAccountId =
  `${solanaChainId}:${solanaAccount.address}` as CaipAccountId;
const otherEvmAccountId =
  `eip155:1:${otherEvmAccount.address}` as CaipAccountId;

const createCaveatValue = (
  evmAccountIds: CaipAccountId[],
  solanaAccountIds: CaipAccountId[] = [],
): Caip25CaveatValue => ({
  requiredScopes: {},
  optionalScopes: {
    'eip155:1': { accounts: evmAccountIds },
    [solanaChainId]: { accounts: solanaAccountIds },
  },
  sessionProperties: {},
  isMultichainOrigin: false,
});

const createSubject = (caveatValue: Caip25CaveatValue) => ({
  permissions: {
    [Caip25EndowmentPermissionName]: {
      caveats: [{ type: Caip25CaveatType, value: caveatValue }],
    },
  },
});

const renderDisconnect = (subjects: Record<string, unknown>) => {
  const store = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      subjects,
      accountTree: {
        wallets: {
          [walletId]: {
            id: walletId,
            type: 'entropy',
            metadata: {
              name: 'Wallet 1',
              entropy: { id: '01JKAF3DSGM3AB87EM9N0K41AJ' },
            },
            groups: {
              [groupId]: {
                id: groupId,
                type: AccountGroupType.MultichainAccount,
                metadata: {
                  name: 'Account 1',
                  pinned: false,
                  hidden: false,
                  entropy: { groupIndex: 0 },
                },
                accounts: [evmAccount.id, solanaAccount.id],
              },
              [otherGroupId]: {
                id: otherGroupId,
                type: AccountGroupType.MultichainAccount,
                metadata: {
                  name: 'Account 2',
                  pinned: false,
                  hidden: false,
                  entropy: { groupIndex: 1 },
                },
                accounts: [otherEvmAccount.id],
              },
            },
          },
        },
      },
      internalAccounts: {
        accounts: {
          [evmAccount.id]: { ...evmAccount, scopes: ['eip155:0'] },
          [solanaAccount.id]: { ...solanaAccount, scopes: [solanaChainId] },
          [otherEvmAccount.id]: { ...otherEvmAccount, scopes: ['eip155:0'] },
        },
        selectedAccount: evmAccount.id,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(Provider, { store, children });

  return renderHook(() => useDisconnectAccountGroup(), { wrapper }).result;
};

describe('useDisconnectAccountGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('revokes every account of the group on every origin it is connected to', async () => {
    const disconnect = renderDisconnect({
      'https://dapp.one': createSubject(
        createCaveatValue([evmAccountId], [solanaAccountId]),
      ),
      'https://dapp.two': createSubject(createCaveatValue([evmAccountId])),
    });

    await disconnect.current(groupId);

    expect(mockSetPermittedAccounts).toHaveBeenCalledTimes(2);
    expect(mockSetPermittedAccounts).toHaveBeenCalledWith(
      'https://dapp.one',
      [],
    );
    expect(mockSetPermittedAccounts).toHaveBeenCalledWith(
      'https://dapp.two',
      [],
    );
  });

  it('leaves the accounts of other groups connected', async () => {
    const disconnect = renderDisconnect({
      'https://dapp.one': createSubject(
        createCaveatValue([evmAccountId, otherEvmAccountId], [solanaAccountId]),
      ),
    });

    await disconnect.current(groupId);

    expect(mockSetPermittedAccounts).toHaveBeenCalledTimes(1);
    expect(mockSetPermittedAccounts).toHaveBeenCalledWith('https://dapp.one', [
      otherEvmAccountId,
    ]);
  });

  it('leaves origins the group is not connected to untouched', async () => {
    const disconnect = renderDisconnect({
      'https://dapp.one': createSubject(createCaveatValue([otherEvmAccountId])),
    });

    await disconnect.current(groupId);

    expect(mockSetPermittedAccounts).not.toHaveBeenCalled();
  });

  it('ignores subjects without account permissions, such as snaps', async () => {
    const disconnect = renderDisconnect({
      'npm:@metamask/test-snap': {
        permissions: { [snapPermissionName]: {} },
      },
    });

    await disconnect.current(groupId);

    expect(mockSetPermittedAccounts).not.toHaveBeenCalled();
  });

  it('does nothing for a group that is no longer in the tree', async () => {
    const disconnect = renderDisconnect({
      'https://dapp.one': createSubject(createCaveatValue([evmAccountId])),
    });

    await disconnect.current(`${walletId}/9` as AccountGroupId);

    expect(mockSetPermittedAccounts).not.toHaveBeenCalled();
  });
});
