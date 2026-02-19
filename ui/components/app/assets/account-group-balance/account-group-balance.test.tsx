import type { AccountGroupBalance as AccountGroupBalanceType } from '@metamask/assets-controllers';
import { getAggregatedBalanceForAccount } from '@metamask/assets-controller';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { CaipChainId, Hex } from '@metamask/utils';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import {
  getPreferences,
  getEnabledNetworks,
  getEnabledNetworksByNamespace,
  getSelectedInternalAccount,
  selectAnyEnabledNetworksAreAvailable,
} from '../../../../selectors';
import { selectBalanceBySelectedAccountGroup } from '../../../../selectors/assets';
import { getIsAssetsUnifyStateEnabled } from '../../../../selectors/assets-unify-state/feature-flags';
import * as useMultichainSelectorHook from '../../../../hooks/useMultichainSelector';
import * as multichainSelectors from '../../../../selectors/multichain';
import {
  AccountGroupBalance,
  AccountGroupBalanceProps,
} from './account-group-balance';

const mockStore = configureMockStore()(mockState);

const MOCK_INTERNAL_ACCOUNT = {
  id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
  address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  type: 'eip155:eoa' as const,
  metadata: {
    name: 'Test Account',
    importTime: 0,
    keyring: { type: 'HD Key Tree' },
  },
  options: {},
  methods: ['personal_sign', 'eth_sign'],
  scopes: ['eip155:0'],
};

jest.mock('@metamask/assets-controller', () => ({
  getAggregatedBalanceForAccount: jest.fn(),
}));

jest.mock('../../../../selectors/assets');
jest.mock('../../../../selectors');
jest.mock('../../../../selectors/assets-unify-state/feature-flags', () => ({
  ...jest.requireActual(
    '../../../../selectors/assets-unify-state/feature-flags',
  ),
  getIsAssetsUnifyStateEnabled: jest.fn(),
}));
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

    jest.mocked(getIsAssetsUnifyStateEnabled).mockReturnValue(false);
    jest
      .mocked(getSelectedInternalAccount)
      .mockReturnValue(
        undefined as unknown as ReturnType<typeof getSelectedInternalAccount>,
      );
    jest
      .mocked(getEnabledNetworks)
      .mockReturnValue(
        undefined as unknown as ReturnType<typeof getEnabledNetworks>,
      );

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

  describe('assets unify state', () => {
    beforeEach(() => {
      jest.mocked(selectAnyEnabledNetworksAreAvailable).mockReturnValue(true);
      jest.mocked(getCurrentCurrency).mockReturnValue('usd');
      jest
        .mocked(getEnabledNetworksByNamespace)
        .mockReturnValue({ '0x1': true });
      jest.mocked(getPreferences).mockReturnValue({
        privacyMode: false,
        showNativeTokenAsMainBalance: false,
      });
    });

    it('displays aggregated fiat total when feature flag is enabled and aggregated balance has totalBalanceInFiat', () => {
      arrange(null);
      jest.mocked(getIsAssetsUnifyStateEnabled).mockReturnValue(true);
      jest
        .mocked(getSelectedInternalAccount)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(MOCK_INTERNAL_ACCOUNT as any);
      jest
        .mocked(getEnabledNetworks)
        .mockReturnValue({ eip155: { '1': true } });
      jest.mocked(getAggregatedBalanceForAccount).mockReturnValue({
        entries: [],
        totalBalanceInFiat: 456.78,
      });

      const { getByText } = renderComponent({
        balance: '1000000000000000000',
        chainId: '0x1',
      });

      expect(
        getByText((content) => content.includes('456.78')),
      ).toBeInTheDocument();
      expect(getAggregatedBalanceForAccount).toHaveBeenCalled();
    });

    it('displays selected group balance when feature flag is disabled', () => {
      jest.mocked(getIsAssetsUnifyStateEnabled).mockReturnValue(false);
      arrange(createMockBalance());

      const { getByText } = renderComponent({
        balance: '1000000000000000000',
        chainId: '0x1',
      });

      expect(
        getByText((content) => content.includes('123.45')),
      ).toBeInTheDocument();
      expect(getAggregatedBalanceForAccount).not.toHaveBeenCalled();
    });

    it('displays selected group balance when feature flag is enabled but aggregated balance has no totalBalanceInFiat', () => {
      arrange(createMockBalance());
      jest.mocked(getIsAssetsUnifyStateEnabled).mockReturnValue(true);
      jest
        .mocked(getSelectedInternalAccount)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(MOCK_INTERNAL_ACCOUNT as any);
      jest
        .mocked(getEnabledNetworks)
        .mockReturnValue({ eip155: { '1': true } });
      jest.mocked(getAggregatedBalanceForAccount).mockReturnValue({
        entries: [],
        totalBalanceInFiat: undefined,
      });

      const { getByText } = renderComponent({
        balance: '1000000000000000000',
        chainId: '0x1',
      });

      expect(
        getByText((content) => content.includes('123.45')),
      ).toBeInTheDocument();
    });

    it('displays selected group balance when feature flag is enabled but selected internal account is null', () => {
      arrange(createMockBalance());
      jest.mocked(getIsAssetsUnifyStateEnabled).mockReturnValue(true);
      jest
        .mocked(getSelectedInternalAccount)
        .mockReturnValue(
          undefined as unknown as ReturnType<typeof getSelectedInternalAccount>,
        );

      const { getByText } = renderComponent({
        balance: '1000000000000000000',
        chainId: '0x1',
      });

      expect(
        getByText((content) => content.includes('123.45')),
      ).toBeInTheDocument();
      expect(getAggregatedBalanceForAccount).not.toHaveBeenCalled();
    });
  });
});
