import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { useMoneyAccountInfo } from '../../../../../hooks/money/useMoneyAccountInfo';
import { useMoneyAccountWithdrawal } from '../../../../../hooks/money/useMoneyAccountWithdrawal';
import { MoneyAccountWithdrawButton } from './money-account-withdraw-button';

const render = () =>
  renderWithProvider(
    <MoneyAccountWithdrawButton />,
    configureMockStore()(mockState),
  );

jest.mock('../../../../../hooks/money/useMoneyAccountWithdrawal', () => ({
  useMoneyAccountWithdrawal: jest.fn(),
}));

jest.mock('../../../../../hooks/money/useMoneyAccountInfo', () => ({
  useMoneyAccountInfo: jest.fn(),
}));

const useMoneyAccountWithdrawalMock = jest.mocked(useMoneyAccountWithdrawal);
const useMoneyAccountInfoMock = jest.mocked(useMoneyAccountInfo);

describe('MoneyAccountWithdrawButton', () => {
  const initiateWithdrawalMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    initiateWithdrawalMock.mockResolvedValue(undefined);
    useMoneyAccountWithdrawalMock.mockReturnValue({
      initiateWithdrawal: initiateWithdrawalMock,
      isLoading: false,
    });
    useMoneyAccountInfoMock.mockReturnValue({
      isMoneyAccountFeatureEnabled: true,
      hasMoneyAccount: true,
      primaryMoneyAccount: { address: '0xd5fe' },
    } as unknown as ReturnType<typeof useMoneyAccountInfo>);
  });

  it('initiates the withdrawal on click', () => {
    render();

    const button = screen.getByRole('button', {
      name: 'Money Account Withdraw',
    });
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(initiateWithdrawalMock).toHaveBeenCalledTimes(1);
  });

  it('renders nothing at all when the money account is unavailable', () => {
    useMoneyAccountInfoMock.mockReturnValue({
      isMoneyAccountFeatureEnabled: false,
      hasMoneyAccount: false,
      primaryMoneyAccount: undefined,
    } as unknown as ReturnType<typeof useMoneyAccountInfo>);

    const { container } = render();

    expect(container).toBeEmptyDOMElement();
  });

  it('disables the button while initiating', () => {
    useMoneyAccountWithdrawalMock.mockReturnValue({
      initiateWithdrawal: initiateWithdrawalMock,
      isLoading: true,
    });

    render();

    expect(
      screen.getByRole('button', { name: 'Money Account Withdraw' }),
    ).toBeDisabled();
  });
});
