import React from 'react';
import { act, render, screen } from '@testing-library/react';
import {
  DEFAULT_ROUTE,
  MONEY_HOME_ROUTE,
} from '../../helpers/constants/routes';
import { MoneyDepositInterstitialPage } from './money-deposit-interstitial-page';

const mockNavigate = jest.fn();
const mockUseMoneyAccountAvailability = jest.fn();
const mockInitiateDeposit = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to }: { to: string }) => (
    <div data-testid="navigate" data-to={to} />
  ),
  useNavigate: () => mockNavigate,
}));
jest.mock('../../hooks/money/use-money-account-availability', () => ({
  useMoneyAccountAvailability: () => mockUseMoneyAccountAvailability(),
}));
jest.mock('../../hooks/money/useMoneyAccountDeposit', () => ({
  useMoneyAccountDeposit: () => ({ initiateDeposit: mockInitiateDeposit }),
}));

const AVAILABLE = {
  availability: {
    isAvailable: true,
    address: '0x0000000000000000000000000000000000000001',
  },
  isLoading: false,
};

const renderPage = async () => {
  const result = render(<MoneyDepositInterstitialPage />);
  await act(async () => undefined);
  return result;
};

describe('MoneyDepositInterstitialPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMoneyAccountAvailability.mockReturnValue(AVAILABLE);
    mockInitiateDeposit.mockResolvedValue(true);
  });

  it('starts a deposit that replaces this page and returns to Money home', async () => {
    await renderPage();

    expect(mockInitiateDeposit).toHaveBeenCalledTimes(1);
    expect(mockInitiateDeposit).toHaveBeenCalledWith({
      replaceConfirmation: true,
      goBackTo: MONEY_HOME_ROUTE,
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('starts the deposit only once across re-renders', async () => {
    const { rerender } = await renderPage();

    rerender(<MoneyDepositInterstitialPage />);
    await act(async () => undefined);

    expect(mockInitiateDeposit).toHaveBeenCalledTimes(1);
  });

  it('shows a loader and waits while availability is resolving', async () => {
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: { isAvailable: false },
      isLoading: true,
    });

    const { rerender } = await renderPage();

    expect(mockInitiateDeposit).not.toHaveBeenCalled();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();

    mockUseMoneyAccountAvailability.mockReturnValue(AVAILABLE);
    rerender(<MoneyDepositInterstitialPage />);
    await act(async () => undefined);

    expect(mockInitiateDeposit).toHaveBeenCalledTimes(1);
  });

  it('redirects ineligible users to the wallet home without depositing', async () => {
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: { isAvailable: false },
      isLoading: false,
    });

    await renderPage();

    expect(mockInitiateDeposit).not.toHaveBeenCalled();
    expect(screen.getByTestId('navigate')).toHaveAttribute(
      'data-to',
      DEFAULT_ROUTE,
    );
  });

  it('goes to the wallet home when the deposit could not be started', async () => {
    mockInitiateDeposit.mockResolvedValue(false);

    await renderPage();

    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, { replace: true });
  });
});
