import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { ToastMaster } from './toast-master';

jest.mock('../perps/perps-deposit-toast', () => ({
  PerpsDepositToast: () => (
    <div data-testid="mock-perps-deposit-toast">PerpsDepositToast</div>
  ),
}));

jest.mock('../perps/perps-withdraw-toast', () => ({
  PerpsWithdrawToast: () => (
    <div data-testid="mock-perps-withdraw-toast">PerpsWithdrawToast</div>
  ),
}));

jest.mock('../../ui/survey-toast', () => ({
  SurveyToast: () => null,
}));

jest.mock('../musd', () => ({
  MerklClaimToast: () => null,
  MusdConversionToast: () => null,
}));

function createStore() {
  return configureStore({
    metamask: {
      ...mockState.metamask,
      isUnlocked: true,
    },
    appState: {
      ...mockState.appState,
    },
  });
}

describe('ToastMaster routing', () => {
  describe('on perps routes', () => {
    it('renders PerpsDepositToast on /perps', () => {
      renderWithProvider(<ToastMaster />, createStore(), '/perps');
      expect(
        screen.getByTestId('mock-perps-deposit-toast'),
      ).toBeInTheDocument();
    });

    it('renders PerpsWithdrawToast on /perps', () => {
      renderWithProvider(<ToastMaster />, createStore(), '/perps');
      expect(
        screen.getByTestId('mock-perps-withdraw-toast'),
      ).toBeInTheDocument();
    });

    it('renders perps toasts on nested perps routes', () => {
      renderWithProvider(<ToastMaster />, createStore(), '/perps/trade/BTC');
      expect(
        screen.getByTestId('mock-perps-deposit-toast'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('mock-perps-withdraw-toast'),
      ).toBeInTheDocument();
    });
  });

  describe('on non-perps non-home routes', () => {
    it('does not render perps toasts on settings route', () => {
      renderWithProvider(<ToastMaster />, createStore(), '/settings');
      expect(
        screen.queryByTestId('mock-perps-deposit-toast'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('mock-perps-withdraw-toast'),
      ).not.toBeInTheDocument();
    });

    it('does not render perps toasts on an arbitrary route', () => {
      renderWithProvider(<ToastMaster />, createStore(), '/swap');
      expect(
        screen.queryByTestId('mock-perps-deposit-toast'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('mock-perps-withdraw-toast'),
      ).not.toBeInTheDocument();
    });
  });
});
