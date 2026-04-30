import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { mockPositions } from '../mocks';
import { ReversePositionModal } from './reverse-position-modal';

const mockUsePerpsOrderFees = jest.fn();
const mockUsePerpsEligibility = jest.fn(() => ({ isEligible: true }));

jest.mock('../../../../hooks/perps/usePerpsOrderFees', () => ({
  usePerpsOrderFees: () => mockUsePerpsOrderFees(),
}));

jest.mock('../../../../hooks/perps', () => ({
  usePerpsEligibility: () => mockUsePerpsEligibility(),
  usePerpsEventTracking: () => ({ track: jest.fn() }),
}));

jest.mock('../../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatCurrencyWithMinThreshold: (value: number, _currency: string) =>
      `$${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
  }),
}));

jest.mock('../../../../../shared/lib/perps-formatters', () => ({
  formatPerpsFiat: (value: number) =>
    `$${Number(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
  PRICE_RANGES_MINIMAL_VIEW: [],
  formatPositionSize: (value: number, decimals?: number) =>
    Number(value).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals ?? 4,
    }),
}));

jest.mock('@metamask/perps-controller', () => ({
  PERPS_ERROR_CODES: {
    CLIENT_NOT_INITIALIZED: 'CLIENT_NOT_INITIALIZED',
    CLIENT_REINITIALIZING: 'CLIENT_REINITIALIZING',
    PROVIDER_NOT_AVAILABLE: 'PROVIDER_NOT_AVAILABLE',
    TOKEN_NOT_SUPPORTED: 'TOKEN_NOT_SUPPORTED',
    BRIDGE_CONTRACT_NOT_FOUND: 'BRIDGE_CONTRACT_NOT_FOUND',
    WITHDRAW_FAILED: 'WITHDRAW_FAILED',
    POSITIONS_FAILED: 'POSITIONS_FAILED',
    ACCOUNT_STATE_FAILED: 'ACCOUNT_STATE_FAILED',
    MARKETS_FAILED: 'MARKETS_FAILED',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    ORDER_LEVERAGE_REDUCTION_FAILED: 'ORDER_LEVERAGE_REDUCTION_FAILED',
    IOC_CANCEL: 'IOC_CANCEL',
    CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
    WITHDRAW_ASSET_ID_REQUIRED: 'WITHDRAW_ASSET_ID_REQUIRED',
    WITHDRAW_AMOUNT_REQUIRED: 'WITHDRAW_AMOUNT_REQUIRED',
    WITHDRAW_AMOUNT_POSITIVE: 'WITHDRAW_AMOUNT_POSITIVE',
    WITHDRAW_INVALID_DESTINATION: 'WITHDRAW_INVALID_DESTINATION',
    WITHDRAW_ASSET_NOT_SUPPORTED: 'WITHDRAW_ASSET_NOT_SUPPORTED',
    WITHDRAW_INSUFFICIENT_BALANCE: 'WITHDRAW_INSUFFICIENT_BALANCE',
    DEPOSIT_ASSET_ID_REQUIRED: 'DEPOSIT_ASSET_ID_REQUIRED',
    DEPOSIT_AMOUNT_REQUIRED: 'DEPOSIT_AMOUNT_REQUIRED',
    DEPOSIT_AMOUNT_POSITIVE: 'DEPOSIT_AMOUNT_POSITIVE',
    DEPOSIT_MINIMUM_AMOUNT: 'DEPOSIT_MINIMUM_AMOUNT',
    ORDER_COIN_REQUIRED: 'ORDER_COIN_REQUIRED',
    ORDER_LIMIT_PRICE_REQUIRED: 'ORDER_LIMIT_PRICE_REQUIRED',
    ORDER_PRICE_POSITIVE: 'ORDER_PRICE_POSITIVE',
    ORDER_UNKNOWN_COIN: 'ORDER_UNKNOWN_COIN',
    ORDER_SIZE_POSITIVE: 'ORDER_SIZE_POSITIVE',
    ORDER_PRICE_REQUIRED: 'ORDER_PRICE_REQUIRED',
    ORDER_SIZE_MIN: 'ORDER_SIZE_MIN',
    ORDER_LEVERAGE_INVALID: 'ORDER_LEVERAGE_INVALID',
    ORDER_LEVERAGE_BELOW_POSITION: 'ORDER_LEVERAGE_BELOW_POSITION',
    ORDER_MAX_VALUE_EXCEEDED: 'ORDER_MAX_VALUE_EXCEEDED',
    EXCHANGE_CLIENT_NOT_AVAILABLE: 'EXCHANGE_CLIENT_NOT_AVAILABLE',
    INFO_CLIENT_NOT_AVAILABLE: 'INFO_CLIENT_NOT_AVAILABLE',
    SUBSCRIPTION_CLIENT_NOT_AVAILABLE: 'SUBSCRIPTION_CLIENT_NOT_AVAILABLE',
    NO_ACCOUNT_SELECTED: 'NO_ACCOUNT_SELECTED',
    KEYRING_LOCKED: 'KEYRING_LOCKED',
    INVALID_ADDRESS_FORMAT: 'INVALID_ADDRESS_FORMAT',
    TRANSFER_FAILED: 'TRANSFER_FAILED',
    SWAP_FAILED: 'SWAP_FAILED',
    SPOT_PAIR_NOT_FOUND: 'SPOT_PAIR_NOT_FOUND',
    PRICE_UNAVAILABLE: 'PRICE_UNAVAILABLE',
    BATCH_CANCEL_FAILED: 'BATCH_CANCEL_FAILED',
    BATCH_CLOSE_FAILED: 'BATCH_CLOSE_FAILED',
    INSUFFICIENT_MARGIN: 'INSUFFICIENT_MARGIN',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    REDUCE_ONLY_VIOLATION: 'REDUCE_ONLY_VIOLATION',
    POSITION_WOULD_FLIP: 'POSITION_WOULD_FLIP',
    MARGIN_ADJUSTMENT_FAILED: 'MARGIN_ADJUSTMENT_FAILED',
    TPSL_UPDATE_FAILED: 'TPSL_UPDATE_FAILED',
    ORDER_REJECTED: 'ORDER_REJECTED',
    SLIPPAGE_EXCEEDED: 'SLIPPAGE_EXCEEDED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    NETWORK_ERROR: 'NETWORK_ERROR',
  },
}));

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

const longPosition = mockPositions[0];
const shortPosition = mockPositions[1];

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  position: longPosition,
  currentPrice: 2900,
  sizeDecimals: 3,
};

describe('ReversePositionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsEligibility.mockReturnValue({ isEligible: true });
    mockUsePerpsOrderFees.mockReturnValue({
      feeRate: 0.0001,
      isLoading: false,
      hasError: false,
    });
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

    it('shows Cancel and Confirm buttons', () => {
      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      expect(
        screen.getByTestId('perps-reverse-position-modal-cancel'),
      ).toBeInTheDocument();
      const submitButton = screen.getByTestId(
        'perps-reverse-position-modal-save',
      );
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveTextContent(messages.confirm.message);
    });

    it('shows computed estimated fee', () => {
      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      expect(screen.getByTestId('perps-reverse-fee-value')).toHaveTextContent(
        '$1.45',
      );
    });

    it('shows fee placeholder while fees are unavailable', () => {
      mockUsePerpsOrderFees.mockReturnValue({
        feeRate: undefined,
        isLoading: true,
        hasError: false,
      });

      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      expect(screen.getByTestId('perps-reverse-fee-value')).toHaveTextContent(
        '--',
      );
    });

    it('shows fee placeholder when fee lookup fails', () => {
      mockUsePerpsOrderFees.mockReturnValue({
        feeRate: undefined,
        isLoading: false,
        hasError: true,
      });

      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      expect(screen.getByTestId('perps-reverse-fee-value')).toHaveTextContent(
        '--',
      );
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

      expect(screen.getByText('2.5 ETH')).toBeInTheDocument();
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

      expect(screen.getByText('0.5 BTC')).toBeInTheDocument();
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
        expect(
          screen.getByText(messages.perpsInsufficientMargin.message),
        ).toBeInTheDocument();
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
        expect(
          screen.getByText("We couldn't load this page."),
        ).toBeInTheDocument();
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
        expect(
          screen.getByText("We couldn't load this page."),
        ).toBeInTheDocument();
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
        expect(
          screen.getByText(messages.perpsNetworkError.message),
        ).toBeInTheDocument();
      });
    });
  });

  describe('toast emission', () => {
    it('emits reverse in-progress toast on submit', () => {
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
          description: 'Insufficient margin to place this order.',
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
          description: 'A network error occurred. Please try again.',
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

  describe('geo-blocking', () => {
    it('shows geo-block modal instead of reversing when user is not eligible', async () => {
      mockUsePerpsEligibility.mockReturnValue({ isEligible: false });

      renderWithProvider(<ReversePositionModal {...defaultProps} />, mockStore);

      const saveButton = screen.getByTestId(
        'perps-reverse-position-modal-save',
      );
      expect(saveButton).toBeEnabled();

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument();
      });
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });
  });
});
