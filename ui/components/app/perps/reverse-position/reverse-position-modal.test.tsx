import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { mockPositions } from '../mocks';
import { ReversePositionModal } from './reverse-position-modal';

const mockGetPerpsController = jest.fn();
const mockGetPerpsStreamManager = jest.fn();

jest.mock('../../../../providers/perps', () => ({
  getPerpsController: (...args: unknown[]) => mockGetPerpsController(...args),
}));

jest.mock('../../../../providers/perps/PerpsStreamManager', () => ({
  getPerpsStreamManager: () => mockGetPerpsStreamManager(),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const longPosition = mockPositions[0]; // ETH: size=2.5 (long), leverage.value=3
const shortPosition = mockPositions[1]; // BTC: size=-0.5 (short), leverage.value=15

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  position: longPosition,
  currentPrice: 2900,
  selectedAddress: '0x123',
};

describe('ReversePositionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPerpsController.mockResolvedValue({
      closePosition: jest.fn().mockResolvedValue({ success: true }),
      placeOrder: jest.fn().mockResolvedValue({ success: true }),
      getPositions: jest.fn().mockResolvedValue(mockPositions),
    });
    mockGetPerpsStreamManager.mockReturnValue({
      pushPositionsWithOverrides: jest.fn(),
    });
  });

  describe('rendering', () => {
    it('renders the modal with header', () => {
      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      expect(
        screen.getByText(messages.perpsReversePosition.message),
      ).toBeInTheDocument();
    });

    it('shows Direction, Est. size, and Fees rows', () => {
      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      expect(
        screen.getByText(messages.perpsDirection.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsEstSize.message),
      ).toBeInTheDocument();
      expect(screen.getByText(messages.perpsFees.message)).toBeInTheDocument();
    });

    it('shows Cancel and Save buttons', () => {
      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      expect(
        screen.getByTestId('perps-reverse-position-modal-cancel'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('perps-reverse-position-modal-save'),
      ).toBeInTheDocument();
    });

    it('shows fees placeholder as em-dash', () => {
      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('long position', () => {
    it('displays Long → Short direction label', () => {
      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      const directionLabel = `${messages.perpsLong.message} → ${messages.perpsShort.message}`;
      expect(screen.getByText(directionLabel)).toBeInTheDocument();
    });

    it('displays correct estimated size', () => {
      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      expect(screen.getByText('2.50 ETH')).toBeInTheDocument();
    });
  });

  describe('short position', () => {
    it('displays Short → Long direction label', () => {
      renderWithProvider(
        <ReversePositionModal
          {...defaultProps}
          position={shortPosition}
          currentPrice={45000}
        />,
        mockStore,
      );

      const directionLabel = `${messages.perpsShort.message} → ${messages.perpsLong.message}`;
      expect(screen.getByText(directionLabel)).toBeInTheDocument();
    });

    it('displays correct estimated size for short', () => {
      renderWithProvider(
        <ReversePositionModal
          {...defaultProps}
          position={shortPosition}
          currentPrice={45000}
        />,
        mockStore,
      );

      expect(screen.getByText('0.50 BTC')).toBeInTheDocument();
    });
  });

  describe('successful save', () => {
    it('closes the position and places a reverse order', async () => {
      const onClose = jest.fn();
      const closePosition = jest.fn().mockResolvedValue({ success: true });
      const placeOrder = jest.fn().mockResolvedValue({ success: true });
      const getPositions = jest.fn().mockResolvedValue(mockPositions);

      mockGetPerpsController.mockResolvedValue({
        closePosition,
        placeOrder,
        getPositions,
      });

      renderWithProvider(
        <ReversePositionModal {...defaultProps} onClose={onClose} />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('perps-reverse-position-modal-save'));

      await waitFor(() => {
        expect(mockGetPerpsController).toHaveBeenCalledWith('0x123');
        expect(closePosition).toHaveBeenCalledWith({
          symbol: 'ETH',
          orderType: 'market',
        });
      });

      await waitFor(() => {
        expect(placeOrder).toHaveBeenCalledWith({
          symbol: 'ETH',
          isBuy: false, // long→short: isBuy=false
          size: '2.5',
          orderType: 'market',
          usdAmount: '7250.00', // 2.5 * 2900
          currentPrice: 2900,
          leverage: 3,
        });
      });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('refreshes positions via stream manager after success', async () => {
      const pushPositionsWithOverrides = jest.fn();
      mockGetPerpsStreamManager.mockReturnValue({
        pushPositionsWithOverrides,
      });

      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      fireEvent.click(screen.getByTestId('perps-reverse-position-modal-save'));

      await waitFor(() => {
        expect(pushPositionsWithOverrides).toHaveBeenCalledWith(mockPositions);
      });
    });

    it('places a buy order when reversing a short position', async () => {
      const placeOrder = jest.fn().mockResolvedValue({ success: true });
      mockGetPerpsController.mockResolvedValue({
        closePosition: jest.fn().mockResolvedValue({ success: true }),
        placeOrder,
        getPositions: jest.fn().mockResolvedValue(mockPositions),
      });

      renderWithProvider(
        <ReversePositionModal
          {...defaultProps}
          position={shortPosition}
          currentPrice={45000}
        />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('perps-reverse-position-modal-save'));

      await waitFor(() => {
        expect(placeOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            symbol: 'BTC',
            isBuy: true, // short→long: isBuy=true
            size: '0.5',
            leverage: 15,
          }),
        );
      });
    });
  });

  describe('close fails', () => {
    it('displays error when closePosition returns failure', async () => {
      mockGetPerpsController.mockResolvedValue({
        closePosition: jest
          .fn()
          .mockResolvedValue({ success: false, error: 'Insufficient margin' }),
        placeOrder: jest.fn(),
        getPositions: jest.fn(),
      });

      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      fireEvent.click(screen.getByTestId('perps-reverse-position-modal-save'));

      await waitFor(() => {
        expect(screen.getByText('Insufficient margin')).toBeInTheDocument();
      });
    });

    it('does not call placeOrder when close fails', async () => {
      const placeOrder = jest.fn();
      mockGetPerpsController.mockResolvedValue({
        closePosition: jest
          .fn()
          .mockResolvedValue({ success: false, error: 'fail' }),
        placeOrder,
        getPositions: jest.fn(),
      });

      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      fireEvent.click(screen.getByTestId('perps-reverse-position-modal-save'));

      await waitFor(() => {
        expect(screen.getByText('fail')).toBeInTheDocument();
      });
      expect(placeOrder).not.toHaveBeenCalled();
    });

    it('does not call onClose when close fails', async () => {
      const onClose = jest.fn();
      mockGetPerpsController.mockResolvedValue({
        closePosition: jest
          .fn()
          .mockResolvedValue({ success: false, error: 'fail' }),
        placeOrder: jest.fn(),
        getPositions: jest.fn(),
      });

      renderWithProvider(
        <ReversePositionModal {...defaultProps} onClose={onClose} />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('perps-reverse-position-modal-save'));

      await waitFor(() => {
        expect(screen.getByText('fail')).toBeInTheDocument();
      });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('reverse order fails after close succeeds (partial failure)', () => {
    it('shows partial failure error when placeOrder fails after close succeeds', async () => {
      mockGetPerpsController.mockResolvedValue({
        closePosition: jest.fn().mockResolvedValue({ success: true }),
        placeOrder: jest
          .fn()
          .mockResolvedValue({ success: false, error: 'Order rejected' }),
        getPositions: jest.fn().mockResolvedValue(mockPositions),
      });

      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      fireEvent.click(screen.getByTestId('perps-reverse-position-modal-save'));

      await waitFor(() => {
        const errorText = screen.getByText(/Order rejected/u);
        expect(errorText).toBeInTheDocument();
        expect(errorText.textContent).toContain(
          messages.perpsPositionClosedReverseOrderFailed.message,
        );
      });
    });

    it('does not call onClose on partial failure', async () => {
      const onClose = jest.fn();
      mockGetPerpsController.mockResolvedValue({
        closePosition: jest.fn().mockResolvedValue({ success: true }),
        placeOrder: jest
          .fn()
          .mockResolvedValue({ success: false, error: 'rejected' }),
        getPositions: jest.fn().mockResolvedValue(mockPositions),
      });

      renderWithProvider(
        <ReversePositionModal {...defaultProps} onClose={onClose} />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('perps-reverse-position-modal-save'));

      await waitFor(() => {
        expect(screen.getByText(/rejected/u)).toBeInTheDocument();
      });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('exception handling', () => {
    it('shows error when getPerpsController throws', async () => {
      mockGetPerpsController.mockRejectedValue(new Error('Network error'));

      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      fireEvent.click(screen.getByTestId('perps-reverse-position-modal-save'));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('no selectedAddress', () => {
    it('does not submit when selectedAddress is empty', () => {
      mockGetPerpsController.mockResolvedValue({
        closePosition: jest.fn(),
        placeOrder: jest.fn(),
        getPositions: jest.fn(),
      });

      renderWithProvider(
        <ReversePositionModal {...defaultProps} selectedAddress="" />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('perps-reverse-position-modal-save'));

      expect(mockGetPerpsController).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('calls onClose when cancel button is clicked', () => {
      const onClose = jest.fn();

      renderWithProvider(
        <ReversePositionModal {...defaultProps} onClose={onClose} />,
        mockStore,
      );

      fireEvent.click(
        screen.getByTestId('perps-reverse-position-modal-cancel'),
      );

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('leverage fallback', () => {
    it('uses numeric leverage value when leverage is a plain number', async () => {
      const placeOrder = jest.fn().mockResolvedValue({ success: true });
      mockGetPerpsController.mockResolvedValue({
        closePosition: jest.fn().mockResolvedValue({ success: true }),
        placeOrder,
        getPositions: jest.fn().mockResolvedValue(mockPositions),
      });

      const positionWithPrimitiveLeverage = {
        ...longPosition,
        leverage: 5 as unknown as typeof longPosition.leverage,
      };

      renderWithProvider(
        <ReversePositionModal
          {...defaultProps}
          position={positionWithPrimitiveLeverage}
        />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('perps-reverse-position-modal-save'));

      await waitFor(() => {
        expect(placeOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            leverage: 5,
          }),
        );
      });
    });
  });
});
