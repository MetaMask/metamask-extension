import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { ToastMaster } from './toast-master';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../perps/perps-withdraw-toast', () => ({
  PerpsWithdrawToast: () => (
    <div data-testid="mock-perps-withdraw-toast">PerpsWithdrawToast</div>
  ),
}));

jest.mock('../../ui/survey-toast/survey-toast', () => ({
  SurveyToast: () => null,
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
    it('renders PerpsWithdrawToast on /perps', () => {
      renderWithProvider(<ToastMaster />, createStore(), '/perps');
      expect(
        screen.getByTestId('mock-perps-withdraw-toast'),
      ).toBeInTheDocument();
    });

    it('renders perps toasts on nested perps routes', () => {
      renderWithProvider(<ToastMaster />, createStore(), '/perps/trade/BTC');
      expect(
        screen.getByTestId('mock-perps-withdraw-toast'),
      ).toBeInTheDocument();
    });
  });

  describe('on non-perps non-home routes', () => {
    it('does not render perps toasts on settings route', () => {
      renderWithProvider(<ToastMaster />, createStore(), '/settings');
      expect(
        screen.queryByTestId('mock-perps-withdraw-toast'),
      ).not.toBeInTheDocument();
    });

    it('does not render perps toasts on an arbitrary route', () => {
      renderWithProvider(<ToastMaster />, createStore(), '/swap');
      expect(
        screen.queryByTestId('mock-perps-withdraw-toast'),
      ).not.toBeInTheDocument();
    });
  });
});

const ARC_ACCOUNT = '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc';

function createArcStore() {
  return configureStore({
    metamask: {
      ...mockState.metamask,
      isUnlocked: true,
      arcUsageNoticeShown: false,
      accountsByChainId: {
        ...mockState.metamask.accountsByChainId,
        [CHAIN_IDS.ARC]: { [ARC_ACCOUNT]: { balance: '0xde0b6b3a7640000' } },
      },
    },
    appState: { ...mockState.appState },
  });
}

describe('on the home route', () => {
  it('renders ArcUsageNoticeToast on / and not on /settings', () => {
    const { unmount } = renderWithProvider(
      <ToastMaster />,
      createArcStore(),
      '/',
    );
    expect(screen.getByTestId('arc-usage-notice-toast')).toBeInTheDocument();
    unmount();

    renderWithProvider(<ToastMaster />, createArcStore(), '/settings');
    expect(
      screen.queryByTestId('arc-usage-notice-toast'),
    ).not.toBeInTheDocument();
  });
});
