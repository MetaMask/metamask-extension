import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { TextColor } from '../../../../helpers/constants/design-system';
import { AccountGroupBalanceChange } from './account-group-balance-change';
import { useAccountGroupBalanceDisplay } from './useAccountGroupBalanceDisplay';

const mockStore = configureMockStore()(mockState);

jest.mock('./useAccountGroupBalanceDisplay');

describe('AccountGroupBalanceChange', () => {
  const createBalanceDisplayData = () => ({
    privacyMode: false,
    color: TextColor.successDefault,
    portfolioChange: null,
    amountChange: 200,
    percentChange: 0.1,
  });

  const arrange = () => {
    const mockUseAccountGroupBalanceDisplay = jest
      .mocked(useAccountGroupBalanceDisplay)
      .mockReturnValue(createBalanceDisplayData());

    return {
      mockUseAccountGroupBalanceDisplay,
    };
  };

  const renderComponent = () =>
    renderWithProvider(
      <AccountGroupBalanceChange period="1d" trailingChild={() => null} />,
      mockStore,
    );

  const actAssertTextContent = (props: { value: string; percent: string }) => {
    const { getByTestId } = renderComponent();

    expect(getByTestId('account-group-balance-change-value')).toHaveTextContent(
      props.value,
    );
    expect(
      getByTestId('account-group-balance-change-percentage'),
    ).toHaveTextContent(props.percent);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders amount and percent when privacyMode is off', () => {
    arrange();
    actAssertTextContent({
      value: '+$200.00',
      percent: '(+10.00%)',
    });
  });

  it('renders masked when privacyMode is on', () => {
    const mocks = arrange();
    mocks.mockUseAccountGroupBalanceDisplay.mockReturnValue({
      ...createBalanceDisplayData(),
      privacyMode: true,
    });
    actAssertTextContent({
      value: '••••••••••',
      percent: '••••••••••',
    });
  });
});
