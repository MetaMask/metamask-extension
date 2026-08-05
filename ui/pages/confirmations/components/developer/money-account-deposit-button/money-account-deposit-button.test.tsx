import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { useMoneyAccountDeposit } from '../../../../../hooks/money/useMoneyAccountDeposit';
import { useMoneyAccountInfo } from '../../../../../hooks/money/useMoneyAccountInfo';
import { MoneyAccountDepositButton } from './money-account-deposit-button';

jest.mock('../../../../../hooks/money/useMoneyAccountDeposit', () => ({
  useMoneyAccountDeposit: jest.fn(),
}));

jest.mock('../../../../../hooks/money/useMoneyAccountInfo', () => ({
  useMoneyAccountInfo: jest.fn(),
}));

const useMoneyAccountDepositMock = jest.mocked(useMoneyAccountDeposit);
const useMoneyAccountInfoMock = jest.mocked(useMoneyAccountInfo);

describe('MoneyAccountDepositButton', () => {
  const initiateDepositMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    initiateDepositMock.mockResolvedValue(undefined);
    useMoneyAccountDepositMock.mockReturnValue({
      initiateDeposit: initiateDepositMock,
      isLoading: false,
    });
    useMoneyAccountInfoMock.mockReturnValue({
      isMoneyAccountFeatureEnabled: true,
      hasMoneyAccount: true,
      primaryMoneyAccount: { address: '0xd5fe' },
    } as unknown as ReturnType<typeof useMoneyAccountInfo>);
  });

  it('initiates the deposit on click', () => {
    render(<MoneyAccountDepositButton />);

    const button = screen.getByRole('button', {
      name: 'Money Account Deposit',
    });
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(initiateDepositMock).toHaveBeenCalledTimes(1);
  });

  it('renders nothing at all when the money account is unavailable', () => {
    useMoneyAccountInfoMock.mockReturnValue({
      isMoneyAccountFeatureEnabled: false,
      hasMoneyAccount: false,
      primaryMoneyAccount: undefined,
    } as unknown as ReturnType<typeof useMoneyAccountInfo>);

    const { container } = render(<MoneyAccountDepositButton />);

    expect(container).toBeEmptyDOMElement();
  });

  it('disables the button while initiating', () => {
    useMoneyAccountDepositMock.mockReturnValue({
      initiateDeposit: initiateDepositMock,
      isLoading: true,
    });

    render(<MoneyAccountDepositButton />);

    expect(
      screen.getByRole('button', { name: 'Money Account Deposit' }),
    ).toBeDisabled();
  });
});
