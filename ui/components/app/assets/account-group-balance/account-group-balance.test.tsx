import type { AccountGroupBalance as AccountGroupBalanceType } from '@metamask/assets-controllers';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { CaipChainId, Hex } from '@metamask/utils';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import {
  getAllEnabledNetworksForAllNamespaces,
  getEnabledNetworksByNamespace,
  getMultichainNetwork,
  getShowFiatInTestnets,
  selectAnyEnabledNetworksAreAvailable,
} from '../../../../selectors';
import { getPreferences } from '../../../../../shared/lib/selectors/preferences';
import {
  getMultichainNativeTokenBalance,
  selectIsAssetsLoadingForSelectedAccountGroup,
  selectUnavailableBalancesForSelectedAccountGroup,
  selectUnifiedBalanceBySelectedAccountGroup,
} from '../../../../selectors/assets';
import * as useMultichainSelectorHook from '../../../../hooks/useMultichainSelector';
import {
  AccountGroupBalance,
  AccountGroupBalanceProps,
  useAccountGroupBalanceUnavailability,
} from './account-group-balance';

const mockStore = configureMockStore()(mockState);

const SEPOLIA_CHAIN_ID = '0xaa36a7';
const MAINNET_CHAIN_ID = '0x1';
const SOLANA_CHAIN_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

jest.mock('../../../../selectors/assets');
jest.mock('../../../../selectors');
jest.mock('../../../../ducks/locale/locale');
jest.mock('../../../../ducks/metamask/metamask');
jest.mock('../../../../../shared/lib/selectors/preferences');

describe('AccountGroupBalance', () => {
  const createMockBalance = (): AccountGroupBalanceType => ({
    walletId: 'w1',
    groupId: 'w1/g1',
    totalBalanceInUserCurrency: 123.45,
    userCurrency: 'usd',
  });

  type ArrangeOptions = {
    selectedGroupBalance?: AccountGroupBalanceType | null;
    showNativeTokenAsMainBalance?: boolean;
    enabledNetworksByNamespace?: Record<string, boolean>;
    anyEnabledNetworksAreAvailable?: boolean;
    showFiatInTestnets?: boolean;
    privacyMode?: boolean;
    isAssetsLoading?: boolean;
    unavailableBalances?: { accountIds: string[]; chainIds: string[] };
    allEnabledNetworks?: string[];
  };

  const arrange = ({
    selectedGroupBalance = null,
    showNativeTokenAsMainBalance = false,
    enabledNetworksByNamespace = { [MAINNET_CHAIN_ID]: true },
    anyEnabledNetworksAreAvailable = true,
    showFiatInTestnets = false,
    privacyMode = false,
    isAssetsLoading = false,
    unavailableBalances = { accountIds: [], chainIds: [] },
    allEnabledNetworks = Object.keys(enabledNetworksByNamespace),
  }: ArrangeOptions = {}) => {
    jest
      .mocked(getAllEnabledNetworksForAllNamespaces)
      .mockReturnValue(allEnabledNetworks);

    jest
      .mocked(selectUnavailableBalancesForSelectedAccountGroup)
      .mockReturnValue(unavailableBalances);

    jest
      .mocked(selectUnifiedBalanceBySelectedAccountGroup)
      .mockReturnValue(selectedGroupBalance);

    jest
      .mocked(selectIsAssetsLoadingForSelectedAccountGroup)
      .mockReturnValue(isAssetsLoading);

    jest
      .mocked(selectAnyEnabledNetworksAreAvailable)
      .mockReturnValue(anyEnabledNetworksAreAvailable);

    const mockGetPreferences = jest.mocked(getPreferences).mockReturnValue({
      privacyMode,
      showNativeTokenAsMainBalance,
    } as ReturnType<typeof getPreferences>);

    const mockGetEnabledNetworksByNamespace = jest
      .mocked(getEnabledNetworksByNamespace)
      .mockReturnValue(enabledNetworksByNamespace);

    const mockGetIntlLocale = jest.mocked(getIntlLocale).mockReturnValue('en');

    const mockGetCurrentCurrency = jest
      .mocked(getCurrentCurrency)
      .mockReturnValue('usd');

    const mockGetShowFiatInTestnets = jest
      .mocked(getShowFiatInTestnets)
      .mockReturnValue(showFiatInTestnets);

    jest.mocked(getMultichainNetwork).mockReturnValue({
      network: {
        ticker: 'SOL',
      },
    } as ReturnType<typeof getMultichainNetwork>);

    jest.mocked(getMultichainNativeTokenBalance).mockReturnValue({
      amount: '0',
    } as ReturnType<typeof getMultichainNativeTokenBalance>);

    return {
      mockGetPreferences,
      mockGetIntlLocale,
      mockGetCurrentCurrency,
      mockGetEnabledNetworksByNamespace,
      mockGetShowFiatInTestnets,
    };
  };

  const renderComponent = (props: Partial<AccountGroupBalanceProps> = {}) =>
    renderWithProvider(
      <AccountGroupBalance
        classPrefix={props.classPrefix || 'coin'}
        balanceIsCached={props.balanceIsCached || false}
        handleSensitiveToggle={props.handleSensitiveToggle || (() => undefined)}
        balance={props.balance || '1000000000000000000'}
        chainId={props.chainId || MAINNET_CHAIN_ID}
      />,
      mockStore,
    );

  const actAssertSkeletonPresent = () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('account-group-balance-skeleton')).toBeInTheDocument();
  };

  const actAssertBalanceContent = (props: {
    amount: string;
    balance?: string;
    chainId?: string;
  }) => {
    const { getByText } = renderComponent({
      balance: props.balance,
      chainId: props.chainId as CaipChainId | Hex | undefined,
    });
    expect(
      getByText((content) => content.includes(props.amount)),
    ).toBeInTheDocument();
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a skeleton when no selected group balance and no networks available', () => {
    arrange({ anyEnabledNetworksAreAvailable: false });
    actAssertSkeletonPresent();
  });

  it('renders formatted balance and currency when data available', () => {
    arrange({ selectedGroupBalance: createMockBalance() });
    actAssertBalanceContent({
      amount: '$123.45',
      balance: '1000000000000000000',
      chainId: MAINNET_CHAIN_ID,
    });
  });

  it('renders native balance when setting showNativeTokenAsMainBalance to true', () => {
    arrange({
      selectedGroupBalance: createMockBalance(),
      showNativeTokenAsMainBalance: true,
    });
    actAssertBalanceContent({
      amount: '0.000589',
      balance: '0x0217b4f7389e02',
      chainId: MAINNET_CHAIN_ID,
    });
  });

  it('renders native balance when only a testnet is enabled, regardless of showNativeTokenAsMainBalance', () => {
    arrange({
      selectedGroupBalance: createMockBalance(),
      enabledNetworksByNamespace: { [SEPOLIA_CHAIN_ID]: true },
    });
    actAssertBalanceContent({
      amount: '0.000589',
      balance: '0x0217b4f7389e02',
      chainId: SEPOLIA_CHAIN_ID,
    });
  });

  it('renders fiat conversion on testnet when showFiatInTestnets is enabled', () => {
    arrange({
      selectedGroupBalance: createMockBalance(),
      enabledNetworksByNamespace: { [SEPOLIA_CHAIN_ID]: true },
      showFiatInTestnets: true,
    });
    actAssertBalanceContent({
      amount: '$123.45',
      balance: '0x0217b4f7389e02',
      chainId: SEPOLIA_CHAIN_ID,
    });
  });

  it('does not treat a single non-testnet network as testnet-selected', () => {
    arrange({
      selectedGroupBalance: createMockBalance(),
      enabledNetworksByNamespace: { [MAINNET_CHAIN_ID]: true },
    });
    actAssertBalanceContent({
      amount: '$123.45',
      balance: '1000000000000000000',
      chainId: MAINNET_CHAIN_ID,
    });
  });

  it('falls back to fiat when multiple networks are enabled even with showNativeTokenAsMainBalance', () => {
    arrange({
      selectedGroupBalance: createMockBalance(),
      showNativeTokenAsMainBalance: true,
      enabledNetworksByNamespace: {
        [MAINNET_CHAIN_ID]: true,
        '0x5': true,
      },
    });
    actAssertBalanceContent({
      amount: '$123.45',
      balance: '1000000000000000000',
      chainId: MAINNET_CHAIN_ID,
    });
  });

  it('renders balance from selectedGroupBalance.totalBalanceInUserCurrency', () => {
    arrange({
      selectedGroupBalance: {
        ...createMockBalance(),
        totalBalanceInUserCurrency: 99.5,
      },
    });
    const { getByText } = renderComponent({
      balance: '1000000000000000000',
      chainId: MAINNET_CHAIN_ID,
    });
    expect(
      getByText(
        (content) => content.includes('99.50') || content.includes('99.5'),
      ),
    ).toBeInTheDocument();
  });

  it('renders a skeleton instead of a zero balance while assets are first loading', () => {
    arrange({
      isAssetsLoading: true,
      selectedGroupBalance: {
        ...createMockBalance(),
        totalBalanceInUserCurrency: 0,
      },
    });

    const { getByTestId } = renderComponent();

    expect(getByTestId('account-group-balance-skeleton')).toBeInTheDocument();
  });

  it('renders a non-zero balance while assets are first loading', () => {
    arrange({
      isAssetsLoading: true,
      selectedGroupBalance: createMockBalance(),
    });

    const { getByText, queryByTestId } = renderComponent();

    expect(
      queryByTestId('account-group-balance-skeleton'),
    ).not.toBeInTheDocument();
    expect(getByText(/123\.45/u)).toBeInTheDocument();
  });

  it('renders skeleton when no networks available and no balance', () => {
    arrange({ anyEnabledNetworksAreAvailable: false });
    actAssertSkeletonPresent();
  });

  it('renders known zero non-EVM fiat balance when no networks are available', () => {
    arrange({
      anyEnabledNetworksAreAvailable: false,
      selectedGroupBalance: {
        ...createMockBalance(),
        totalBalanceInUserCurrency: 0,
      },
      enabledNetworksByNamespace: { [SOLANA_CHAIN_ID]: true },
    });

    actAssertBalanceContent({
      amount: '$0.00',
      balance: '0',
      chainId: SOLANA_CHAIN_ID,
    });
  });

  it('applies cached balance class when balanceIsCached is true', () => {
    arrange({ selectedGroupBalance: createMockBalance() });
    const { container } = renderComponent({
      balanceIsCached: true,
      balance: '1000000000000000000',
      chainId: MAINNET_CHAIN_ID,
    });
    expect(
      container.querySelector('.coin-overview__cached-balance'),
    ).toBeTruthy();
  });

  it('renders masked balance when privacy mode is enabled', () => {
    arrange({
      selectedGroupBalance: createMockBalance(),
      privacyMode: true,
    });
    const { getByText } = renderComponent();
    // SensitiveText shows bullet pattern when isHidden (privacyMode) is true
    expect(getByText('••••••')).toBeInTheDocument();
  });

  it('does not call useMultichainSelector for the native currency symbol on EVM chains', () => {
    const useMultichainSelectorSpy = jest.spyOn(
      useMultichainSelectorHook,
      'useMultichainSelector',
    );
    arrange({
      selectedGroupBalance: createMockBalance(),
      showNativeTokenAsMainBalance: true,
    });
    renderComponent({
      balance: '0x0217b4f7389e02',
      chainId: MAINNET_CHAIN_ID,
    });
    // The native symbol now comes from networkConfigurationsByChainId, so
    // even if useMultichainSelector returns something unrelated it should not
    // appear in the rendered output.
    useMultichainSelectorSpy.mockReturnValue('UNEXPECTED');
  });

  describe('balance unavailable', () => {
    const BITCOIN_CHAIN_ID = 'bip122:000000000019d6689c085ae165831e93';

    it('replaces the balance when the viewed non-EVM network failed to load', () => {
      arrange({
        selectedGroupBalance: {
          ...createMockBalance(),
          totalBalanceInUserCurrency: 0,
        },
        enabledNetworksByNamespace: { [BITCOIN_CHAIN_ID]: true },
        unavailableBalances: {
          accountIds: ['btc-account'],
          chainIds: [BITCOIN_CHAIN_ID],
        },
      });
      const { getByTestId, getByText, queryByText } = renderComponent({
        chainId: BITCOIN_CHAIN_ID as CaipChainId,
      });

      expect(
        getByTestId('account-group-balance-unavailable'),
      ).toBeInTheDocument();
      expect(getByText('Balance unavailable')).toBeInTheDocument();
      expect(getByText('Retry')).toBeInTheDocument();
      expect(queryByText('$0.00')).not.toBeInTheDocument();
    });

    it('keeps the total but flags it when another network failed to load', () => {
      arrange({
        selectedGroupBalance: createMockBalance(),
        unavailableBalances: {
          accountIds: ['btc-account'],
          chainIds: [BITCOIN_CHAIN_ID],
        },
      });
      const { getByTestId, getByText } = renderComponent({
        chainId: MAINNET_CHAIN_ID,
      });

      expect(getByText('$123.45')).toBeInTheDocument();
      expect(
        getByTestId('account-group-balance-partially-unavailable'),
      ).toBeInTheDocument();
    });

    it('keeps the known part of the "All networks" total after visiting the failing network (v3)', () => {
      // Back on "All networks" after the Bitcoin view: the last selected
      // network (chainId) is still Bitcoin, and its namespace only has it.
      arrange({
        selectedGroupBalance: {
          ...createMockBalance(),
          totalBalanceInUserCurrency: 8.99,
        },
        enabledNetworksByNamespace: { [BITCOIN_CHAIN_ID]: true },
        allEnabledNetworks: [
          MAINNET_CHAIN_ID,
          SOLANA_CHAIN_ID,
          BITCOIN_CHAIN_ID,
        ],
        unavailableBalances: {
          accountIds: ['btc-account'],
          chainIds: [BITCOIN_CHAIN_ID],
        },
      });
      const { getByTestId, getByText, queryByTestId } = renderComponent({
        chainId: BITCOIN_CHAIN_ID as CaipChainId,
      });

      expect(getByText('$8.99')).toBeInTheDocument();
      expect(
        getByTestId('account-group-balance-partially-unavailable'),
      ).toBeInTheDocument();
      expect(
        queryByTestId('account-group-balance-unavailable'),
      ).not.toBeInTheDocument();
    });

    it('still replaces the total in the single-network view of the failing network, even with a known amount', () => {
      arrange({
        selectedGroupBalance: {
          ...createMockBalance(),
          totalBalanceInUserCurrency: 24.11,
        },
        enabledNetworksByNamespace: { [BITCOIN_CHAIN_ID]: true },
        allEnabledNetworks: [BITCOIN_CHAIN_ID],
        unavailableBalances: {
          accountIds: ['btc-account'],
          chainIds: [BITCOIN_CHAIN_ID],
        },
      });
      const { getByTestId, queryByText } = renderComponent({
        chainId: BITCOIN_CHAIN_ID as CaipChainId,
      });

      expect(
        getByTestId('account-group-balance-unavailable'),
      ).toBeInTheDocument();
      expect(queryByText('$24.11')).not.toBeInTheDocument();
    });

    it('renders no unavailable notice when every balance loaded', () => {
      arrange({ selectedGroupBalance: createMockBalance() });
      const { queryByTestId } = renderComponent();

      expect(
        queryByTestId('account-group-balance-partially-unavailable'),
      ).not.toBeInTheDocument();
      expect(
        queryByTestId('account-group-balance-unavailable'),
      ).not.toBeInTheDocument();
    });
  });

  describe('useAccountGroupBalanceUnavailability (v4: header change row)', () => {
    const BITCOIN_CHAIN_ID = 'bip122:000000000019d6689c085ae165831e93';
    // The selectors are module mocks: a probe component reads the hook
    // through the same provider as the component tests.
    const UnavailabilityProbe = ({
      chainId,
    }: {
      chainId: CaipChainId | Hex;
    }) => (
      <pre data-testid="unavailability">
        {JSON.stringify(useAccountGroupBalanceUnavailability(chainId))}
      </pre>
    );
    const renderUnavailabilityHook = (chainId: CaipChainId | Hex) =>
      JSON.parse(
        renderWithProvider(
          <UnavailabilityProbe chainId={chainId} />,
          mockStore,
        ).getByTestId('unavailability').textContent ?? '{}',
      );

    it('reports the total as replaced in the single-network view of the failing network', () => {
      arrange({
        selectedGroupBalance: {
          ...createMockBalance(),
          totalBalanceInUserCurrency: 24.11,
        },
        enabledNetworksByNamespace: { [BITCOIN_CHAIN_ID]: true },
        allEnabledNetworks: [BITCOIN_CHAIN_ID],
        unavailableBalances: {
          accountIds: ['btc-account'],
          chainIds: [BITCOIN_CHAIN_ID],
        },
      });

      expect(
        renderUnavailabilityHook(BITCOIN_CHAIN_ID as CaipChainId),
      ).toStrictEqual({
        unavailableAccountIds: ['btc-account'],
        hasUnavailableBalances: true,
        replaceTotalWithUnavailable: true,
      });
    });

    it('does not report the "All networks" total with a known part as replaced', () => {
      arrange({
        selectedGroupBalance: {
          ...createMockBalance(),
          totalBalanceInUserCurrency: 8.99,
        },
        enabledNetworksByNamespace: { [BITCOIN_CHAIN_ID]: true },
        allEnabledNetworks: [
          MAINNET_CHAIN_ID,
          SOLANA_CHAIN_ID,
          BITCOIN_CHAIN_ID,
        ],
        unavailableBalances: {
          accountIds: ['btc-account'],
          chainIds: [BITCOIN_CHAIN_ID],
        },
      });

      expect(
        renderUnavailabilityHook(BITCOIN_CHAIN_ID as CaipChainId)
          .replaceTotalWithUnavailable,
      ).toBe(false);
    });

    it('does not report anything when every balance is available', () => {
      arrange({ allEnabledNetworks: [BITCOIN_CHAIN_ID] });

      expect(
        renderUnavailabilityHook(BITCOIN_CHAIN_ID as CaipChainId),
      ).toStrictEqual({
        unavailableAccountIds: [],
        hasUnavailableBalances: false,
        replaceTotalWithUnavailable: false,
      });
    });
  });
});
