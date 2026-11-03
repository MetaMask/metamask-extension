import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { ToastMaster } from './toast-master';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../basic-functionality-migration-toast', () => ({
  BasicFunctionalityMigrationToast: () => (
    <div data-testid="mock-bft-migration-toast">
      BasicFunctionalityMigrationToast
    </div>
  ),
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

    it('renders the Basic Functionality migration toast outside home', () => {
      renderWithProvider(
        <ToastMaster />,
        createStore(),
        '/confirm-transaction',
      );
      expect(
        screen.getByTestId('mock-bft-migration-toast'),
      ).toBeInTheDocument();
    });
  });
});

const ARC_ACCOUNT_ID = 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3';
const ARC_NATIVE_ASSET_ID = 'eip155:5042/slip44:5042';

function createArcStore() {
  return configureStore({
    metamask: {
      ...mockState.metamask,
      isUnlocked: true,
      arcUsageNoticeShown: false,
      assetsBalance: {
        ...mockState.metamask.assetsBalance,
        [ARC_ACCOUNT_ID]: {
          ...mockState.metamask.assetsBalance[ARC_ACCOUNT_ID],
          [ARC_NATIVE_ASSET_ID]: { amount: '1' },
        },
      },
      assetsInfo: {
        ...mockState.metamask.assetsInfo,
        [ARC_NATIVE_ASSET_ID]: {
          type: 'native',
          decimals: 18,
          symbol: 'USDC',
        },
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
