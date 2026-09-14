import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import type { Position } from '@metamask/perps-controller';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { PERPS_ORDER_ENTRY_ROUTE } from '../../../../helpers/constants/routes';
import { PERPS_EVENT_VALUE } from '../../../../../shared/constants/perps-events';
import { captureException } from '../../../../../shared/lib/sentry';
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

const mockUsePerpsPositionForAsset = jest.fn(
  (_marketSymbol: string): { position?: Position; isLoading: boolean } => ({
    position: undefined,
    isLoading: false,
  }),
);
jest.mock('../../../../hooks/perps/usePerpsPositionForAsset', () => ({
  usePerpsPositionForAsset: (marketSymbol: string) =>
    mockUsePerpsPositionForAsset(marketSymbol),
}));

const mockPosition = (size: string, leverageType = 'isolated') =>
  ({
    symbol: 'ETH',
    size,
    leverage: { type: leverageType, value: 5 },
  }) as Position;

// By default the compliance gate is a passthrough (wallet not blocked): it
// runs the wrapped action. Individual tests can override it to simulate a
// block.
const mockComplianceGate = jest.fn(async (action: () => unknown) => action());
jest.mock('../../compliance', () => ({
  // Passthrough so the real AccessRestrictedProvider wrap in PerpsTradeButtons
  // still mounts children under the mocked compliance gate.
  AccessRestrictedProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useSelectedAccountComplianceGate: () => ({ gate: mockComplianceGate }),
}));

jest.mock('../../../../../shared/lib/sentry', () => ({
  ...jest.requireActual('../../../../../shared/lib/sentry'),
  captureException: jest.fn(),
}));

const mockGeoBlockModal = jest.fn(
  ({ isOpen }: { isOpen: boolean; source?: string }) =>
    isOpen ? <div data-testid="perps-geo-block-modal" /> : null,
);
jest.mock('../perps-geo-block-modal', () => ({
  PerpsGeoBlockModal: (props: { isOpen: boolean; source?: string }) =>
    mockGeoBlockModal(props),
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
    mockUsePerpsPositionForAsset.mockReturnValue({
      position: undefined,
      isLoading: false,
    });
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

  it('navigates to order entry with direction=long without a click event', async () => {
    renderButtons();

    fireEvent.click(screen.getByTestId('token-overview-long'));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        `${PERPS_ORDER_ENTRY_ROUTE}/ETH?direction=long&mode=new`,
      ),
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

  describe('when the account already holds a position on the market', () => {
    it('opens order entry in modify mode for the side of an open long', async () => {
      mockUsePerpsPositionForAsset.mockReturnValue({
        position: mockPosition('1.5'),
        isLoading: false,
      });
      renderButtons();

      fireEvent.click(screen.getByTestId('token-overview-long'));

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith(
          `${PERPS_ORDER_ENTRY_ROUTE}/ETH?direction=long&mode=modify`,
        ),
      );
    });

    it('opens order entry in modify mode for the side of an open short', async () => {
      mockUsePerpsPositionForAsset.mockReturnValue({
        position: mockPosition('-1.5'),
        isLoading: false,
      });
      renderButtons();

      fireEvent.click(screen.getByTestId('token-overview-short'));

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith(
          `${PERPS_ORDER_ENTRY_ROUTE}/ETH?direction=short&mode=modify`,
        ),
      );
    });

    it('opens a new order when the tapped side is opposite the open position', async () => {
      mockUsePerpsPositionForAsset.mockReturnValue({
        position: mockPosition('1.5'),
        isLoading: false,
      });
      renderButtons();

      fireEvent.click(screen.getByTestId('token-overview-short'));

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith(
          `${PERPS_ORDER_ENTRY_ROUTE}/ETH?direction=short&mode=new`,
        ),
      );
    });

    it('opens a new order for cross-margin positions, which cannot be increased', async () => {
      mockUsePerpsPositionForAsset.mockReturnValue({
        position: mockPosition('1.5', 'cross'),
        isLoading: false,
      });
      renderButtons();

      fireEvent.click(screen.getByTestId('token-overview-long'));

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith(
          `${PERPS_ORDER_ENTRY_ROUTE}/ETH?direction=long&mode=new`,
        ),
      );
    });

    it('looks up the position for the rendered market', () => {
      renderButtons();

      expect(mockUsePerpsPositionForAsset).toHaveBeenCalledWith('ETH');
    });
  });

  it('shows the geo-block modal with asset-detail source when not eligible', async () => {
    mockUsePerpsEligibility.mockReturnValue({ isEligible: false });
    renderButtons();

    fireEvent.click(screen.getByTestId('token-overview-long'));

    await waitFor(() =>
      expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument(),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockGeoBlockModal).toHaveBeenCalledWith(
      expect.objectContaining({
        isOpen: true,
        source: PERPS_EVENT_VALUE.SOURCE.ASSET_DETAIL_SCREEN,
      }),
    );
  });

  it('does not navigate when the compliance gate blocks the action', async () => {
    mockComplianceGate.mockResolvedValueOnce(undefined);
    renderButtons();

    fireEvent.click(screen.getByTestId('token-overview-long'));

    await waitFor(() => expect(mockComplianceGate).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  describe('when the compliance gate rejects', () => {
    const gateError = new Error('compliance gate failed');

    it('surfaces the failure as an error toast and reports it', async () => {
      mockComplianceGate.mockRejectedValueOnce(gateError);
      renderButtons();

      fireEvent.click(screen.getByTestId('token-overview-long'));

      expect(await screen.findByTestId('perps-toast')).toHaveTextContent(
        "Couldn't open trade",
      );
      expect(captureException).toHaveBeenCalledWith(gateError);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('releases the gate so the next tap can retry', async () => {
      mockComplianceGate.mockRejectedValueOnce(gateError);
      renderButtons();

      fireEvent.click(screen.getByTestId('token-overview-long'));
      await screen.findByTestId('perps-toast');

      fireEvent.click(screen.getByTestId('token-overview-long'));

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith(
          `${PERPS_ORDER_ENTRY_ROUTE}/ETH?direction=long&mode=new`,
        ),
      );
    });
  });

  it('ignores a second tap while the compliance gate is still pending', async () => {
    let releaseGate = () => undefined as unknown;
    mockComplianceGate.mockImplementationOnce(
      async (action: () => unknown) =>
        await new Promise((resolve) => {
          releaseGate = () => resolve(action());
        }),
    );
    renderButtons();

    fireEvent.click(screen.getByTestId('token-overview-long'));
    fireEvent.click(screen.getByTestId('token-overview-short'));

    expect(mockComplianceGate).toHaveBeenCalledTimes(1);

    releaseGate();

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        `${PERPS_ORDER_ENTRY_ROUTE}/ETH?direction=long&mode=new`,
      ),
    );
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});
