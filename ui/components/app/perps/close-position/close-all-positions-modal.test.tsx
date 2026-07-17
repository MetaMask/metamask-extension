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
  formatPerpsFiat: (
    value: number | string,
    options?: { minimumDecimals?: number; maximumDecimals?: number },
  ) => {
    const amount = Number(value);
    const minDec = options?.minimumDecimals ?? 0;
    const maxDec = options?.maximumDecimals ?? 6;
    return `$${amount
      .toLocaleString('en-US', {
        minimumFractionDigits: minDec,
        maximumFractionDigits: maxDec,
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

const defaultFeeResult = {
  feeRate: 0.00145,
  protocolFeeRate: 0.00045,
  metamaskFeeRate: 0.001,
  feeAmount: 0,
  protocolFeeAmount: 0,
  metamaskFeeAmount: 0,
};

function setDefaultBackgroundResponses() {
  mockSubmitRequestToBackground.mockImplementation((method: string) => {
    if (method === 'rewardsGetPerpsDiscountForAccount') {
      return Promise.resolve(null);
    }
    return Promise.resolve(defaultFeeResult);
  });
}

describe('CloseAllPositionsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setDefaultBackgroundResponses();
  });

  it('renders when open', async () => {
    renderWithProvider(<CloseAllPositionsModal {...defaultProps} />, mockStore);

    await waitFor(() => {
      expect(
        screen.getByTestId('perps-close-all-fees-value'),
      ).not.toHaveTextContent('--');
    });

    expect(
      screen.getByTestId('perps-close-all-positions-modal'),
    ).toBeInTheDocument();
  });

  it('displays the description text', async () => {
    renderWithProvider(<CloseAllPositionsModal {...defaultProps} />, mockStore);

    await waitFor(() => {
      expect(
        screen.getByTestId('perps-close-all-fees-value'),
      ).not.toHaveTextContent('--');
    });

    expect(
      screen.getByText(/close all your open positions/iu),
    ).toBeInTheDocument();
  });

  it('displays margin value', async () => {
    renderWithProvider(<CloseAllPositionsModal {...defaultProps} />, mockStore);

    await waitFor(() => {
      expect(
        screen.getByTestId('perps-close-all-fees-value'),
      ).not.toHaveTextContent('--');
    });

    expect(
      screen.getByTestId('perps-close-all-total-margin-value'),
    ).toBeInTheDocument();
  });

  it('displays fees value', async () => {
    renderWithProvider(<CloseAllPositionsModal {...defaultProps} />, mockStore);

    await waitFor(() => {
      expect(
        screen.getByTestId('perps-close-all-fees-value'),
      ).not.toHaveTextContent('--');
    });

    expect(
      screen.getByTestId('perps-close-all-fees-value'),
    ).toBeInTheDocument();
  });

  it('displays you will receive value', async () => {
    renderWithProvider(<CloseAllPositionsModal {...defaultProps} />, mockStore);

    await waitFor(() => {
      expect(
        screen.getByTestId('perps-close-all-fees-value'),
      ).not.toHaveTextContent('--');
    });

    expect(
      screen.getByTestId('perps-close-all-receive-value'),
    ).toBeInTheDocument();
  });

  it('calls onConfirm when Close all button is clicked', async () => {
    renderWithProvider(<CloseAllPositionsModal {...defaultProps} />, mockStore);

    await waitFor(() => {
      expect(
        screen.getByTestId('perps-close-all-fees-value'),
      ).not.toHaveTextContent('--');
    });

    fireEvent.click(
      screen.getByTestId('perps-close-all-positions-modal-submit'),
    );

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Keep positions button is clicked', async () => {
    renderWithProvider(<CloseAllPositionsModal {...defaultProps} />, mockStore);

    await waitFor(() => {
      expect(
        screen.getByTestId('perps-close-all-fees-value'),
      ).not.toHaveTextContent('--');
    });

    fireEvent.click(
      screen.getByTestId('perps-close-all-positions-modal-cancel'),
    );

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('disables submit button when isSubmitting is true', async () => {
    renderWithProvider(
      <CloseAllPositionsModal {...defaultProps} isSubmitting />,
      mockStore,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('perps-close-all-fees-value'),
      ).not.toHaveTextContent('--');
    });

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
    const feesBySymbol: Record<
      string,
      { protocolFeeRate: number; metamaskFeeRate: number }
    > = {
      ETH: { protocolFeeRate: 0.0003, metamaskFeeRate: 0.0007 },
      BTC: { protocolFeeRate: 0.0005, metamaskFeeRate: 0.0015 },
    };
    mockSubmitRequestToBackground.mockImplementation(
      (method: string, args: unknown[]) => {
        if (method === 'rewardsGetPerpsDiscountForAccount') {
          return Promise.resolve(null);
        }
        const { symbol } = (args as [{ symbol: string }])[0];
        const rates = feesBySymbol[symbol] ?? {
          protocolFeeRate: 0.00045,
          metamaskFeeRate: 0.001,
        };
        return Promise.resolve({
          feeRate: rates.protocolFeeRate + rates.metamaskFeeRate,
          protocolFeeRate: rates.protocolFeeRate,
          metamaskFeeRate: rates.metamaskFeeRate,
          feeAmount: 0,
          protocolFeeAmount: 0,
          metamaskFeeAmount: 0,
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

    // ETH: 7125 * (0.0003 + 0.0007) = 7.125
    // BTC: 22500 * (0.0005 + 0.0015) = 45
    // Total = 52.125, rounded = 52.13
    await waitFor(() => {
      expect(
        screen.getByTestId('perps-close-all-fees-value'),
      ).toHaveTextContent('-$52.13');
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
