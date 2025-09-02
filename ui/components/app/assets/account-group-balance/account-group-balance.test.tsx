import React from 'react';
import { AccountGroupBalance } from './account-group-balance';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { selectBalanceBySelectedAccountGroup } from '../../../../selectors/assets';
import { getPreferences } from '../../../../selectors';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import type { AccountGroupBalance as AccountGroupBalanceType } from '@metamask/assets-controllers';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../../test/data/mock-state.json';

const mockStore = configureMockStore()(mockState);

jest.mock('../../../../selectors/assets');
jest.mock('../../../../selectors');
jest.mock('../../../../ducks/locale/locale');
jest.mock('../../../../ducks/metamask/metamask');

describe('AccountGroupBalance', () => {
  const createMockBalance = (): AccountGroupBalanceType => ({
    walletId: 'w1',
    groupId: 'w1/g1',
    totalBalanceInUserCurrency: 123.45,
    userCurrency: 'usd',
  });

  const arrange = (
    selectedGroupBalance: AccountGroupBalanceType | null = null,
  ) => {
    const mockSelectBalanceBySelectedAccountGroup = jest
      .mocked(selectBalanceBySelectedAccountGroup)
      .mockReturnValue(selectedGroupBalance);

    const mockGetPreferences = jest
      .mocked(getPreferences)
      .mockReturnValue({ privacyMode: false });

    const mockGetIntlLocale = jest.mocked(getIntlLocale).mockReturnValue('en');

    const mockGetCurrentCurrency = jest
      .mocked(getCurrentCurrency)
      .mockReturnValue('usd');

    return {
      mockSelectBalanceBySelectedAccountGroup,
      mockGetPreferences,
      mockGetIntlLocale,
      mockGetCurrentCurrency,
    };
  };

  const renderComponent = (props = {}) =>
    renderWithProvider(
      <AccountGroupBalance
        classPrefix="coin"
        balanceIsCached={false}
        handleSensitiveToggle={() => undefined}
        {...props}
      />,
      mockStore,
    );

  const actAssertSpinnerPresent = () => {
    const { container } = renderComponent();
    expect(container.querySelector('.loading-overlay__spinner')).toBeTruthy();
  };

  const actAssertBalanceContent = (props: {
    currency: string;
    amount: string;
  }) => {
    const { getByText } = renderComponent();
    expect(getByText(props.currency)).toBeInTheDocument();
    expect(getByText(props.amount)).toBeInTheDocument();
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders spinner when no selected group balance', () => {
    arrange();
    actAssertSpinnerPresent();
  });

  it('renders formatted balance and currency when data available', () => {
    arrange(createMockBalance());
    actAssertBalanceContent({
      currency: 'USD',
      amount: '$123.45',
    });
  });
});
