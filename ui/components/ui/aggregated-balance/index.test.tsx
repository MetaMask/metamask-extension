import React from 'react';
import configureMockStore from 'redux-mock-store';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import thunk from 'redux-thunk';
import { SolAccountType, SolMethod, SolScope } from '@metamask/keyring-api';
import { Cryptocurrency } from '@metamask/assets-controllers';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { MultichainNativeAssets } from '../../../../shared/constants/multichain/assets';
import mockState from '../../../../test/data/mock-state.json';
import { SOLANA_WALLET_SNAP_ID } from '../../../../shared/lib/accounts';
import { mockMultichainNetworkState } from '../../../../test/stub/networks';
import { AggregatedBalance } from './aggregated-balance';

const mockDispatch = jest.fn().mockReturnValue(() => jest.fn());
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

const mockNonEvmBalance = '1';

const mockNonEvmAccount = {
  address: 'DtMUkCoeyzs35B6EpQQxPyyog6TRwXxV1W1Acp8nWBNa',
  id: '542490c8-d178-433b-9f31-f680b11f45a5',
  scopes: [SolScope.Mainnet],
  metadata: {
    name: 'Solana Account',
    keyring: {
      type: 'Snap Keyring',
    },
    snap: {
      id: SOLANA_WALLET_SNAP_ID,
      name: 'sol-snap-name',
    },
  },
  options: {},
  methods: [SolMethod.SendAndConfirmTransaction],
  type: SolAccountType.DataAccount,
};

const mockMetamaskStore = {
  ...mockState.metamask,
  ...mockMultichainNetworkState(),
  completedOnboarding: true,
  selectedMultichainNetworkChainId: SolScope.Mainnet,
  isEvmSelected: false,
  internalAccounts: {
    selectedAccount: mockNonEvmAccount.id,
    accounts: {
      [mockNonEvmAccount.id]: mockNonEvmAccount,
    },
  },
  preferences: {
    showNativeTokenAsMainBalance: false,
    tokenNetworkFilter: {},
    privacyMode: false,
  },
  accountsAssets: {
    [mockNonEvmAccount.id]: [MultichainNativeAssets.SOLANA],
  },
  balances: {
    [mockNonEvmAccount.id]: {
      [MultichainNativeAssets.SOLANA]: {
        amount: mockNonEvmBalance,
        unit: 'SOL',
      },
    },
  },
  fiatCurrency: 'usd',
  conversionRates: {
    [MultichainNativeAssets.SOLANA]: {
      rate: '1.000',
      conversionDate: 0,
    },
  },
  cryptocurrencies: [Cryptocurrency.Solana],
  remoteFeatureFlags: {
    addSolanaAccount: true,
    addBitcoinAccount: true,
  },
};

function getStore(state?: Record<string, unknown>) {
  return configureMockStore([thunk])({
    metamask: mockMetamaskStore,
    localeMessages: {
      currentLocale: 'en',
    },
    ...state,
  });
}

describe('AggregatedBalance Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('renders Spinner when balances are missing', () => {
    const testStore = getStore({
      metamask: {
        ...mockMetamaskStore,
        accountsAssets: {
          [mockNonEvmAccount.id]: [],
        },
      },
    });
    const { container } = renderWithProvider(
      <AggregatedBalance
        classPrefix="test"
        balanceIsCached={false}
        handleSensitiveToggle={jest.fn()}
      />,
      testStore,
    );

    const spinner = container.querySelector('.spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('renders fiat balance when showNativeTokenAsMainBalance is false', () => {
    renderWithProvider(
      <AggregatedBalance
        classPrefix="test"
        balanceIsCached={false}
        handleSensitiveToggle={jest.fn()}
      />,
      getStore(),
    );

    expect(screen.getByTestId('account-value-and-suffix')).toHaveTextContent(
      '$1.00',
    );
    expect(screen.getByText('USD')).toBeInTheDocument();
  });

  it('renders 0 fiat balance when showNativeTokenAsMainBalance is false, and balance is 0', () => {
    renderWithProvider(
      <AggregatedBalance
        classPrefix="test"
        balanceIsCached={false}
        handleSensitiveToggle={jest.fn()}
      />,
      getStore({
        metamask: {
          ...mockMetamaskStore,
          balances: {
            [mockNonEvmAccount.id]: {
              [MultichainNativeAssets.SOLANA]: {
                amount: 0,
                unit: 'SOL',
              },
            },
          },
        },
      }),
    );

    expect(screen.getByTestId('account-value-and-suffix')).toHaveTextContent(
      '$0.00',
    );
    expect(screen.getByText('USD')).toBeInTheDocument();
  });

  it('renders token balance when showNativeTokenAsMainBalance is true, up to 5 decimal places with no trailing zero', () => {
    renderWithProvider(
      <AggregatedBalance
        classPrefix="test"
        balanceIsCached={false}
        handleSensitiveToggle={jest.fn()}
      />,
      getStore({
        metamask: {
          ...mockMetamaskStore,
          preferences: {
            showNativeTokenAsMainBalance: true,
          },
        },
      }),
    );

    expect(screen.getByTestId('account-value-and-suffix')).toHaveTextContent(
      '1',
    );
    expect(screen.getByText('SOL')).toBeInTheDocument();
  });

  it('renders 0 native balance when showNativeTokenAsMainBalance is true, and balance is 0', () => {
    renderWithProvider(
      <AggregatedBalance
        classPrefix="test"
        balanceIsCached={false}
        handleSensitiveToggle={jest.fn()}
      />,
      getStore({
        metamask: {
          ...mockMetamaskStore,
          preferences: {
            showNativeTokenAsMainBalance: true,
          },
          balances: {
            [mockNonEvmAccount.id]: {
              [MultichainNativeAssets.SOLANA]: {
                amount: 0,
                unit: 'SOL',
              },
            },
          },
        },
      }),
    );

    expect(screen.getByTestId('account-value-and-suffix')).toHaveTextContent(
      '0',
    );
    expect(screen.getByText('SOL')).toBeInTheDocument();
  });

  it('renders token balance when non evm rates are not available', () => {
    renderWithProvider(
      <AggregatedBalance
        classPrefix="test"
        balanceIsCached={false}
        handleSensitiveToggle={jest.fn()}
      />,
      getStore({
        metamask: {
          ...mockMetamaskStore,
          preferences: {
            showNativeTokenAsMainBalance: false,
          },
          conversionRates: {},
        },
      }),
    );

    expect(screen.getByTestId('account-value-and-suffix')).toHaveTextContent(
      '1',
    );
    expect(screen.getByText('SOL')).toBeInTheDocument();
  });

  it('renders token balance when setting prices is disabled', () => {
    renderWithProvider(
      <AggregatedBalance
        classPrefix="test"
        balanceIsCached={false}
        handleSensitiveToggle={jest.fn()}
      />,
      getStore({
        metamask: {
          ...mockMetamaskStore,
          useCurrencyRateCheck: false,
          preferences: {
            showNativeTokenAsMainBalance: false,
          },
          conversionRates: {
            [MultichainNativeAssets.SOLANA]: {
              rate: '1.000',
              conversionDate: 0,
            },
          },
        },
      }),
    );

    expect(screen.getByTestId('account-value-and-suffix')).toHaveTextContent(
      '1',
    );
    expect(screen.getByText('SOL')).toBeInTheDocument();
  });
});
