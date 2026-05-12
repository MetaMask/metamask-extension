import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { mockPositions } from '../mocks';
import { CloseAllPositionsModal } from './close-all-positions-modal';

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
  formatPnl: (value: number | string) => {
    const amount = Number(value);
    const abs = Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return amount >= 0 ? `+$${abs}` : `-$${abs}`;
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
  });

  it('renders when open', () => {
    renderWithProvider(
      <CloseAllPositionsModal {...defaultProps} />,
      mockStore,
    );

    expect(
      screen.getByTestId('perps-close-all-positions-modal'),
    ).toBeInTheDocument();
  });

  it('displays the description text', () => {
    renderWithProvider(
      <CloseAllPositionsModal {...defaultProps} />,
      mockStore,
    );

    expect(
      screen.getByText(/close all your open positions/iu),
    ).toBeInTheDocument();
  });

  it('displays margin value', () => {
    renderWithProvider(
      <CloseAllPositionsModal {...defaultProps} />,
      mockStore,
    );

    expect(
      screen.getByTestId('perps-close-all-total-margin-value'),
    ).toBeInTheDocument();
  });

  it('displays fees value', () => {
    renderWithProvider(
      <CloseAllPositionsModal {...defaultProps} />,
      mockStore,
    );

    expect(
      screen.getByTestId('perps-close-all-fees-value'),
    ).toBeInTheDocument();
  });

  it('displays you will receive value', () => {
    renderWithProvider(
      <CloseAllPositionsModal {...defaultProps} />,
      mockStore,
    );

    expect(
      screen.getByTestId('perps-close-all-receive-value'),
    ).toBeInTheDocument();
  });

  it('calls onConfirm when Close all button is clicked', () => {
    renderWithProvider(
      <CloseAllPositionsModal {...defaultProps} />,
      mockStore,
    );

    fireEvent.click(
      screen.getByTestId('perps-close-all-positions-modal-submit'),
    );

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Keep positions button is clicked', () => {
    renderWithProvider(
      <CloseAllPositionsModal {...defaultProps} />,
      mockStore,
    );

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
});
