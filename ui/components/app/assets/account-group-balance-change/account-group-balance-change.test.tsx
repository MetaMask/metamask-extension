import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { TextColor } from '../../../../helpers/constants/design-system';
import { getIsMultichainAccountsState2Enabled } from '../../../../selectors';
import { AccountGroupBalanceChange } from './account-group-balance-change';
import { useAccountGroupBalanceDisplay } from './useAccountGroupBalanceDisplay';

const mockStore = configureMockStore()(mockState);

jest.mock('../../../../selectors');
jest.mock('./useAccountGroupBalanceDisplay');

describe('AccountGroupBalanceChange', () => {
  const createBalanceDisplayData = () => ({
    privacyMode: false,
    color: TextColor.successDefault,
    displayAmountChange: '+$200.00',
    displayPercentChange: '(+10.00%)',
  });

  const arrange = () => {
    const mockGetIsMultichainAccountsState2Enabled = jest
      .mocked(getIsMultichainAccountsState2Enabled)
      .mockReturnValue(true);

    const mockUseAccountGroupBalanceDisplay = jest
      .mocked(useAccountGroupBalanceDisplay)
      .mockReturnValue(createBalanceDisplayData());

    return {
      mockGetIsMultichainAccountsState2Enabled,
      mockUseAccountGroupBalanceDisplay,
    };
  };

  const renderComponent = () =>
    renderWithProvider(<AccountGroupBalanceChange period="1d" />, mockStore);

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

  it('returns null when feature flag is disabled', () => {
    const mocks = arrange();
    mocks.mockGetIsMultichainAccountsState2Enabled.mockReturnValue(false);
    const { container } = renderComponent();
    expect(container.firstChild).toBeNull();
  });
});
