import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { usePerpsLiveAccount } from '../../../../hooks/perps/stream';
import configureStore from '../../../../store/store';
import { usePerpsWithdraw } from '../hooks/usePerpsWithdraw';
import { WithdrawFundsModal } from './withdraw-funds-modal';

jest.mock('../../../../hooks/perps/stream', () => ({
  usePerpsLiveAccount: jest.fn(),
}));

jest.mock('../hooks/usePerpsWithdraw', () => ({
  usePerpsWithdraw: jest.fn(),
}));

const mockUsePerpsLiveAccount = jest.mocked(usePerpsLiveAccount);
const mockUsePerpsWithdraw = jest.mocked(usePerpsWithdraw);
const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('WithdrawFundsModal', () => {
  const triggerMock = jest.fn();
  const onCloseMock = jest.fn();
  const resetErrorMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsLiveAccount.mockReturnValue({
      account: {
        availableBalance: '100',
      },
      isInitialLoading: false,
    } as ReturnType<typeof usePerpsLiveAccount>);

    mockUsePerpsWithdraw.mockReturnValue({
      trigger: triggerMock,
      isLoading: false,
      error: null,
      resetError: resetErrorMock,
    });
  });

  it('renders when open', () => {
    renderWithProvider(
      <WithdrawFundsModal isOpen onClose={onCloseMock} />,
      mockStore,
    );

    expect(
      screen.getByTestId('perps-withdraw-funds-modal'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-withdraw-amount-input'),
    ).toBeInTheDocument();
  });

  it('sets amount using percentage preset', () => {
    renderWithProvider(
      <WithdrawFundsModal isOpen onClose={onCloseMock} />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('perps-withdraw-preset-50'));

    const input = screen.getByPlaceholderText('0.00') as HTMLInputElement;
    expect(input).toHaveValue('50.00');
  });

  it('disables submit for insufficient amount', () => {
    renderWithProvider(
      <WithdrawFundsModal isOpen onClose={onCloseMock} />,
      mockStore,
    );

    const input = screen.getByPlaceholderText('0.00') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '1000' } });

    const submit = screen.getByTestId('perps-withdraw-submit');
    expect(submit).toBeDisabled();
    expect(screen.getByTestId('perps-withdraw-error')).toHaveTextContent(
      'Insufficient funds',
    );
  });

  it('submits amount and closes modal on success', async () => {
    triggerMock.mockResolvedValue({ success: true });

    renderWithProvider(
      <WithdrawFundsModal isOpen onClose={onCloseMock} />,
      mockStore,
    );

    const input = screen.getByPlaceholderText('0.00') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '10' } });

    fireEvent.click(screen.getByTestId('perps-withdraw-submit'));

    await waitFor(() => {
      expect(triggerMock).toHaveBeenCalledWith({ amount: '10' });
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
  });

  it('keeps modal open on failure and shows returned error', async () => {
    mockUsePerpsWithdraw.mockReturnValue({
      trigger: triggerMock.mockResolvedValue({
        success: false,
        error: 'Failed',
      }),
      isLoading: false,
      error: 'Failed',
      resetError: resetErrorMock,
    });

    renderWithProvider(
      <WithdrawFundsModal isOpen onClose={onCloseMock} />,
      mockStore,
    );

    const input = screen.getByPlaceholderText('0.00') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '10' } });

    fireEvent.click(screen.getByTestId('perps-withdraw-submit'));

    await waitFor(() => {
      expect(onCloseMock).not.toHaveBeenCalled();
    });
    expect(screen.getByTestId('perps-withdraw-error')).toHaveTextContent(
      'Failed',
    );
  });
});
