import React, { PropsWithChildren } from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import configureMockStore from 'redux-mock-store';
import { Provider, useSelector } from 'react-redux';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { REMOTE_MODES } from '../../../../shared/lib/remote-mode';
import * as selectors from '../../../selectors';
import * as networkSelectors from '../../../../shared/modules/selectors/networks';
import { createDelegation } from '../../../../shared/lib/delegation';
import {
  signDelegation,
  storeDelegationEntry,
  awaitDeleteDelegationEntry,
} from '../../../store/controller-actions/delegation-controller';
import { addTransaction } from '../../../store/actions';
import { getRemoteModeConfig } from '../../../selectors/remote-mode';
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
  getDelegationEntry: jest.fn(() =>
    Promise.resolve({ hash: '0xHash', data: 'mockData' }),
  ),
}));

// Mock the selectors module for getRemoteModeConfig
jest.mock('../../../selectors/remote-mode', () => ({
  getRemoteModeConfig: jest.fn(),
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
  // Handle getSelectedNetworkClientId
  if (selector === networkSelectors.getSelectedNetworkClientId) {
    return 'networkClientId';
  }
  // For other selectors, including the one that uses getRemoteModeConfig,
  // execute it with the relevant part of the mock state.
  // The selector for getRemoteModeConfig will internally call our mocked version.
  if (typeof selector === 'function') {
    return selector(mockState.metamask);
  }
  return undefined;
};

// Cast the imported mock (which is getRemoteModeConfig from the mocked module) to jest.Mock
const mockedGetRemoteModeConfig = getRemoteModeConfig as unknown as jest.Mock;

describe('useRemoteMode', () => {
  beforeEach(() => {
    store = configureMockStore()(mockState);
    Wrapper = ({ children }: PropsWithChildren<object>) => {
      return <Provider store={store}>{children}</Provider>;
    };
    jest.clearAllMocks();
    (useSelector as jest.Mock).mockImplementation(mockUseSelector);

    // Default mock for getRemoteModeConfig for most tests
    // Initially, no allowances, meaning no delegations are set up.
    mockedGetRemoteModeConfig.mockReturnValue({
      swapAllowance: null,
      dailyAllowance: null,
    });
  });

  it('returns remoteModeConfig from selector', () => {
    // This test will now use the default mock from beforeEach
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
    expect(mockedGetRemoteModeConfig).toHaveBeenCalled();
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
    // For this test, ensure a delegation exists for SWAP mode
    mockedGetRemoteModeConfig.mockReturnValue({
      swapAllowance: { delegation: { id: 'mockSwapDelegation' } }, // Provide a mock delegation
      dailyAllowance: null,
    });

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
    // Ensure getRemoteModeConfig returns null allowances for this test,
    // which is the default beforeEach setup, but explicit for clarity.
    mockedGetRemoteModeConfig.mockReturnValue({
      swapAllowance: null,
      dailyAllowance: null,
    });

    const { result } = renderHook(
      () => useRemoteMode({ account: mockAccount }),
      {
        wrapper: Wrapper,
      },
    );
    // Wrap the call and assertion in act
    await act(async () => {
      await expect(
        result.current.disableRemoteMode({ mode: REMOTE_MODES.SWAP }),
      ).rejects.toThrow('No delegation entry found');
    });
  });
});
