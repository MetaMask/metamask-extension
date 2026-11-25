import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { fireEvent, waitFor } from '@testing-library/react';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  PERPS_HOME_PAGE_ROUTE,
  PERPS_WITHDRAW_ROUTE,
} from '../../../helpers/constants/routes';
import { HYPERLIQUID_DEPOSIT_PROMPT } from '../../../../shared/constants/hyperliquid-deposit-prompt';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../shared/constants/perps-events';
import { mockAccountState } from '../perps/mocks';
import HyperliquidConnectionBar from './hyperliquid-connection-bar';

const mockTrack = jest.fn();
const mockTriggerDeposit = jest.fn();
const mockUsePerpsDepositConfirmation = jest.fn((_options?: unknown) => ({
  trigger: mockTriggerDeposit,
  isLoading: false,
}));

jest.mock('../../../hooks/perps', () => ({
  usePerpsEligibility: () => ({ isEligible: true }),
  usePerpsEventTracking: () => ({ track: mockTrack }),
}));

jest.mock('../../../hooks/perps/stream', () => ({
  usePerpsLiveAccount: () => ({
    account: mockAccountState,
    isInitialLoading: false,
  }),
}));

jest.mock('../perps/hooks/usePerpsDepositConfirmation', () => ({
  usePerpsDepositConfirmation: (options?: unknown) =>
    mockUsePerpsDepositConfirmation(options),
}));

const LocationProbe = () => {
  const { pathname } = useLocation();
  return <div data-testid="location">{pathname}</div>;
};

const renderBar = () => {
  const store = configureStore({ metamask: { ...mockState.metamask } });
  return renderWithProvider(
    <>
      <LocationProbe />
      <Routes>
        <Route path="*" element={<HyperliquidConnectionBar />} />
      </Routes>
    </>,
    store,
  );
};

describe('HyperliquidConnectionBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the header and the Perps balance with both actions', () => {
    const { getByTestId } = renderBar();

    expect(getByTestId('hyperliquid-connection-bar-header')).toHaveTextContent(
      'Perps balance',
    );
    expect(
      getByTestId('perps-compact-balance-actions-available'),
    ).toBeInTheDocument();
    expect(getByTestId('perps-balance-actions-withdraw')).toBeInTheDocument();
    expect(getByTestId('perps-balance-actions-add-funds')).toBeInTheDocument();
  });

  describe('Add funds', () => {
    it('starts the deposit with the Hyperliquid entry point and shows Perps home after submit', () => {
      const { getByTestId } = renderBar();

      expect(mockUsePerpsDepositConfirmation).toHaveBeenCalledWith({
        entryPoint: HYPERLIQUID_DEPOSIT_PROMPT,
        goToAfterSubmit: `${PERPS_HOME_PAGE_ROUTE}?source=${PERPS_EVENT_VALUE.SOURCE.HYPERLIQUID_CONNECTION_BAR}`,
      });

      fireEvent.click(getByTestId('perps-balance-actions-add-funds'));

      expect(mockTriggerDeposit).toHaveBeenCalledTimes(1);
    });

    it('reports the click from the Hyperliquid Connection Bar', () => {
      const { getByTestId } = renderBar();

      fireEvent.click(getByTestId('perps-balance-actions-add-funds'));

      expect(mockTrack).toHaveBeenCalledWith(
        MetaMetricsEventName.PerpsUiInteraction,
        expect.objectContaining({
          [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
            PERPS_EVENT_VALUE.BUTTON_LOCATION.HYPERLIQUID_CONNECTION_BAR,
        }),
      );
    });
  });

  describe('Withdraw', () => {
    it('navigates to the Perps withdraw route', async () => {
      const { getByTestId } = renderBar();

      fireEvent.click(getByTestId('perps-balance-actions-withdraw'));

      await waitFor(() =>
        expect(getByTestId('location')).toHaveTextContent(PERPS_WITHDRAW_ROUTE),
      );
    });

    it('reports the click from the Hyperliquid Connection Bar', () => {
      const { getByTestId } = renderBar();

      fireEvent.click(getByTestId('perps-balance-actions-withdraw'));

      expect(mockTrack).toHaveBeenCalledWith(
        MetaMetricsEventName.PerpsUiInteraction,
        expect.objectContaining({
          [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
            PERPS_EVENT_VALUE.BUTTON_LOCATION.HYPERLIQUID_CONNECTION_BAR,
        }),
      );
    });
  });

  describe('collapsing', () => {
    it('is expanded by default', () => {
      const { getByTestId } = renderBar();

      expect(getByTestId('hyperliquid-connection-bar-toggle')).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      expect(getByTestId('hyperliquid-connection-bar-content')).toHaveAttribute(
        'data-expanded',
        'true',
      );
    });

    it('collapses and expands the balance from anywhere on the header row', () => {
      const { getByTestId } = renderBar();
      const toggle = getByTestId('hyperliquid-connection-bar-toggle');
      const content = getByTestId('hyperliquid-connection-bar-content');

      fireEvent.click(getByTestId('hyperliquid-connection-bar-header'));

      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(content).toHaveAttribute('data-expanded', 'false');
      expect(toggle).toHaveAttribute('aria-controls', content.id);

      fireEvent.click(toggle);

      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(content).toHaveAttribute('data-expanded', 'true');
    });
  });
});
