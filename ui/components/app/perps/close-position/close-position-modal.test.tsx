import React from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { mockPositions } from '../mocks';
import { ClosePositionModal } from './close-position-modal';

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

/** Matches rendered `perpsClosePartialMinNotional` after $1 is replaced with a formatted USD amount */
const PARTIAL_MIN_NOTIONAL_PATTERN =
  /Partial closes must be at least \$[\d,.]+ in USD value\. Increase the close amount or set the slider to 100%\./u;

const mockSubmitRequestToBackground = jest.fn();
const mockReplacePerpsToastByKey = jest.fn();

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

jest.mock('../../../../hooks/perps/usePerpsOrderFees', () => ({
  usePerpsOrderFees: () => ({ feeRate: 0.00145, isLoading: false }),
}));

jest.mock('../perps-toast', () => ({
  PERPS_TOAST_KEYS: {
    CLOSE_FAILED: 'perpsToastCloseFailed',
    CLOSE_IN_PROGRESS: 'perpsToastCloseInProgress',
    PARTIAL_CLOSE_FAILED: 'perpsToastPartialCloseFailed',
    PARTIAL_CLOSE_IN_PROGRESS: 'perpsToastPartialCloseInProgress',
    PARTIAL_CLOSE_SUCCESS: 'perpsToastPartialCloseSuccess',
    TRADE_SUCCESS: 'perpsToastTradeSuccess',
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

const basePosition = mockPositions[0];

describe('ClosePositionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockResolvedValue({ success: true });
  });

  describe('ORDER_SIZE_MIN from background', () => {
    it('shows localized min-notional message when close rejects with ORDER_SIZE_MIN', async () => {
      const user = userEvent.setup();
      mockSubmitRequestToBackground.mockRejectedValue(
        new Error('ORDER_SIZE_MIN'),
      );

      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
        />,
        mockStore,
      );

      await user.click(screen.getByTestId('perps-close-position-modal-submit'));

      await waitFor(() => {
        expect(
          screen.getByText(PARTIAL_MIN_NOTIONAL_PATTERN),
        ).toBeInTheDocument();
      });
    });

    it('shows localized min-notional message when close returns success false with ORDER_SIZE_MIN', async () => {
      const user = userEvent.setup();
      mockSubmitRequestToBackground.mockResolvedValue({
        success: false,
        error: 'ORDER_SIZE_MIN',
      });

      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
        />,
        mockStore,
      );

      await user.click(screen.getByTestId('perps-close-position-modal-submit'));

      await waitFor(() => {
        expect(
          screen.getByText(PARTIAL_MIN_NOTIONAL_PATTERN),
        ).toBeInTheDocument();
      });
    });
  });

  describe('invalid current price', () => {
    it('disables submit when currentPrice is zero even at 100% close', () => {
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={0}
        />,
        mockStore,
      );

      expect(
        screen.getByTestId('perps-close-position-modal-submit'),
      ).toBeDisabled();
    });

    it('disables submit when currentPrice is NaN', async () => {
      const user = userEvent.setup();
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={NaN}
        />,
        mockStore,
      );

      const slider = within(
        screen.getByTestId('close-amount-slider'),
      ).getByRole('slider');
      slider.focus();
      await user.keyboard('{ArrowLeft}');

      expect(
        screen.getByTestId('perps-close-position-modal-submit'),
      ).toBeDisabled();
    });
  });

  describe('toast emission', () => {
    it('emits close in-progress toast on full close submit', async () => {
      // Delay resolution so we can assert the in-progress toast fires first
      mockSubmitRequestToBackground.mockReturnValue(
        new Promise(() => undefined),
      );

      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
        />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('perps-close-position-modal-submit'));

      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'perpsToastCloseInProgress',
      });
    });

    it('emits partial close in-progress toast with position subtitle', async () => {
      mockSubmitRequestToBackground.mockReturnValue(
        new Promise(() => undefined),
      );

      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
        />,
        mockStore,
      );

      const slider = within(
        screen.getByTestId('close-amount-slider'),
      ).getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowLeft' });

      fireEvent.click(screen.getByTestId('perps-close-position-modal-submit'));

      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastPartialCloseInProgress',
          description: expect.stringMatching(/long .* ETH/u),
        }),
      );
    });

    it('emits trade success toast on full close (100%)', async () => {
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
        />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('perps-close-position-modal-submit'));

      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
          expect.objectContaining({ key: 'perpsToastTradeSuccess' }),
        );
      });
    });

    it('includes the PnL subtitle when computable', async () => {
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
        />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('perps-close-position-modal-submit'));

      await waitFor(() => {
        const successCall = mockReplacePerpsToastByKey.mock.calls.find(
          ([arg]: [{ key: string }]) => arg.key === 'perpsToastTradeSuccess',
        );
        expect(successCall).toBeDefined();
        expect(successCall[0].description).toBeDefined();
      });
    });

    it('emits partial close success toast when closePercent < 100', async () => {
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
        />,
        mockStore,
      );

      // Move slider left to get a partial close
      const slider = within(
        screen.getByTestId('close-amount-slider'),
      ).getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowLeft' });

      fireEvent.click(screen.getByTestId('perps-close-position-modal-submit'));

      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
          expect.objectContaining({
            key: 'perpsToastPartialCloseSuccess',
          }),
        );
      });
    });

    it('does not emit trade success toast on partial close', async () => {
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
        />,
        mockStore,
      );

      const slider = within(
        screen.getByTestId('close-amount-slider'),
      ).getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowLeft' });

      fireEvent.click(screen.getByTestId('perps-close-position-modal-submit'));

      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
          expect.objectContaining({
            key: 'perpsToastPartialCloseSuccess',
          }),
        );
      });

      // Verify TRADE_SUCCESS was NOT called (only in-progress and partial success)
      const tradeSuccessCall = mockReplacePerpsToastByKey.mock.calls.find(
        ([arg]: [{ key: string }]) => arg.key === 'perpsToastTradeSuccess',
      );
      expect(tradeSuccessCall).toBeUndefined();
    });

    it('includes PnL subtitle on partial close when computable', async () => {
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
        />,
        mockStore,
      );

      const slider = within(
        screen.getByTestId('close-amount-slider'),
      ).getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowLeft' });

      fireEvent.click(screen.getByTestId('perps-close-position-modal-submit'));

      await waitFor(() => {
        const successCall = mockReplacePerpsToastByKey.mock.calls.find(
          ([arg]: [{ key: string }]) =>
            arg.key === 'perpsToastPartialCloseSuccess',
        );
        expect(successCall).toBeDefined();
        expect(successCall[0].description).toBeDefined();
      });
    });

    it('emits close failed toast on full close background failure', async () => {
      mockSubmitRequestToBackground.mockResolvedValue({
        success: false,
        error: 'Insufficient balance',
      });

      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
        />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('perps-close-position-modal-submit'));

      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
          key: 'perpsToastCloseFailed',
          description: 'Amount exceeds your available Perps balance.',
        });
      });
    });

    it('emits partial close failed toast with active-position subtitle', async () => {
      mockSubmitRequestToBackground.mockResolvedValue({
        success: false,
        error: 'Insufficient balance',
      });

      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
        />,
        mockStore,
      );

      const slider = within(
        screen.getByTestId('close-amount-slider'),
      ).getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowLeft' });

      fireEvent.click(screen.getByTestId('perps-close-position-modal-submit'));

      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
          key: 'perpsToastPartialCloseFailed',
          description: 'Your position is still active',
        });
      });
    });

    it('emits localized min-notional failure description for full-close ORDER_SIZE_MIN', async () => {
      mockSubmitRequestToBackground.mockRejectedValue(
        new Error('ORDER_SIZE_MIN'),
      );

      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
        />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('perps-close-position-modal-submit'));

      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
          expect.objectContaining({
            key: 'perpsToastCloseFailed',
            description: expect.stringMatching(PARTIAL_MIN_NOTIONAL_PATTERN),
          }),
        );
      });
    });

    it('emits active-position subtitle for partial-close ORDER_SIZE_MIN', async () => {
      mockSubmitRequestToBackground.mockRejectedValue(
        new Error('ORDER_SIZE_MIN'),
      );

      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
        />,
        mockStore,
      );

      const slider = within(
        screen.getByTestId('close-amount-slider'),
      ).getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowLeft' });

      fireEvent.click(screen.getByTestId('perps-close-position-modal-submit'));

      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
          key: 'perpsToastPartialCloseFailed',
          description: 'Your position is still active',
        });
      });
    });
  });

  describe('partial close below minimum USD notional', () => {
    it('disables submit when partial notional is just under $10 even if rounded to cents it would be $10', async () => {
      const user = userEvent.setup();
      const positionOneUnit = {
        ...basePosition,
        size: '1',
      };

      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={positionOneUnit}
          currentPrice={19.992}
        />,
        mockStore,
      );

      const slider = within(
        screen.getByTestId('close-amount-slider'),
      ).getByRole('slider');
      slider.focus();
      await user.keyboard(
        Array.from({ length: 50 }, () => '{ArrowLeft}').join(''),
      );

      await waitFor(() => {
        expect(
          screen.getByText(PARTIAL_MIN_NOTIONAL_PATTERN),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('perps-close-position-modal-submit'),
        ).toBeDisabled();
      });
    });

    it('disables submit and shows warning when partial notional is under $10', async () => {
      const user = userEvent.setup();
      const smallPosition = {
        ...basePosition,
        size: '0.01',
      };

      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={smallPosition}
          currentPrice={500}
        />,
        mockStore,
      );

      expect(
        screen.getByTestId('perps-close-position-modal-submit'),
      ).not.toBeDisabled();

      const slider = within(
        screen.getByTestId('close-amount-slider'),
      ).getByRole('slider');
      slider.focus();
      await user.keyboard('{ArrowLeft}');

      await waitFor(() => {
        expect(
          screen.getByText(PARTIAL_MIN_NOTIONAL_PATTERN),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('perps-close-position-modal-submit'),
        ).toBeDisabled();
      });
    });
  });
});
