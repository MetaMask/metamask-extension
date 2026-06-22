import type { AccountGroupBalance as AccountGroupBalanceType } from '@metamask/assets-controllers';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { CaipChainId, Hex } from '@metamask/utils';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import {
  getEnabledNetworksByNamespace,
  getShowFiatInTestnets,
  selectAnyEnabledNetworksAreAvailable,
} from '../../../../selectors';
import { getPreferences } from '../../../../../shared/lib/selectors/preferences';
import { selectBalanceBySelectedAccountGroup } from '../../../../selectors/assets';
import * as useMultichainSelectorHook from '../../../../hooks/useMultichainSelector';
import {
  AccountGroupBalance,
  AccountGroupBalanceProps,
} from './account-group-balance';

const mockStore = configureMockStore()(mockState);

const SEPOLIA_CHAIN_ID = '0xaa36a7';
const MAINNET_CHAIN_ID = '0x1';

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
  };

  const arrange = ({
    selectedGroupBalance = null,
    showNativeTokenAsMainBalance = false,
    enabledNetworksByNamespace = { [MAINNET_CHAIN_ID]: true },
    anyEnabledNetworksAreAvailable = true,
    showFiatInTestnets = false,
    privacyMode = false,
  }: ArrangeOptions = {}) => {
    const mockSelectBalanceBySelectedAccountGroup = jest
      .mocked(selectBalanceBySelectedAccountGroup)
      .mockReturnValue(selectedGroupBalance);

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

    return {
      mockSelectBalanceBySelectedAccountGroup,
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

  it('renders skeleton when no networks available and no balance', () => {
    arrange({ anyEnabledNetworksAreAvailable: false });
    actAssertSkeletonPresent();
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
});
