import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { mockPositions } from '../mocks';
import { CloseAllPositionsModal } from './close-all-positions-modal';

const mockSubmitRequestToBackground = jest.fn();
jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

jest.mock('../../../../../shared/lib/perps-formatters', () => ({
  PRICE_RANGES_UNIVERSAL: [],
  formatPerpsFiat: (value: number | string) => {
    const amount = Number(value);
    return `$${amount
      .toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6,
      })
      .replace(/(\.\d*?[1-9])0+$/u, '$1')
      .replace(/\.0+$/u, '')}`;
  },
}));

jest.mock('../utils/formatPerpsDisplayPrice', () => ({
  formatPerpsFiatUniversal: (value: number | string) => {
    const amount = Number(value);
    return `$${amount
      .toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6,
      })
      .replace(/(\.\d*?[1-9])0+$/u, '$1')
      .replace(/\.0+$/u, '')}`;
  },
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const twoPositions = mockPositions.slice(0, 2);

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onConfirm: jest.fn(),
  positions: twoPositions,
  isSubmitting: false,
};

describe('CloseAllPositionsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockResolvedValue({ feeRate: 0.00145 });
  });

  it('renders when open', () => {
    renderWithProvider(<CloseAllPositionsModal {...defaultProps} />, mockStore);

    expect(
      screen.getByTestId('perps-close-all-positions-modal'),
    ).toBeInTheDocument();
  });

  it('displays the description text', () => {
    renderWithProvider(<CloseAllPositionsModal {...defaultProps} />, mockStore);

    expect(
      screen.getByText(/close all your open positions/iu),
    ).toBeInTheDocument();
  });

  it('displays margin value', () => {
    renderWithProvider(<CloseAllPositionsModal {...defaultProps} />, mockStore);

    expect(
      screen.getByTestId('perps-close-all-total-margin-value'),
    ).toBeInTheDocument();
  });

  it('displays fees value', () => {
    renderWithProvider(<CloseAllPositionsModal {...defaultProps} />, mockStore);

    expect(
      screen.getByTestId('perps-close-all-fees-value'),
    ).toBeInTheDocument();
  });

  it('displays you will receive value', () => {
    renderWithProvider(<CloseAllPositionsModal {...defaultProps} />, mockStore);

    expect(
      screen.getByTestId('perps-close-all-receive-value'),
    ).toBeInTheDocument();
  });

  it('calls onConfirm when Close all button is clicked', () => {
    renderWithProvider(<CloseAllPositionsModal {...defaultProps} />, mockStore);

    fireEvent.click(
      screen.getByTestId('perps-close-all-positions-modal-submit'),
    );

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Keep positions button is clicked', () => {
    renderWithProvider(<CloseAllPositionsModal {...defaultProps} />, mockStore);

    fireEvent.click(
      screen.getByTestId('perps-close-all-positions-modal-cancel'),
    );

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('disables submit button when isSubmitting is true', () => {
    renderWithProvider(
      <CloseAllPositionsModal {...defaultProps} isSubmitting />,
      mockStore,
    );

    expect(
      screen.getByTestId('perps-close-all-positions-modal-submit'),
    ).toBeDisabled();
  });

  it('disables submit button when positions array is empty', () => {
    renderWithProvider(
      <CloseAllPositionsModal {...defaultProps} positions={[]} />,
      mockStore,
    );

    expect(
      screen.getByTestId('perps-close-all-positions-modal-submit'),
    ).toBeDisabled();
  });

  it('does not render when isOpen is false', () => {
    renderWithProvider(
      <CloseAllPositionsModal {...defaultProps} isOpen={false} />,
      mockStore,
    );

    expect(
      screen.queryByTestId('perps-close-all-positions-modal'),
    ).not.toBeInTheDocument();
  });

  it('fetches fees per unique symbol rather than using a single rate', async () => {
    const feeRateBySymbol: Record<string, number> = {
      ETH: 0.001,
      BTC: 0.002,
    };
    mockSubmitRequestToBackground.mockImplementation(
      (_method: string, args: unknown[]) => {
        const { symbol } = (args as [{ symbol: string }])[0];
        return Promise.resolve({
          feeRate: feeRateBySymbol[symbol] ?? 0.00145,
        });
      },
    );

    renderWithProvider(<CloseAllPositionsModal {...defaultProps} />, mockStore);

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsCalculateFees',
        [expect.objectContaining({ symbol: 'ETH' })],
      );
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsCalculateFees',
        [expect.objectContaining({ symbol: 'BTC' })],
      );
    });
  });

  it('uses fallback fee rate when background call fails', async () => {
    mockSubmitRequestToBackground.mockRejectedValue(
      new Error('Background unreachable'),
    );

    renderWithProvider(<CloseAllPositionsModal {...defaultProps} />, mockStore);

    await waitFor(() => {
      expect(
        screen.getByTestId('perps-close-all-fees-value'),
      ).toBeInTheDocument();
    });
  });
});
