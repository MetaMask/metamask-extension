import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { mockPositions } from '../mocks';
import { ReversePositionModal } from './reverse-position-modal';

const mockSubmitRequestToBackground = jest.fn();
const mockGetPerpsStreamManager = jest.fn();
const mockReplacePerpsToastByKey = jest.fn();

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

jest.mock('../../../../providers/perps', () => ({
  getPerpsStreamManager: () => mockGetPerpsStreamManager(),
}));

jest.mock('../perps-toast', () => ({
  PERPS_TOAST_KEYS: {
    REVERSE_FAILED: 'perpsToastReverseFailed',
    REVERSE_IN_PROGRESS: 'perpsToastReverseInProgress',
    REVERSE_SUCCESS: 'perpsToastReverseSuccess',
  },
  usePerpsToast: () => ({
    replacePerpsToastByKey: mockReplacePerpsToastByKey,
  }),
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
};

describe('ReversePositionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockImplementation((method: string) => {
      if (method === 'perpsFlipPosition') {
        return Promise.resolve({ success: true });
      }
      if (method === 'perpsGetPositions') {
        return Promise.resolve(mockPositions);
      }
      return Promise.resolve(undefined);
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
    it('calls perpsFlipPosition once with symbol and position payload', async () => {
      const onClose = jest.fn();

      renderWithProvider(
        <ReversePositionModal {...defaultProps} onClose={onClose} />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('perps-reverse-position-modal-save'));

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsFlipPosition',
          [
            {
              symbol: 'ETH',
              position: expect.objectContaining({
                symbol: 'ETH',
                size: '2.5',
                leverage: expect.objectContaining({ value: 3 }),
              }),
            },
          ],
        );
      });

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsClosePosition',
        expect.anything(),
      );
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsPlaceOrder',
        expect.anything(),
      );

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

    it('calls flip with short position when reversing a short', async () => {
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
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsFlipPosition',
          [
            {
              symbol: 'BTC',
              position: expect.objectContaining({
                symbol: 'BTC',
                size: '-0.5',
                leverage: expect.objectContaining({ value: 15 }),
              }),
            },
          ],
        );
      });
    });
  });

  describe('flip fails', () => {
    it('displays error when perpsFlipPosition returns failure', async () => {
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsFlipPosition') {
          return Promise.resolve({
            success: false,
            error: 'Insufficient margin',
          });
        }
        return Promise.resolve(undefined);
      });

      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      fireEvent.click(screen.getByTestId('perps-reverse-position-modal-save'));

      await waitFor(() => {
        expect(screen.getByText('Insufficient margin')).toBeInTheDocument();
      });
    });

    it('does not call perpsClosePosition or perpsPlaceOrder when flip fails', async () => {
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsFlipPosition') {
          return Promise.resolve({ success: false, error: 'fail' });
        }
        return Promise.resolve(undefined);
      });

      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      fireEvent.click(screen.getByTestId('perps-reverse-position-modal-save'));

      await waitFor(() => {
        expect(screen.getByText('fail')).toBeInTheDocument();
      });

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsClosePosition',
        expect.anything(),
      );
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsPlaceOrder',
        expect.anything(),
      );
    });

    it('does not call onClose when flip fails', async () => {
      const onClose = jest.fn();
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsFlipPosition') {
          return Promise.resolve({ success: false, error: 'fail' });
        }
        return Promise.resolve(undefined);
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

  describe('exception handling', () => {
    it('shows error when submitRequestToBackground throws', async () => {
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsFlipPosition') {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(undefined);
      });

      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      fireEvent.click(screen.getByTestId('perps-reverse-position-modal-save'));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('toast emission', () => {
    it('emits reverse in-progress toast on submit', () => {
      // Never resolve so we can assert the in-progress toast fires
      mockSubmitRequestToBackground.mockImplementation(
        () => new Promise(() => undefined),
      );

      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      fireEvent.click(screen.getByTestId('perps-reverse-position-modal-save'));

      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'perpsToastReverseInProgress',
      });
    });

    it('emits reverse success toast after successful flip + refresh', async () => {
      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      fireEvent.click(screen.getByTestId('perps-reverse-position-modal-save'));

      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
          key: 'perpsToastReverseSuccess',
        });
      });
    });

    it('emits reverse failed toast on returned failure', async () => {
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsFlipPosition') {
          return Promise.resolve({
            success: false,
            error: 'Insufficient margin',
          });
        }
        return Promise.resolve(undefined);
      });

      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      fireEvent.click(screen.getByTestId('perps-reverse-position-modal-save'));

      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
          key: 'perpsToastReverseFailed',
          description: 'Insufficient margin',
        });
      });
    });

    it('emits reverse failed toast on thrown exception', async () => {
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsFlipPosition') {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(undefined);
      });

      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      fireEvent.click(screen.getByTestId('perps-reverse-position-modal-save'));

      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
          key: 'perpsToastReverseFailed',
          description: 'Network error',
        });
      });
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
    it('normalizes primitive leverage for flip payload', async () => {
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
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsFlipPosition',
          [
            {
              symbol: 'ETH',
              position: expect.objectContaining({
                leverage: { type: 'cross', value: 5 },
              }),
            },
          ],
        );
      });
    });
  });
});
