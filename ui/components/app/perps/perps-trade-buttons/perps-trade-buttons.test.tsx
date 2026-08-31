import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { PERPS_ORDER_ENTRY_ROUTE } from '../../../../helpers/constants/routes';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import { PerpsTradeButtons } from './perps-trade-buttons';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockUsePerpsEligibility = jest.fn(() => ({ isEligible: true }));
jest.mock('../../../../hooks/perps/usePerpsEligibility', () => ({
  usePerpsEligibility: () => mockUsePerpsEligibility(),
}));

const mockTrack = jest.fn();
jest.mock('../../../../hooks/perps/usePerpsEventTracking', () => ({
  usePerpsEventTracking: () => ({ track: mockTrack }),
}));

// By default the compliance gate is a passthrough (wallet not blocked): it
// runs the wrapped action. Individual tests can override it to simulate a
// block.
const mockComplianceGate = jest.fn(async (action: () => unknown) => action());
jest.mock('../../compliance', () => ({
  useSelectedAccountComplianceGate: () => ({ gate: mockComplianceGate }),
}));

jest.mock('../perps-geo-block-modal', () => ({
  PerpsGeoBlockModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="perps-geo-block-modal" /> : null,
}));

const store = configureStore({ metamask: { ...mockState.metamask } });

const renderButtons = (props: Partial<{ classPrefix: string }> = {}) =>
  renderWithProvider(
    <PerpsTradeButtons marketSymbol="ETH" {...props} />,
    store,
  );

describe('PerpsTradeButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsEligibility.mockReturnValue({ isEligible: true });
  });

  it('renders Long and Short buttons with the default class prefix', () => {
    renderButtons();

    expect(screen.getByTestId('token-overview-long')).toBeInTheDocument();
    expect(screen.getByTestId('token-overview-short')).toBeInTheDocument();
  });

  it('applies a custom class prefix to the test ids', () => {
    renderButtons({ classPrefix: 'coin' });

    expect(screen.getByTestId('coin-overview-long')).toBeInTheDocument();
    expect(screen.getByTestId('coin-overview-short')).toBeInTheDocument();
  });

  it('navigates to order entry with direction=long and tracks the click', async () => {
    renderButtons();

    fireEvent.click(screen.getByTestId('token-overview-long'));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        `${PERPS_ORDER_ENTRY_ROUTE}/ETH?direction=long&mode=new`,
      ),
    );
    expect(mockTrack).toHaveBeenCalledWith(
      MetaMetricsEventName.PerpsUiInteraction,
      expect.objectContaining({
        [PERPS_EVENT_PROPERTY.BUTTON_TYPE]:
          PERPS_EVENT_VALUE.BUTTON_CLICKED.TRADE,
        [PERPS_EVENT_PROPERTY.ASSET]: 'ETH',
        [PERPS_EVENT_PROPERTY.DIRECTION]: 'long',
      }),
    );
  });

  it('navigates to order entry with direction=short', async () => {
    renderButtons();

    fireEvent.click(screen.getByTestId('token-overview-short'));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        `${PERPS_ORDER_ENTRY_ROUTE}/ETH?direction=short&mode=new`,
      ),
    );
  });

  it('shows the geo-block modal instead of navigating when not eligible', async () => {
    mockUsePerpsEligibility.mockReturnValue({ isEligible: false });
    renderButtons();

    fireEvent.click(screen.getByTestId('token-overview-long'));

    await waitFor(() =>
      expect(
        screen.getByTestId('perps-geo-block-modal'),
      ).toBeInTheDocument(),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it('does not navigate when the compliance gate blocks the action', async () => {
    mockComplianceGate.mockResolvedValueOnce(undefined);
    renderButtons();

    fireEvent.click(screen.getByTestId('token-overview-long'));

    await waitFor(() => expect(mockComplianceGate).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
