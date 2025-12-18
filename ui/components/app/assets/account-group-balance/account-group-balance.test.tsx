import type { AccountGroupBalance as AccountGroupBalanceType } from '@metamask/assets-controllers';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { CaipChainId, Hex } from '@metamask/utils';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import {
  getPreferences,
  getEnabledNetworksByNamespace,
} from '../../../../selectors';
import { selectBalanceBySelectedAccountGroup } from '../../../../selectors/assets';
import * as useMultichainSelectorHook from '../../../../hooks/useMultichainSelector';
import * as multichainSelectors from '../../../../selectors/multichain';
import {
  AccountGroupBalance,
  AccountGroupBalanceProps,
} from './account-group-balance';

const mockStore = configureMockStore()(mockState);

jest.mock('../../../../selectors/assets');
jest.mock('../../../../selectors');
jest.mock('../../../../ducks/locale/locale');
jest.mock('../../../../ducks/metamask/metamask');
jest.mock('../../../../selectors/multichain', () => ({
  ...jest.requireActual('../../../../selectors/multichain'),
  getMultichainIsTestnet: jest.fn(),
}));

describe('AccountGroupBalance', () => {
  const createMockBalance = (): AccountGroupBalanceType => ({
    walletId: 'w1',
    groupId: 'w1/g1',
    totalBalanceInUserCurrency: 123.45,
    userCurrency: 'usd',
  });

  const arrange = (
    selectedGroupBalance: AccountGroupBalanceType | null = null,
    showNativeTokenAsMainBalance: boolean = false,
    isTestnet: boolean = false,
  ) => {
    const mockSelectBalanceBySelectedAccountGroup = jest
      .mocked(selectBalanceBySelectedAccountGroup)
      .mockReturnValue(selectedGroupBalance);

    const mockGetPreferences = jest
      .mocked(getPreferences)
      .mockReturnValue({ privacyMode: false, showNativeTokenAsMainBalance });

    const mockGetEnabledNetworksByNamespace = jest
      .mocked(getEnabledNetworksByNamespace)
      .mockReturnValue({
        '0x1': true,
      });

    const mockGetIntlLocale = jest.mocked(getIntlLocale).mockReturnValue('en');

    const mockGetCurrentCurrency = jest
      .mocked(getCurrentCurrency)
      .mockReturnValue('usd');

    const mockGetMultichainIsTestnet = jest
      .mocked(multichainSelectors.getMultichainIsTestnet)
      .mockReturnValue(isTestnet);

    return {
      mockSelectBalanceBySelectedAccountGroup,
      mockGetPreferences,
      mockGetIntlLocale,
      mockGetCurrentCurrency,
      mockGetEnabledNetworksByNamespace,
      mockGetMultichainIsTestnet,
    };
  };

  const renderComponent = (
    props: Partial<AccountGroupBalanceProps> = {
      classPrefix: 'coin',
      balanceIsCached: false,
      handleSensitiveToggle: () => undefined,
      balance: '1000000000000000000',
      chainId: '0x1',
    },
  ) =>
    renderWithProvider(
      <AccountGroupBalance
        classPrefix={props.classPrefix || 'coin'}
        balanceIsCached={props.balanceIsCached || false}
        handleSensitiveToggle={props.handleSensitiveToggle || (() => undefined)}
        balance={props.balance || '1000000000000000000'}
        chainId={props.chainId || '0x1'}
      />,
      mockStore,
    );

  const actAssertSkeletonPresent = () => {
    const { container } = renderComponent();
    expect(container.querySelector('.mm-skeleton')).toBeTruthy();
  };

  const actAssertBalanceContent = (props: {
    currency: string;
    amount: string;
    balance: string;
    chainId: string;
  }) => {
    const { getByText } = renderComponent({
      balance: props.balance,
      chainId: props.chainId as CaipChainId | Hex,
    });
    expect(
      getByText((content) => content.includes(props.amount)),
    ).toBeInTheDocument();
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a skeleton when no selected group balance', () => {
    arrange();
    actAssertSkeletonPresent();
  });

  it('renders formatted balance and currency when data available', () => {
    arrange(createMockBalance());
    actAssertBalanceContent({
      currency: 'USD',
      amount: '$123.45',
      balance: '1000000000000000000',
      chainId: '0x1',
    });
  });

  it('renders native balance when setting showNativeTokenAsMainBalance to true', () => {
    jest
      .spyOn(useMultichainSelectorHook, 'useMultichainSelector')
      .mockReturnValue('ETH');
    arrange(createMockBalance(), true);
    actAssertBalanceContent({
      currency: 'ETH',
      amount: '0.000589',
      balance: '0x0217b4f7389e02',
      chainId: '0x1',
    });
  });

  it('renders native balance when on testnet regardless of showNativeTokenAsMainBalance setting', () => {
    jest
      .spyOn(useMultichainSelectorHook, 'useMultichainSelector')
      .mockReturnValue('SepoliaETH');
    arrange(createMockBalance(), false, true);
    actAssertBalanceContent({
      currency: 'SepoliaETH',
      amount: '0.000589',
      balance: '0x0217b4f7389e02',
      chainId: '0xaa36a7',
    });
  });
});
