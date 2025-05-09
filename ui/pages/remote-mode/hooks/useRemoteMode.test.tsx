import React, { PropsWithChildren } from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import configureMockStore from 'redux-mock-store';
import { Provider, useSelector } from 'react-redux';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { REMOTE_MODES } from '../remote.types';
import * as selectors from '../../../selectors';
import * as networkSelectors from '../../../../shared/modules/selectors/networks';
import { createDelegation } from '../../../../shared/lib/delegation';
import {
  signDelegation,
  storeDelegationEntry,
  awaitDeleteDelegationEntry,
  listDelegationEntries,
} from '../../../store/controller-actions/delegation-controller';
import { addTransaction } from '../../../store/actions';
import { useRemoteMode } from './useRemoteMode';

// Minimal mock state for tests
const mockState = {
  metamask: {
    remoteFeatureFlags: { vaultRemoteMode: true },
    delegations: {},
    selectedNetworkClientId: 'networkClientId',
  },
};

jest.mock('../../confirmations/hooks/useEIP7702Account', () => ({
  useEIP7702Account: () => ({ upgradeAccount: jest.fn() }),
}));
jest.mock('../../confirmations/hooks/useEIP7702Networks', () => ({
  useEIP7702Networks: () => ({ network7702List: [] }),
}));
jest.mock('../../confirmations/hooks/useConfirmationNavigation', () => ({
  useConfirmationNavigation: () => ({
    confirmations: [],
    navigateToId: jest.fn(),
  }),
}));
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../../selectors', () => ({
  getSelectedNetwork: jest.fn(() => ({ configuration: { chainId: '0x1' } })),
}));
jest.mock('../../../../shared/lib/delegation', () => ({
  createDelegation: jest.fn(() => ({
    from: '0x1',
    to: '0x2',
    signature: undefined,
  })),
  getDeleGatorEnvironment: jest.fn(() => ({
    EIP7702StatelessDeleGatorImpl: '0xUpgrade',
    DelegationManager: '0xManager',
  })),
}));
jest.mock('../../../../shared/lib/delegation/delegation', () => ({
  encodeDisableDelegation: jest.fn(() => '0xEncoded'),
  getDelegationHashOffchain: jest.fn(() => '0xHash'),
}));
jest.mock('../../../../shared/modules/selectors/networks', () => ({
  getSelectedNetworkClientId: jest.fn(() => 'networkClientId'),
}));
jest.mock('../../../store/actions', () => ({
  addTransaction: jest.fn(() => Promise.resolve({ id: 'tx1' })),
}));
jest.mock('../../../store/controller-actions/delegation-controller', () => ({
  awaitDeleteDelegationEntry: jest.fn(() => Promise.resolve()),
  listDelegationEntries: jest.fn(() =>
    Promise.resolve([{ delegation: { from: '0x1', to: '0x2' } }]),
  ),
  signDelegation: jest.fn(() => Promise.resolve('0xSignature')),
  storeDelegationEntry: jest.fn(),
}));

const mockAccount = '0x1';
const mockSelectedAccount: InternalAccount = {
  address: '0x1',
  type: 'eip155:eoa',
  id: '1',
  options: {},
  metadata: { name: 'Test', importTime: 0, keyring: { type: 'eip155:eoa' } },
  scopes: [],
  methods: [],
};
const mockAuthorizedAccount: InternalAccount = {
  address: '0x2',
  type: 'eip155:eoa',
  id: '2',
  options: {},
  metadata: { name: 'Test2', importTime: 0, keyring: { type: 'eip155:eoa' } },
  scopes: [],
  methods: [],
};

let store: ReturnType<ReturnType<typeof configureMockStore>>;
let Wrapper: ({ children }: PropsWithChildren<object>) => JSX.Element;

const mockUseSelector = (selector: unknown) => {
  // Handle getSelectedNetwork
  if (selector === selectors.getSelectedNetwork) {
    return { configuration: { chainId: '0x1' } };
  }
  // Handle getRemoteModeConfig usage as an inline function
  if (
    typeof selector === 'function' &&
    selector.toString().includes('getRemoteModeConfig')
  ) {
    return { swapAllowance: null, dailyAllowance: null };
  }
  // Handle getSelectedNetworkClientId
  if (selector === networkSelectors.getSelectedNetworkClientId) {
    return 'networkClientId';
  }
  return undefined;
};

describe('useRemoteMode', () => {
  beforeEach(() => {
    store = configureMockStore()(mockState);
    Wrapper = ({ children }: PropsWithChildren<object>) => {
      return <Provider store={store}>{children}</Provider>;
    };
    jest.clearAllMocks();
    (useSelector as jest.Mock).mockImplementation(mockUseSelector);
  });

  it('returns remoteModeConfig from selector', () => {
    const { result } = renderHook(
      () => useRemoteMode({ account: mockAccount }),
      {
        wrapper: Wrapper,
      },
    );
    expect(result.current.remoteModeConfig).toEqual({
      swapAllowance: null,
      dailyAllowance: null,
    });
  });

  it('enableRemoteMode calls upgradeAccount, creates, signs, and stores delegation', async () => {
    const { result } = renderHook(
      () => useRemoteMode({ account: mockAccount }),
      {
        wrapper: Wrapper,
      },
    );
    const { enableRemoteMode } = result.current;

    await act(async () => {
      await enableRemoteMode({
        selectedAccount: mockSelectedAccount,
        authorizedAccount: mockAuthorizedAccount,
        mode: REMOTE_MODES.SWAP,
        meta: 'test',
      });
    });
    expect(createDelegation).toHaveBeenCalled();
    expect(signDelegation).toHaveBeenCalled();
    expect(storeDelegationEntry).toHaveBeenCalledWith({
      delegation: expect.objectContaining({
        from: '0x1',
        to: '0x2',
        signature: '0xSignature',
      }),
      tags: [REMOTE_MODES.SWAP],
      chainId: '0x1',
      meta: 'test',
    });
  });

  it('disableRemoteMode calls addTransaction and awaitDeleteDelegationEntry', async () => {
    const { result } = renderHook(
      () => useRemoteMode({ account: mockAccount }),
      {
        wrapper: Wrapper,
      },
    );
    const { disableRemoteMode } = result.current;

    await act(async () => {
      await disableRemoteMode({ mode: REMOTE_MODES.SWAP });
    });
    expect(addTransaction).toHaveBeenCalled();
    expect(awaitDeleteDelegationEntry).toHaveBeenCalled();
  });

  it('disableRemoteMode throws if no delegation entry found', async () => {
    (listDelegationEntries as jest.Mock).mockResolvedValueOnce([]);
    const { result } = renderHook(
      () => useRemoteMode({ account: mockAccount }),
      {
        wrapper: Wrapper,
      },
    );
    await expect(
      result.current.disableRemoteMode({ mode: REMOTE_MODES.SWAP }),
    ).rejects.toThrow('No delegation entry found');
  });
});
