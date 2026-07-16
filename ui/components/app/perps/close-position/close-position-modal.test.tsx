import React from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { tEn } from '../../../../../test/lib/i18n-helpers';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { mockPositions } from '../mocks';
import { ClosePositionModal } from './close-position-modal';

// Mobile test convention: mock the Compliance barrel so the gate hook never runs
// (and never reaches the now-strict AccessRestrictedProvider context throw). The
// gate is a passthrough here; real gating behavior is covered in
// useComplianceGate.test.tsx.
jest.mock('../../compliance', () => {
  // Stable references so components that put `gate` in effect/callback deps
  // don't re-run on every render.
  const gate = async (action: () => unknown) => action();
  const value = {
    gate,
    isComplianceEnabled: false,
    isBlocked: false,
    checkCompliance: jest.fn(),
  };
  return {
    useComplianceGate: () => value,
    useSelectedAccountComplianceGate: () => value,
  };
});

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
  formatPositionSize: (value: number, decimals?: number) =>
    Number(value).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals ?? 4,
    }),
}));

jest.mock('@metamask/perps-controller', () => ({
  ...jest.requireActual('@metamask/perps-controller'),
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

const PARTIAL_MIN_NOTIONAL_AMOUNT = '$10';
const PARTIAL_MIN_NOTIONAL_MESSAGE = tEn('perpsClosePartialMinNotional', [
  PARTIAL_MIN_NOTIONAL_AMOUNT,
]);

const mockSubmitRequestToBackground = jest.fn();
const mockReplacePerpsToastByKey = jest.fn();

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

jest.mock('../../rewards/RewardsVipBadge', () => ({
  RewardsVipBadge: () => null,
}));

const mockUsePerpsEligibility = jest.fn(() => ({ isEligible: true }));
jest.mock('../../../../hooks/perps/usePerpsEligibility', () => ({
  usePerpsEligibility: () => mockUsePerpsEligibility(),
}));

type MockedUsePerpsOrderFeesReturn = {
  feeRate: number | undefined;
  undiscountedFeeRate: number | undefined;
  isLoading: boolean;
  metamaskFeeRateDiscountPercentage: number | undefined;
};
const mockUsePerpsOrderFees = jest.fn<
  MockedUsePerpsOrderFeesReturn,
  [Record<string, unknown>]
>(() => ({
  feeRate: 0.00145,
  undiscountedFeeRate: 0.00145,
  isLoading: false,
  metamaskFeeRateDiscountPercentage: undefined,
}));
jest.mock('../../../../hooks/perps/usePerpsOrderFees', () => ({
  usePerpsOrderFees: (options: Record<string, unknown>) =>
    mockUsePerpsOrderFees(options),
}));

jest.mock('../perps-toast', () => ({
  PERPS_TOAST_KEYS: {
    CLOSE_FAILED: 'perpsToastCloseFailed',
    CLOSE_IN_PROGRESS: 'perpsToastCloseInProgress',
    LIMIT_CLOSE_FAILED: 'perpsToastLimitCloseFailed',
    PARTIAL_CLOSE_FAILED: 'perpsToastPartialCloseFailed',
    PARTIAL_CLOSE_IN_PROGRESS: 'perpsToastPartialCloseInProgress',
    PARTIAL_CLOSE_SUCCESS: 'perpsToastPartialCloseSuccess',
    PARTIAL_LIMIT_CLOSE_FAILED: 'perpsToastPartialLimitCloseFailed',
    ORDER_PLACED: 'perpsToastOrderPlaced',
    ORDER_SUBMITTED: 'perpsToastOrderSubmitted',
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

const createCloseLimitEnabledStore = () =>
  configureStore({
    metamask: {
      ...mockState.metamask,
      remoteFeatureFlags: {
        ...mockState.metamask.remoteFeatureFlags,
        perpsClosePositionLimitOrderEnabled: true,
      },
    },
  });

const basePosition = mockPositions[0];

describe('ClosePositionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsEligibility.mockReturnValue({ isEligible: true });
    mockUsePerpsOrderFees.mockReturnValue({
      feeRate: 0.00145,
      undiscountedFeeRate: 0.00145,
      isLoading: false,
      metamaskFeeRateDiscountPercentage: undefined,
    });
    mockSubmitRequestToBackground.mockResolvedValue({ success: true });
  });

  describe('perpsClosePosition call', () => {
    it('preserves the full market close request shape', async () => {
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
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsClosePosition',
          [
            expect.objectContaining({
              symbol: basePosition.symbol,
              orderType: 'market',
              currentPrice: 2900,
              position: basePosition,
            }),
          ],
        );
      });
      const params = mockSubmitRequestToBackground.mock.calls.find(
        ([method]) => method === 'perpsClosePosition',
      )?.[1][0];
      expect(params).not.toHaveProperty('size');
      expect(params).not.toHaveProperty('price');
    });

    it('preserves formatted partial market close sizes', async () => {
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
          sizeDecimals={4}
        />,
        mockStore,
      );
      const slider = within(
        screen.getByTestId('close-amount-slider-pct-100'),
      ).getByRole('slider');
      fireEvent.change(slider, { target: { value: '50' } });

      fireEvent.click(screen.getByTestId('perps-close-position-modal-submit'));

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsClosePosition',
          [
            expect.objectContaining({
              orderType: 'market',
              currentPrice: 2900,
              size: '1.2500',
            }),
          ],
        );
      });
    });

    it('includes trackingData with totalFee and marketPrice', async () => {
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
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsClosePosition',
          [
            expect.objectContaining({
              trackingData: expect.objectContaining({
                totalFee: expect.any(Number),
                marketPrice: 2900,
              }),
            }),
          ],
        );
      });
    });
  });

  describe('auto-focus', () => {
    it('auto-focuses the Close Position submit button on mount', async () => {
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
        />,
        mockStore,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('perps-close-position-modal-submit'),
        ).toHaveFocus();
      });
    });
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
          screen.getByText(PARTIAL_MIN_NOTIONAL_MESSAGE),
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
          screen.getByText(PARTIAL_MIN_NOTIONAL_MESSAGE),
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
        screen.getByTestId('close-amount-slider-pct-100'),
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
        screen.getByTestId('close-amount-slider-pct-100'),
      ).getByRole('slider');
      fireEvent.change(slider, { target: { value: '99' } });

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
        screen.getByTestId('close-amount-slider-pct-100'),
      ).getByRole('slider');
      fireEvent.change(slider, { target: { value: '99' } });

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
        screen.getByTestId('close-amount-slider-pct-100'),
      ).getByRole('slider');
      fireEvent.change(slider, { target: { value: '99' } });

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
        screen.getByTestId('close-amount-slider-pct-100'),
      ).getByRole('slider');
      fireEvent.change(slider, { target: { value: '99' } });

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
        screen.getByTestId('close-amount-slider-pct-100'),
      ).getByRole('slider');
      fireEvent.change(slider, { target: { value: '99' } });

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
            description: expect.stringContaining(PARTIAL_MIN_NOTIONAL_MESSAGE),
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
        screen.getByTestId('close-amount-slider-pct-100'),
      ).getByRole('slider');
      fireEvent.change(slider, { target: { value: '99' } });

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
        screen.getByTestId('close-amount-slider-pct-100'),
      ).getByRole('slider');
      fireEvent.change(slider, { target: { value: '50' } });

      await waitFor(() => {
        const warningMessage = screen.getByText(PARTIAL_MIN_NOTIONAL_MESSAGE);
        expect(warningMessage).toBeInTheDocument();
        expect(warningMessage).not.toHaveTextContent(/slider|slide/u);
        expect(
          screen.getByTestId('perps-close-position-modal-submit'),
        ).toBeDisabled();
      });
    });

    it('disables submit and shows warning when partial notional is under $10', async () => {
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
        screen.getByTestId('close-amount-slider-pct-100'),
      ).getByRole('slider');
      fireEvent.change(slider, { target: { value: '99' } });

      await waitFor(() => {
        const warningMessage = screen.getByText(PARTIAL_MIN_NOTIONAL_MESSAGE);
        expect(warningMessage).toBeInTheDocument();
        expect(warningMessage).not.toHaveTextContent(/slider|slide/u);
        expect(
          screen.getByTestId('perps-close-position-modal-submit'),
        ).toBeDisabled();
      });
    });
  });

  describe('close limit orders', () => {
    const enterLimitPrice = (price: string) => {
      fireEvent.click(screen.getByTestId('order-type-limit'));
      const container = screen.getByTestId('limit-price-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, {
        target: { value: price },
      });
    };

    const submitLimitClose = async ({ partial }: { partial: boolean }) => {
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
          markPrice={2900}
        />,
        createCloseLimitEnabledStore(),
      );
      enterLimitPrice('3000');
      if (partial) {
        const slider = within(
          screen.getByTestId('close-amount-slider-pct-100'),
        ).getByRole('slider');
        fireEvent.change(slider, { target: { value: '50' } });
      }
      fireEvent.click(screen.getByTestId('perps-close-position-modal-submit'));

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledTimes(2);
      });
    };

    it('keeps the existing market-only UI when the flag is disabled', () => {
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
        />,
        mockStore,
      );

      expect(screen.queryByTestId('order-type-toggle')).not.toBeInTheDocument();
      expect(screen.queryByTestId('limit-price-input')).not.toBeInTheDocument();
      expect(mockUsePerpsOrderFees).toHaveBeenLastCalledWith(
        expect.objectContaining({
          orderType: 'market',
          isMaker: false,
        }),
      );
    });

    it('defaults to Market and exposes Limit when the flag is enabled', () => {
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
        />,
        createCloseLimitEnabledStore(),
      );

      expect(screen.getByTestId('order-type-toggle')).toBeInTheDocument();
      expect(screen.queryByTestId('limit-price-input')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('order-type-limit'));

      expect(screen.getByTestId('limit-price-input')).toBeInTheDocument();
      expect(
        screen.getByText(tEn('perpsCloseLimitPriceRequired')),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('perps-close-position-modal-submit'),
      ).toBeDisabled();
    });

    it('passes the opposite position direction to the warning behavior', () => {
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
        />,
        createCloseLimitEnabledStore(),
      );

      enterLimitPrice('2800');

      expect(
        screen.getByText(tEn('perpsLimitPriceBelowCurrentPrice')),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('perps-close-position-modal-submit'),
      ).toBeEnabled();
    });

    it('warns above market when closing a short', () => {
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={mockPositions[1]}
          currentPrice={45000}
        />,
        createCloseLimitEnabledStore(),
      );

      enterLimitPrice('46000');

      expect(
        screen.getByText(tEn('perpsLimitPriceAboveCurrentPrice')),
      ).toBeInTheDocument();
    });

    it('clears the limit price and restores market fees when Market is selected', () => {
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
        />,
        createCloseLimitEnabledStore(),
      );
      enterLimitPrice('3000');

      fireEvent.click(screen.getByTestId('order-type-market'));

      expect(screen.queryByTestId('limit-price-input')).not.toBeInTheDocument();
      expect(mockUsePerpsOrderFees).toHaveBeenLastCalledWith(
        expect.objectContaining({
          orderType: 'market',
          isMaker: false,
        }),
      );
    });

    it('submits an exact full limit request without market-only fields', async () => {
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
          markPrice={2900}
          sizeDecimals={4}
        />,
        createCloseLimitEnabledStore(),
      );

      enterLimitPrice('3000.25');
      fireEvent.click(screen.getByTestId('perps-close-position-modal-submit'));

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsClosePosition',
          [
            expect.objectContaining({
              symbol: basePosition.symbol,
              orderType: 'limit',
              price: '3000.25',
              position: basePosition,
            }),
          ],
        );
      });
      const params = mockSubmitRequestToBackground.mock.calls.find(
        ([method]) => method === 'perpsClosePosition',
      )?.[1][0];
      expect(params).not.toHaveProperty('size');
      expect(params).not.toHaveProperty('currentPrice');
      expect(params).not.toHaveProperty('usdAmount');
      expect(params).not.toHaveProperty('priceAtCalculation');
      expect(params).not.toHaveProperty('maxSlippageBps');
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'perpsToastOrderPlaced' }),
      );
      expect(mockReplacePerpsToastByKey).not.toHaveBeenCalledWith(
        expect.objectContaining({ key: 'perpsToastTradeSuccess' }),
      );
    });

    it('submits a formatted partial size for limit closes', async () => {
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
          markPrice={2900}
          sizeDecimals={4}
        />,
        createCloseLimitEnabledStore(),
      );

      enterLimitPrice('3000');
      const slider = within(
        screen.getByTestId('close-amount-slider-pct-100'),
      ).getByRole('slider');
      fireEvent.change(slider, { target: { value: '50' } });
      fireEvent.click(screen.getByTestId('perps-close-position-modal-submit'));

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsClosePosition',
          [
            expect.objectContaining({
              orderType: 'limit',
              price: '3000',
              size: '1.2500',
            }),
          ],
        );
      });
    });

    it('shows a placement failure for a rejected full limit close', async () => {
      mockSubmitRequestToBackground.mockResolvedValue({
        success: false,
        error: 'limit_order_failed',
      });

      await submitLimitClose({ partial: false });

      expect(mockReplacePerpsToastByKey).toHaveBeenNthCalledWith(2, {
        key: 'perpsToastLimitCloseFailed',
        description: tEn('perpsToastPositionStillActive'),
      });
      expect(mockReplacePerpsToastByKey).not.toHaveBeenCalledWith(
        expect.objectContaining({ key: 'perpsToastCloseFailed' }),
      );
    });

    it('shows a placement failure for a rejected partial limit close', async () => {
      mockSubmitRequestToBackground.mockResolvedValue({
        success: false,
        error: 'limit_order_failed',
      });

      await submitLimitClose({ partial: true });

      expect(mockReplacePerpsToastByKey).toHaveBeenNthCalledWith(2, {
        key: 'perpsToastPartialLimitCloseFailed',
        description: tEn('perpsToastPositionStillActive'),
      });
      expect(mockReplacePerpsToastByKey).not.toHaveBeenCalledWith(
        expect.objectContaining({ key: 'perpsToastPartialCloseFailed' }),
      );
    });

    it('shows one placement failure when a full limit close throws', async () => {
      mockSubmitRequestToBackground.mockRejectedValue(
        new Error('network error'),
      );

      await submitLimitClose({ partial: false });

      expect(mockReplacePerpsToastByKey).toHaveBeenNthCalledWith(2, {
        key: 'perpsToastLimitCloseFailed',
        description: tEn('perpsToastPositionStillActive'),
      });
    });

    it('shows one placement failure when a partial limit close throws', async () => {
      mockSubmitRequestToBackground.mockRejectedValue(
        new Error('network error'),
      );

      await submitLimitClose({ partial: true });

      expect(mockReplacePerpsToastByKey).toHaveBeenNthCalledWith(2, {
        key: 'perpsToastPartialLimitCloseFailed',
        description: tEn('perpsToastPositionStillActive'),
      });
    });

    it('uses limit price for partial minimum notional validation', () => {
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={{ ...basePosition, size: '1' }}
          currentPrice={100}
          markPrice={100}
        />,
        createCloseLimitEnabledStore(),
      );

      enterLimitPrice('5');
      const slider = within(
        screen.getByTestId('close-amount-slider-pct-100'),
      ).getByRole('slider');
      fireEvent.change(slider, { target: { value: '50' } });

      expect(
        screen.getByText(PARTIAL_MIN_NOTIONAL_MESSAGE),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('perps-close-position-modal-submit'),
      ).toBeDisabled();
    });

    it('shows oracle deviation errors and revalidates live mark prices', () => {
      const store = createCloseLimitEnabledStore();
      const { rerender } = renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
          markPrice={2900}
        />,
        store,
      );

      enterLimitPrice('3000');
      expect(
        screen.getByTestId('perps-close-position-modal-submit'),
      ).toBeEnabled();

      rerender(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
          markPrice={100000}
        />,
      );

      expect(
        screen.getByText(tEn('perpsCloseLimitPriceOutsideOracleBand')),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('perps-close-position-modal-submit'),
      ).toBeDisabled();
    });

    it('shows price unavailable when no valid limit reference price exists', () => {
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={NaN}
          markPrice={NaN}
          midPrice={NaN}
        />,
        createCloseLimitEnabledStore(),
      );

      enterLimitPrice('3000');

      expect(
        screen.getByText(tEn('perpsClosePriceUnavailable')),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(tEn('perpsCloseLimitPriceOutsideOracleBand')),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId('perps-close-position-modal-submit'),
      ).toBeDisabled();
    });

    it('forces Market behavior when the flag is disabled mid-session', async () => {
      const store = createCloseLimitEnabledStore();
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
          markPrice={2900}
        />,
        store,
      );
      enterLimitPrice('3000');

      const currentState = store.getState();
      store.dispatch({
        type: 'UPDATE_METAMASK_STATE',
        value: {
          ...currentState.metamask,
          remoteFeatureFlags: {
            ...currentState.metamask.remoteFeatureFlags,
            perpsClosePositionLimitOrderEnabled: false,
          },
        },
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('order-type-toggle'),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId('limit-price-input'),
        ).not.toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('perps-close-position-modal-submit'));

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsClosePosition',
          [
            expect.objectContaining({
              orderType: 'market',
              currentPrice: 2900,
            }),
          ],
        );
      });
    });

    it('recalculates long and short limit PnL and margin', () => {
      const store = createCloseLimitEnabledStore();
      const { unmount } = renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
          markPrice={2900}
        />,
        store,
      );
      enterLimitPrice('3200');
      expect(
        screen.getByTestId('perps-close-summary-margin-value'),
      ).toHaveTextContent('$2,875');
      expect(screen.getByText('+$875.00')).toBeInTheDocument();
      unmount();

      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={mockPositions[1]}
          currentPrice={45000}
          markPrice={45000}
        />,
        createCloseLimitEnabledStore(),
      );
      enterLimitPrice('46000');
      expect(
        screen.getByTestId('perps-close-summary-margin-value'),
      ).toHaveTextContent('$1,250');
      expect(screen.getByText('-$500.00')).toBeInTheDocument();
    });

    it('calculates losing long and profitable short limit PnL', () => {
      const { unmount } = renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
          markPrice={2900}
        />,
        createCloseLimitEnabledStore(),
      );
      enterLimitPrice('2800');
      expect(screen.getByText('-$125.00')).toBeInTheDocument();
      unmount();

      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={mockPositions[1]}
          currentPrice={45000}
          markPrice={45000}
        />,
        createCloseLimitEnabledStore(),
      );
      enterLimitPrice('44000');
      expect(screen.getByText('+$500.00')).toBeInTheDocument();
    });

    it('applies the close fraction to limit PnL, margin, fees, and receive', () => {
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
          markPrice={2900}
        />,
        createCloseLimitEnabledStore(),
      );
      enterLimitPrice('3200');
      const slider = within(
        screen.getByTestId('close-amount-slider-pct-100'),
      ).getByRole('slider');
      fireEvent.change(slider, { target: { value: '50' } });

      expect(
        screen.getByTestId('perps-close-summary-margin-value'),
      ).toHaveTextContent('$1,437.5');
      expect(screen.getByText('+$437.50')).toBeInTheDocument();

      const parseUsd = (element: HTMLElement) =>
        Number.parseFloat(element.textContent?.replace(/[^0-9.]/gu, '') ?? '0');
      const marginValue = parseUsd(
        screen.getByTestId('perps-close-summary-margin-value'),
      );
      const feesValue = parseUsd(
        screen.getByTestId('perps-close-summary-fees-value'),
      );
      const receiveValue = parseUsd(
        screen.getByTestId('perps-close-summary-receive-value'),
      );
      expect(receiveValue).toBeCloseTo(marginValue - feesValue, 2);
    });

    it('uses stable maker fee-rate inputs while price and amount change', () => {
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
          markPrice={2900}
        />,
        createCloseLimitEnabledStore(),
      );
      enterLimitPrice('3200');
      const slider = within(
        screen.getByTestId('close-amount-slider-pct-100'),
      ).getByRole('slider');
      fireEvent.change(slider, { target: { value: '50' } });

      expect(mockUsePerpsOrderFees).toHaveBeenLastCalledWith({
        symbol: basePosition.symbol,
        orderType: 'limit',
        isMaker: true,
      });
      expect(
        mockUsePerpsOrderFees.mock.calls.every(
          ([options]) => !Object.hasOwn(options, 'amount'),
        ),
      ).toBe(true);
    });
  });

  describe('geo-blocking', () => {
    it('shows geo-block modal instead of closing when user is not eligible', async () => {
      mockUsePerpsEligibility.mockReturnValue({ isEligible: false });

      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
        />,
        mockStore,
      );

      const submitButton = screen.getByTestId(
        'perps-close-position-modal-submit',
      );
      expect(submitButton).toBeEnabled();

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument();
      });
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });
  });

  describe('receive amount calculation', () => {
    it('computes "You\'ll receive" as margin minus fees without double-counting PnL', () => {
      // Verify the formula: receive = round2(margin) - round2(fees), with no unrealizedPnl added.
      // HyperLiquid's marginUsed already includes accumulated PnL, so adding unrealizedPnl
      // would double-count it. We assert the relationship between the three displayed values
      // rather than a hardcoded amount so the test stays valid as the fee rate changes.
      renderWithProvider(
        <ClosePositionModal
          isOpen
          onClose={jest.fn()}
          position={basePosition}
          currentPrice={2900}
        />,
        mockStore,
      );

      const parseUsd = (el: HTMLElement) =>
        parseFloat(el.textContent?.replace(/[^0-9.]/gu, '') ?? '0');

      const marginValue = parseUsd(
        screen.getByTestId('perps-close-summary-margin-value'),
      );
      const feesValue = parseUsd(
        screen.getByTestId('perps-close-summary-fees-value'),
      );
      const receiveValue = parseUsd(
        screen.getByTestId('perps-close-summary-receive-value'),
      );

      // displayed margin − displayed fees must equal displayed receive (additive breakdown)
      expect(receiveValue).toBeCloseTo(marginValue - feesValue, 2);
      // sanity: margin must be positive and must NOT include an extra pnl on top
      // (basePosition: marginUsed=2375, unrealizedPnl=375 — receive should be ~2375-fees, not ~2750-fees)
      expect(marginValue).toBe(2375);
    });
  });

  describe('MetaMask fee discount', () => {
    it('does not show discounted fee when no discount is active', () => {
      mockUsePerpsOrderFees.mockReturnValue({
        feeRate: 0.00145,
        undiscountedFeeRate: 0.00145,
        isLoading: false,
        metamaskFeeRateDiscountPercentage: undefined,
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

      expect(
        screen.queryByTestId('perps-close-summary-fees-value-original'),
      ).not.toBeInTheDocument();
    });

    it('shows strikethrough original and discounted fee when a discount is active', () => {
      mockUsePerpsOrderFees.mockReturnValue({
        feeRate: 0.00045 + 0.0005, // protocol + half-off builder (discounted)
        undiscountedFeeRate: 0.00145, // protocol + full builder
        isLoading: false,
        metamaskFeeRateDiscountPercentage: 50,
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

      expect(
        screen.getByTestId('perps-close-summary-fees-value-original'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('perps-close-summary-fees-value'),
      ).toBeInTheDocument();
    });

    it('does not show discounted fee while feeRate is unavailable', () => {
      mockUsePerpsOrderFees.mockReturnValue({
        feeRate: undefined,
        undiscountedFeeRate: undefined,
        isLoading: true,
        metamaskFeeRateDiscountPercentage: 50,
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

      expect(
        screen.queryByTestId('perps-close-summary-fees-value-original'),
      ).not.toBeInTheDocument();
    });
  });
});
