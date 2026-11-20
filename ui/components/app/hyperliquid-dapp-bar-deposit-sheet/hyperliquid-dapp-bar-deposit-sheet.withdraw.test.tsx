import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { fireEvent, waitFor } from '@testing-library/react';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  CONFIRM_TRANSACTION_ROUTE,
  PERPS_WITHDRAW_ROUTE,
} from '../../../helpers/constants/routes';
import PerpsWithdrawPage from '../../../pages/perps/perps-withdraw-page';
import PerpsLayout from '../../../pages/perps/perps-layout';
import { createPerpsWithdrawTransaction } from '../perps/hooks/createPerpsWithdrawTransaction';
import { HyperliquidDappBarDepositSheet } from './hyperliquid-dapp-bar-deposit-sheet';

// Jest stubs @metamask/perps-controller globally; supply the constants the
// real Perps withdraw page reads at render time.
jest.mock('@metamask/perps-controller', () => ({
  ...jest.requireActual('@metamask/perps-controller'),
  HYPERLIQUID_ASSET_CONFIGS: {
    usdc: {
      mainnet: 'eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      testnet: 'eip155:421614/erc20:0x1baAbB04529D43a73232B713C0FE471f7c7334d5',
    },
  },
  HYPERLIQUID_WITHDRAWAL_MINUTES: 30,
  WITHDRAWAL_CONSTANTS: {
    DefaultMinAmount: '1.01',
    DefaultFeeAmount: 1,
  },
  PROVIDER_CONFIG: { DefaultProvider: 'hyperliquid' },
}));

jest.mock('../../../hooks/perps/stream', () => ({
  usePerpsLiveAccount: () => ({
    account: {
      totalBalance: '100',
      availableBalance: '80',
      availableToTradeBalance: '80',
      unrealizedPnl: '0',
      subAccountBreakdown: {},
    },
    isInitialLoading: false,
  }),
}));

// Fund is gated on eligibility (Withdraw is not); treat the account as eligible.
jest.mock('../../../hooks/perps', () => ({
  ...jest.requireActual('../../../hooks/perps'),
  usePerpsEligibility: () => ({ isEligible: true }),
}));

jest.mock('../../../selectors/perps/feature-flags', () => ({
  ...jest.requireActual('../../../selectors/perps/feature-flags'),
  getIsPerpsExperienceAvailable: () => true,
}));

jest.mock('../../../store/background-connection', () => ({
  ...jest.requireActual('../../../store/background-connection'),
  submitRequestToBackground: jest.fn().mockResolvedValue([]),
}));

jest.mock('../perps/hooks/createPerpsWithdrawTransaction', () => ({
  createPerpsWithdrawTransaction: jest.fn(),
}));

const mockTriggerDeposit = jest.fn();

jest.mock('../perps/hooks/usePerpsDepositConfirmation', () => ({
  usePerpsDepositConfirmation: () => ({
    trigger: mockTriggerDeposit,
    isLoading: false,
  }),
}));

const mockCreatePerpsWithdrawTransaction = jest.mocked(
  createPerpsWithdrawTransaction,
);

const LocationProbe = () => {
  const { pathname, search } = useLocation();
  return <div data-testid="location">{`${pathname}${search}`}</div>;
};

// Mirrors the app: the sheet lives on the home route, while the withdraw page
// sits under PerpsLayout on its own route.
const Harness = () => (
  <>
    <LocationProbe />
    <Routes>
      <Route element={<PerpsLayout />}>
        <Route path={PERPS_WITHDRAW_ROUTE} element={<PerpsWithdrawPage />} />
      </Route>
      <Route path="*" element={<HyperliquidDappBarDepositSheet />} />
    </Routes>
  </>
);

const buildState = (isConfirmationFlowEnabled: boolean) => ({
  metamask: {
    ...mockState.metamask,
    remoteFeatureFlags: {
      ...mockState.metamask.remoteFeatureFlags,
      /* eslint-disable @typescript-eslint/naming-convention */
      confirmations_pay_post_quote: {
        perpsWithdraw: { enabled: isConfirmationFlowEnabled },
      },
      /* eslint-enable @typescript-eslint/naming-convention */
    },
  },
});

describe('HyperliquidDappBarDepositSheet Withdraw (real hooks, real routes)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreatePerpsWithdrawTransaction.mockResolvedValue({
      transactionId: 'withdraw-tx-id',
    });
  });

  it('opens the Perps withdraw page without throwing, same as Perps home', async () => {
    const store = configureStore(buildState(false));
    const { getByTestId } = renderWithProvider(<Harness />, store);

    expect(getByTestId('location')).toHaveTextContent(/^\/$/u);

    fireEvent.click(getByTestId('perps-balance-actions-withdraw'));

    await waitFor(() =>
      expect(getByTestId('location')).toHaveTextContent(PERPS_WITHDRAW_ROUTE),
    );
    expect(getByTestId('perps-withdraw-header-title')).toBeInTheDocument();
    expect(mockCreatePerpsWithdrawTransaction).not.toHaveBeenCalled();
  });

  it('starts the withdraw confirmation without throwing when the confirmation flow is enabled', async () => {
    const store = configureStore(buildState(true));
    const { getByTestId } = renderWithProvider(<Harness />, store);

    fireEvent.click(getByTestId('perps-balance-actions-withdraw'));

    await waitFor(() =>
      expect(getByTestId('location')).toHaveTextContent(
        `${CONFIRM_TRANSACTION_ROUTE}/withdraw-tx-id?loader=customAmount`,
      ),
    );
    expect(mockCreatePerpsWithdrawTransaction).toHaveBeenCalledTimes(1);
  });

  it('keeps Add funds wired to the deposit trigger', () => {
    const store = configureStore(buildState(false));
    const { getByTestId } = renderWithProvider(<Harness />, store);

    expect(getByTestId('perps-balance-actions-add-funds')).toHaveTextContent(
      'Add funds',
    );
    fireEvent.click(getByTestId('perps-balance-actions-add-funds'));

    expect(mockTriggerDeposit).toHaveBeenCalledTimes(1);
    expect(getByTestId('location')).toHaveTextContent(/^\/$/u);
  });
});
