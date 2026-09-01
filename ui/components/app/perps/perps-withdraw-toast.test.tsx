import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { submitRequestToBackground } from '../../../store/background-connection';
import { PerpsWithdrawToast } from './perps-withdraw-toast';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

const mockSubmit = submitRequestToBackground as jest.MockedFunction<
  typeof submitRequestToBackground
>;

describe('PerpsWithdrawToast', () => {
  const baseResult = {
    amount: '50',
    asset: 'USDC',
    txHash: '',
    timestamp: 1_700_000_000_000,
    success: true,
    error: '',
  };

  it('renders success toast when lastWithdrawResult is set', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        lastWithdrawResult: baseResult,
      },
    });

    renderWithProvider(<PerpsWithdrawToast />, store);

    expect(screen.getByTestId('perps-withdraw-toast')).toBeInTheDocument();
    expect(
      screen.getByText(messages.perpsWithdrawToastSuccessTitle.message),
    ).toBeInTheDocument();
  });

  it('calls perpsClearWithdrawResult when dismissed', async () => {
    const user = userEvent.setup();
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        lastWithdrawResult: baseResult,
      },
    });

    renderWithProvider(<PerpsWithdrawToast />, store);

    await user.click(
      screen.getByRole('button', { name: messages.close.message }),
    );

    expect(mockSubmit).toHaveBeenCalledWith('perpsClearWithdrawResult', []);
  });

  it('renders nothing when there is no lastWithdrawResult', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        lastWithdrawResult: null,
      },
    });

    renderWithProvider(<PerpsWithdrawToast />, store);

    expect(
      screen.queryByTestId('perps-withdraw-toast'),
    ).not.toBeInTheDocument();
  });
});
