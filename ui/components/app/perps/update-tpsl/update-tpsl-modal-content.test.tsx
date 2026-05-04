import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { mockPositions } from '../mocks';
import {
  UpdateTPSLModalContent,
  type UpdateTPSLSubmitState,
} from './update-tpsl-modal-content';

const mockSubmitRequestToBackground = jest.fn();
const mockGetPerpsStreamManager = jest.fn();
const mockReplacePerpsToastByKey = jest.fn();

jest.mock('../../../../providers/perps', () => ({
  getPerpsStreamManager: () => mockGetPerpsStreamManager(),
}));

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

const mockUsePerpsEligibility = jest.fn(() => ({ isEligible: true }));
jest.mock('../../../../hooks/perps/usePerpsEligibility', () => ({
  usePerpsEligibility: () => mockUsePerpsEligibility(),
}));

jest.mock('../../../../hooks/perps/usePerpsOrderFees', () => ({
  usePerpsOrderFees: () => ({
    feeRate: 0.00145,
    isLoading: false,
    hasError: false,
  }),
}));

jest.mock('../perps-toast', () => ({
  usePerpsToast: () => ({
    replacePerpsToastByKey: mockReplacePerpsToastByKey,
  }),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const positionWithTPSL = mockPositions[0]; // ETH: entry=2850, leverage=3, TP=3200.00, SL=2600.00, size=2.5 (long)
const positionWithoutTPSL = mockPositions[2]; // SOL: TP=undefined, SL=undefined

const defaultProps = {
  position: positionWithTPSL,
  currentPrice: 2900,
  onClose: jest.fn(),
};

/**
 * Mirrors UpdateTPSLModal footer so unit tests can reach the primary action
 * @param props
 */
const TpslContentWithTestFooter: React.FC<
  React.ComponentProps<typeof UpdateTPSLModalContent>
> = (props) => {
  const [submitState, setSubmitState] =
    React.useState<UpdateTPSLSubmitState | null>(null);
  return (
    <>
      <UpdateTPSLModalContent {...props} onSubmitStateChange={setSubmitState} />
      {submitState ? (
        <button
          type="button"
          data-testid="perps-update-tpsl-modal-submit"
          onClick={submitState.onSubmit}
          disabled={submitState.submitDisabled}
          title={submitState.submitButtonTitle}
        >
          {submitState.isSaving
            ? messages.perpsSubmitting.message
            : messages.perpsSaveChanges.message}
        </button>
      ) : null}
    </>
  );
};

function renderTpslModalContent(
  props: Partial<React.ComponentProps<typeof UpdateTPSLModalContent>> = {},
) {
  return renderWithProvider(
    <TpslContentWithTestFooter {...defaultProps} {...props} />,
    mockStore,
  );
}

describe('UpdateTPSLModalContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsEligibility.mockReturnValue({ isEligible: true });
    mockReplacePerpsToastByKey.mockReset();
    mockSubmitRequestToBackground.mockImplementation((method: string) => {
      if (method === 'perpsUpdatePositionTPSL') {
        return Promise.resolve({ success: true });
      }
      if (method === 'perpsGetPositions') {
        return Promise.resolve(mockPositions);
      }
      return Promise.resolve({ success: true });
    });
    mockGetPerpsStreamManager.mockReturnValue({
      setOptimisticTPSL: jest.fn(),
      positions: {
        getCachedData: jest.fn().mockReturnValue(mockPositions),
        pushData: jest.fn(),
      },
      pushPositionsWithOverrides: jest.fn(),
    });
  });

  describe('rendering', () => {
    it('renders Take Profit and Stop Loss sections', () => {
      renderTpslModalContent();

      expect(
        screen.getByText(messages.perpsTakeProfit.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsStopLoss.message),
      ).toBeInTheDocument();
    });

    it('renders TP preset buttons', () => {
      renderTpslModalContent();

      expect(screen.getByText('+10%')).toBeInTheDocument();
      expect(screen.getByText('+25%')).toBeInTheDocument();
      expect(screen.getByText('+50%')).toBeInTheDocument();
      expect(screen.getByText('+100%')).toBeInTheDocument();
    });

    it('renders SL preset buttons matching mobile (-5%, -10%, -25%, -50%)', () => {
      renderTpslModalContent();

      expect(screen.getByText('-5%')).toBeInTheDocument();
      expect(screen.getByText('-10%')).toBeInTheDocument();
      expect(screen.getByText('-25%')).toBeInTheDocument();
      expect(screen.getByText('-50%')).toBeInTheDocument();
    });

    it('renders the save button', () => {
      renderTpslModalContent();

      expect(
        screen.getByText(messages.perpsSaveChanges.message),
      ).toBeInTheDocument();
    });

    it('renders four text inputs (TP price, TP %, SL price, SL %)', () => {
      renderTpslModalContent();

      const priceInputs = screen.getAllByPlaceholderText('0.00');
      const percentInputs = screen.getAllByPlaceholderText('0');
      expect(priceInputs).toHaveLength(2);
      expect(percentInputs).toHaveLength(2);
    });
  });

  describe('initialization', () => {
    it('initializes TP/SL prices from position data', () => {
      renderTpslModalContent();

      const priceInputs = screen.getAllByPlaceholderText('0.00');
      const tpInput = priceInputs[0] as HTMLInputElement;
      const slInput = priceInputs[1] as HTMLInputElement;

      expect(tpInput.value).toBe('3200.00');
      expect(slInput.value).toBe('2600.00');
    });

    it('initializes with empty inputs when position has no TP/SL', () => {
      renderTpslModalContent({ position: positionWithoutTPSL });

      const priceInputs = screen.getAllByPlaceholderText('0.00');
      const tpInput = priceInputs[0] as HTMLInputElement;
      const slInput = priceInputs[1] as HTMLInputElement;

      expect(tpInput.value).toBe('');
      expect(slInput.value).toBe('');
    });

    it('does not reset TP/SL fields when position updates with the same symbol', () => {
      const { rerender } = renderWithProvider(
        <TpslContentWithTestFooter {...defaultProps} />,
        mockStore,
      );

      const tpInput = screen.getAllByPlaceholderText(
        '0.00',
      )[0] as HTMLInputElement;
      const slInput = screen.getAllByPlaceholderText(
        '0.00',
      )[1] as HTMLInputElement;
      fireEvent.change(tpInput, { target: { value: '4000' } });
      fireEvent.change(slInput, { target: { value: '2500' } });

      const polledPosition = {
        ...positionWithTPSL,
        unrealizedPnl: '400.00',
        stopLossPrice: undefined,
        takeProfitPrice: undefined,
      };
      rerender(
        <TpslContentWithTestFooter
          {...defaultProps}
          position={polledPosition}
        />,
      );

      expect(
        (screen.getAllByPlaceholderText('0.00')[0] as HTMLInputElement).value,
      ).toBe('4000');
      expect(
        (screen.getAllByPlaceholderText('0.00')[1] as HTMLInputElement).value,
      ).toBe('2500');
    });
  });

  describe('estimated P&L', () => {
    it('shows estimated P&L at take profit and stop loss when prices are set', () => {
      renderTpslModalContent();

      expect(
        screen.getByTestId('perps-update-tpsl-estimated-tp-pnl-row'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('perps-update-tpsl-estimated-sl-pnl-row'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsEstimatedPnlAtTakeProfit.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsEstimatedPnlAtStopLoss.message),
      ).toBeInTheDocument();
    });

    it('hides estimated P&L rows when TP/SL prices are cleared', () => {
      renderTpslModalContent({ position: positionWithoutTPSL });

      expect(
        screen.queryByTestId('perps-update-tpsl-estimated-tp-pnl-row'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('perps-update-tpsl-estimated-sl-pnl-row'),
      ).not.toBeInTheDocument();
    });
  });

  describe('presets (RoE% with leverage)', () => {
    it('sets TP price correctly for a +25% RoE preset on a long position', () => {
      // ETH: entry=2850, leverage=3 (long)
      // targetPrice = 2850 * (1 + 25/(3*100)) = 2850 * 1.0833 = 3087.50
      renderTpslModalContent();

      fireEvent.click(screen.getByText('+25%'));

      const tpInput = screen.getAllByPlaceholderText(
        '0.00',
      )[0] as HTMLInputElement;
      const tpPercentInput = screen.getByTestId(
        'perps-update-tpsl-tp-percent-input',
      ) as HTMLInputElement;
      const numValue = parseFloat(tpInput.value.replace(/,/gu, ''));
      expect(numValue).toBeGreaterThan(0);
      expect(numValue).toBeCloseTo(3087.5, 0);
      expect(tpPercentInput.value).toBe('+25');
    });

    it('sets SL price correctly for a -25% RoE preset on a long position', () => {
      // ETH: entry=2850, leverage=3 (long)
      // targetPrice = 2850 * (1 - 25/(3*100)) = 2850 * 0.9167 = 2612.50
      renderTpslModalContent();

      fireEvent.click(screen.getByText('-25%'));

      const slInput = screen.getAllByPlaceholderText(
        '0.00',
      )[1] as HTMLInputElement;
      const numValue = parseFloat(slInput.value.replace(/,/gu, ''));
      expect(numValue).toBeGreaterThan(0);
      expect(numValue).toBeCloseTo(2612.5, 0);
    });
  });

  describe('price input', () => {
    it('allows typing a TP price directly', () => {
      renderTpslModalContent();

      const tpInput = screen.getAllByPlaceholderText('0.00')[0];
      fireEvent.change(tpInput, { target: { value: '3500' } });

      expect((tpInput as HTMLInputElement).value).toBe('3500');
    });

    it('allows clearing the TP price input', () => {
      renderTpslModalContent();

      const tpInput = screen.getAllByPlaceholderText('0.00')[0];
      fireEvent.change(tpInput, { target: { value: '' } });

      expect((tpInput as HTMLInputElement).value).toBe('');
    });

    it('allows typing a SL price directly', () => {
      renderTpslModalContent();

      const slInput = screen.getAllByPlaceholderText('0.00')[1];
      fireEvent.change(slInput, { target: { value: '2500' } });

      expect((slInput as HTMLInputElement).value).toBe('2500');
    });

    it('rejects non-numeric characters in TP price input', () => {
      renderTpslModalContent({ position: positionWithoutTPSL });

      const tpInput = screen.getAllByPlaceholderText('0.00')[0];
      fireEvent.change(tpInput, { target: { value: 'abc' } });

      expect((tpInput as HTMLInputElement).value).toBe('');
    });

    it('rejects non-numeric characters in SL price input', () => {
      renderTpslModalContent({ position: positionWithoutTPSL });

      const slInput = screen.getAllByPlaceholderText('0.00')[1];
      fireEvent.change(slInput, { target: { value: 'xyz' } });

      expect((slInput as HTMLInputElement).value).toBe('');
    });

    it('does not reformat TP price on blur when input is empty', () => {
      renderTpslModalContent({ position: positionWithoutTPSL });

      const tpInput = screen.getAllByPlaceholderText('0.00')[0];
      fireEvent.blur(tpInput);

      expect((tpInput as HTMLInputElement).value).toBe('');
    });

    it('does not reformat SL price on blur when input is empty', () => {
      renderTpslModalContent({ position: positionWithoutTPSL });

      const slInput = screen.getAllByPlaceholderText('0.00')[1];
      fireEvent.blur(slInput);

      expect((slInput as HTMLInputElement).value).toBe('');
    });

    it('formats the TP price on blur', () => {
      renderTpslModalContent({ position: positionWithoutTPSL });

      const tpInput = screen.getAllByPlaceholderText('0.00')[0];
      fireEvent.change(tpInput, { target: { value: '3500' } });
      fireEvent.blur(tpInput);

      const formatted = (tpInput as HTMLInputElement).value;
      expect(formatted).toContain('3');
      expect(formatted).toContain('500');
    });

    it('formats the SL price on blur', () => {
      renderTpslModalContent({ position: positionWithoutTPSL });

      const slInput = screen.getAllByPlaceholderText('0.00')[1];
      fireEvent.change(slInput, { target: { value: '2500' } });
      fireEvent.blur(slInput);

      const formatted = (slInput as HTMLInputElement).value;
      expect(formatted).toContain('2');
      expect(formatted).toContain('500');
    });
  });

  describe('validation', () => {
    it('shows a liquidation error and disables save when long SL is below liquidation price', () => {
      renderTpslModalContent({
        position: {
          ...positionWithTPSL,
          stopLossPrice: '2300',
        },
        currentPrice: 2900,
      });

      expect(screen.getByTestId('sl-validation-error')).toHaveTextContent(
        /above.*liquidation/iu,
      );
      expect(
        screen.getByTestId('perps-update-tpsl-modal-submit'),
      ).toBeDisabled();
    });

    it('shows a liquidation error and disables save when short SL is above liquidation price', () => {
      renderTpslModalContent({
        position: {
          ...mockPositions[1],
          stopLossPrice: '49000',
        },
        currentPrice: 47000,
      });

      expect(screen.getByTestId('sl-validation-error')).toHaveTextContent(
        /below.*liquidation/iu,
      );
      expect(
        screen.getByTestId('perps-update-tpsl-modal-submit'),
      ).toBeDisabled();
    });
  });

  describe('percent input (RoE%)', () => {
    it('updates TP price when a RoE% value is typed', () => {
      // ETH: entry=2850, leverage=3, +50% RoE -> 2850 * (1 + 50/300) = 2850 * 1.1667 = 3325
      renderTpslModalContent();

      const percentInputs = screen.getAllByPlaceholderText('0');
      const tpPercentInput = percentInputs[0];
      fireEvent.focus(tpPercentInput);
      fireEvent.change(tpPercentInput, { target: { value: '50' } });

      const tpPriceInput = screen.getAllByPlaceholderText(
        '0.00',
      )[0] as HTMLInputElement;
      const numValue = parseFloat(tpPriceInput.value.replace(/,/gu, ''));
      expect(numValue).toBeCloseTo(3325, 0);
    });

    it('updates SL price when a negative RoE% is typed (signed convention)', () => {
      // ETH: entry=2850, leverage=3, -50% signed RoE -> 2850 * (1 + (-50)/300) = 2850 * 0.8333 = 2375
      renderTpslModalContent();

      const percentInputs = screen.getAllByPlaceholderText('0');
      const slPercentInput = percentInputs[1];
      fireEvent.focus(slPercentInput);
      fireEvent.change(slPercentInput, { target: { value: '-50' } });

      const slPriceInput = screen.getAllByPlaceholderText(
        '0.00',
      )[1] as HTMLInputElement;
      const numValue = parseFloat(slPriceInput.value.replace(/,/gu, ''));
      expect(numValue).toBeCloseTo(2375, 0);
    });

    it('updates SL price when an explicit positive RoE% is typed (SL above entry)', () => {
      // SOL: entry=95, leverage=10, +15% signed RoE -> 95 * (1 + 15/1000) = 95 * 1.015 = 96.425
      renderTpslModalContent({ position: positionWithoutTPSL });

      const percentInputs = screen.getAllByPlaceholderText('0');
      const slPercentInput = percentInputs[1];
      fireEvent.focus(slPercentInput);
      fireEvent.change(slPercentInput, { target: { value: '+15' } });

      const slPriceInput = screen.getAllByPlaceholderText(
        '0.00',
      )[1] as HTMLInputElement;
      const numValue = parseFloat(slPriceInput.value.replace(/,/gu, ''));
      expect(numValue).toBeCloseTo(96.425, 0);
    });

    it('preserves the positive sign after blurring an explicit positive SL RoE%', () => {
      renderTpslModalContent({ position: positionWithoutTPSL });

      const slPercentInput = screen.getByTestId(
        'perps-update-tpsl-sl-percent-input',
      ) as HTMLInputElement;
      fireEvent.focus(slPercentInput);
      fireEvent.change(slPercentInput, { target: { value: '+15' } });
      fireEvent.blur(slPercentInput);

      expect(slPercentInput.value).toMatch(/^\+/u);
    });

    it('preserves the negative sign after blurring an explicit negative TP RoE%', () => {
      renderTpslModalContent({ position: positionWithoutTPSL });

      const tpPercentInput = screen.getByTestId(
        'perps-update-tpsl-tp-percent-input',
      ) as HTMLInputElement;
      fireEvent.focus(tpPercentInput);
      fireEvent.change(tpPercentInput, { target: { value: '-15' } });
      fireEvent.blur(tpPercentInput);

      expect(tpPercentInput.value).toMatch(/^-/u);
    });

    it('defaults unsigned SL RoE% input to negative', () => {
      // SOL: entry=95, leverage=10, defaulted -10% signed RoE -> 95 * 0.99 = 94.05
      renderTpslModalContent({ position: positionWithoutTPSL });

      const percentInputs = screen.getAllByPlaceholderText('0');
      const slPercentInput = percentInputs[1];
      fireEvent.focus(slPercentInput);
      fireEvent.change(slPercentInput, { target: { value: '10' } });

      const slPriceInput = screen.getAllByPlaceholderText(
        '0.00',
      )[1] as HTMLInputElement;
      const numValue = parseFloat(slPriceInput.value.replace(/,/gu, ''));
      expect(numValue).toBeCloseTo(94.05, 0);
    });

    it('clears TP price when percent input is cleared', () => {
      renderTpslModalContent();

      const tpPercentInput = screen.getAllByPlaceholderText('0')[0];
      fireEvent.focus(tpPercentInput);
      fireEvent.change(tpPercentInput, { target: { value: '' } });

      const tpPriceInput = screen.getAllByPlaceholderText(
        '0.00',
      )[0] as HTMLInputElement;
      expect(tpPriceInput.value).toBe('');
    });

    it('clears TP price when only a minus sign is typed in percent input', () => {
      renderTpslModalContent();

      const tpPercentInput = screen.getAllByPlaceholderText('0')[0];
      fireEvent.focus(tpPercentInput);
      fireEvent.change(tpPercentInput, { target: { value: '-' } });

      const tpPriceInput = screen.getAllByPlaceholderText(
        '0.00',
      )[0] as HTMLInputElement;
      expect(tpPriceInput.value).toBe('');
    });

    it('clears SL price when only a minus sign is typed in SL percent input', () => {
      renderTpslModalContent();

      const slPercentInput = screen.getAllByPlaceholderText('0')[1];
      fireEvent.focus(slPercentInput);
      fireEvent.change(slPercentInput, { target: { value: '-' } });

      const slPriceInput = screen.getAllByPlaceholderText(
        '0.00',
      )[1] as HTMLInputElement;
      expect(slPriceInput.value).toBe('');
    });

    it('clears TP price when only a plus sign is typed in TP percent input', () => {
      renderTpslModalContent();

      const tpPercentInput = screen.getAllByPlaceholderText('0')[0];
      fireEvent.focus(tpPercentInput);
      fireEvent.change(tpPercentInput, { target: { value: '+' } });

      const tpPriceInput = screen.getAllByPlaceholderText(
        '0.00',
      )[0] as HTMLInputElement;
      expect(tpPriceInput.value).toBe('');
    });

    it('clears SL price when only a plus sign is typed in SL percent input', () => {
      renderTpslModalContent();

      const slPercentInput = screen.getAllByPlaceholderText('0')[1];
      fireEvent.focus(slPercentInput);
      fireEvent.change(slPercentInput, { target: { value: '+' } });

      const slPriceInput = screen.getAllByPlaceholderText(
        '0.00',
      )[1] as HTMLInputElement;
      expect(slPriceInput.value).toBe('');
    });

    it('accepts + prefix in TP percent input', () => {
      // SOL: entry=95, leverage=10. +25% signed RoE -> 95*(1+25/1000) = 95*1.025 = 97.375
      renderTpslModalContent({ position: positionWithoutTPSL });

      const tpPercentInput = screen.getAllByPlaceholderText('0')[0];
      fireEvent.focus(tpPercentInput);
      fireEvent.change(tpPercentInput, { target: { value: '+25' } });

      const tpPriceInput = screen.getAllByPlaceholderText(
        '0.00',
      )[0] as HTMLInputElement;
      const numValue = parseFloat(tpPriceInput.value.replace(/,/gu, ''));
      expect(numValue).toBeCloseTo(97.375, 0);
    });

    it('shows raw input while SL percent is focused and formatted value after blur', () => {
      // SOL: entry=95, leverage=10. Typing +10 (SL above entry for lock-in-profit scenario)
      // -> price = 95*(1+10/1000) = 95.95 -> blur shows priceToPercent("95.95") for long
      // -> (95.95-95)/95*10*100 = 10 -> "+10"
      renderTpslModalContent({ position: positionWithoutTPSL });

      const slPercentInput = screen.getAllByPlaceholderText('0')[1];
      fireEvent.focus(slPercentInput);
      fireEvent.change(slPercentInput, { target: { value: '+10' } });

      expect((slPercentInput as HTMLInputElement).value).toBe('+10');

      fireEvent.blur(slPercentInput);

      const blurredValue = (slPercentInput as HTMLInputElement).value;
      // After blur, shows signed RoE: positive percent keeps the explicit profit sign.
      expect(blurredValue).toMatch(/^\+\d+(\.\d+)?$/u);
    });

    it('normalizes leading-zero SL percent input before defaulting to negative', () => {
      // SOL: entry=95, leverage=10. 011 normalizes to -11% signed RoE
      // -> 95*(1-11/1000) = 93.955
      renderTpslModalContent({ position: positionWithoutTPSL });

      const slPercentInput = screen.getAllByPlaceholderText('0')[1];
      fireEvent.focus(slPercentInput);
      fireEvent.change(slPercentInput, { target: { value: '011' } });

      expect((slPercentInput as HTMLInputElement).value).toBe('-11');

      const slPriceInput = screen.getAllByPlaceholderText(
        '0.00',
      )[1] as HTMLInputElement;
      const numValue = parseFloat(slPriceInput.value.replace(/,/gu, ''));
      expect(numValue).toBeCloseTo(93.955, 0);
    });

    it('rejects non-numeric characters in TP percent input', () => {
      renderTpslModalContent({ position: positionWithoutTPSL });

      const tpPercentInput = screen.getAllByPlaceholderText('0')[0];
      fireEvent.focus(tpPercentInput);
      fireEvent.change(tpPercentInput, { target: { value: 'abc' } });

      expect((tpPercentInput as HTMLInputElement).value).toBe('');
    });

    it('does not insert a decimal point when typing a whole number like 15', () => {
      renderTpslModalContent({ position: positionWithoutTPSL });

      const tpPercentInput = screen.getAllByPlaceholderText('0')[0];
      fireEvent.focus(tpPercentInput);

      // Simulate typing "1" then "5" (each keystroke replaces full value in testing)
      fireEvent.change(tpPercentInput, { target: { value: '1' } });
      expect((tpPercentInput as HTMLInputElement).value).toBe('1');

      fireEvent.change(tpPercentInput, { target: { value: '15' } });
      expect((tpPercentInput as HTMLInputElement).value).toBe('15');
    });

    it('shows raw input while focused and formatted value after blur', () => {
      renderTpslModalContent({ position: positionWithoutTPSL });

      const tpPercentInput = screen.getAllByPlaceholderText('0')[0];
      fireEvent.focus(tpPercentInput);
      fireEvent.change(tpPercentInput, { target: { value: '25' } });

      // While focused: shows raw typed value
      expect((tpPercentInput as HTMLInputElement).value).toBe('25');

      fireEvent.blur(tpPercentInput);

      // After blur: shows derived signed RoE value
      // SOL: entry=95, leverage=10
      // price = 95 * (1 + 25/1000) = 95 * 1.025 = 97.375 -> formatted as "97.38"
      // priceToPercent('97.38', long): (97.38-95)/95 * 10 * 100 = 25.05 -> "25.05"
      const blurredValue = (tpPercentInput as HTMLInputElement).value;
      expect(blurredValue).toMatch(/^[+-]?\d+(\.\d+)?$/u);
    });
  });

  describe('submit', () => {
    it('calls perpsUpdatePositionTPSL and onClose on successful save', async () => {
      const onClose = jest.fn();

      renderTpslModalContent({ onClose });

      const saveButton = screen.getByText(messages.perpsSaveChanges.message);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsUpdatePositionTPSL',
          [
            {
              symbol: positionWithTPSL.symbol,
              takeProfitPrice: '3200.00',
              stopLossPrice: '2600.00',
            },
          ],
        );
      });
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('sends undefined for empty TP/SL prices (clearing them)', async () => {
      renderTpslModalContent({ position: positionWithoutTPSL });

      const saveButton = screen.getByText(messages.perpsSaveChanges.message);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsUpdatePositionTPSL',
          [
            {
              symbol: positionWithoutTPSL.symbol,
              takeProfitPrice: undefined,
              stopLossPrice: undefined,
            },
          ],
        );
      });
    });

    it('performs optimistic update via stream manager on success', async () => {
      const setOptimisticTPSL = jest.fn();
      const pushData = jest.fn();
      mockGetPerpsStreamManager.mockReturnValue({
        setOptimisticTPSL,
        positions: {
          getCachedData: jest.fn().mockReturnValue(mockPositions),
          pushData,
        },
        pushPositionsWithOverrides: jest.fn(),
      });

      renderTpslModalContent();

      fireEvent.click(screen.getByText(messages.perpsSaveChanges.message));

      await waitFor(() => {
        expect(setOptimisticTPSL).toHaveBeenCalledWith(
          positionWithTPSL.symbol,
          '3200.00',
          '2600.00',
        );
        expect(pushData).toHaveBeenCalled();
      });
    });

    it('runs delayed refetch reconciliation after modal closes', async () => {
      jest.useFakeTimers();
      try {
        const pushPositionsWithOverrides = jest.fn();
        mockGetPerpsStreamManager.mockReturnValue({
          setOptimisticTPSL: jest.fn(),
          positions: {
            getCachedData: jest.fn().mockReturnValue(mockPositions),
            pushData: jest.fn(),
          },
          pushPositionsWithOverrides,
        });

        const onClose = jest.fn();
        const { unmount } = renderTpslModalContent({ onClose });
        onClose.mockImplementation(() => {
          unmount();
        });

        fireEvent.click(screen.getByText(messages.perpsSaveChanges.message));

        await waitFor(() => {
          expect(onClose).toHaveBeenCalledTimes(1);
        });

        await act(async () => {
          jest.advanceTimersByTime(2500);
        });

        await waitFor(() => {
          expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
            'perpsGetPositions',
            [{ skipCache: true }],
          );
        });
        await waitFor(() => {
          expect(pushPositionsWithOverrides).toHaveBeenCalledWith(
            mockPositions,
          );
        });
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('error handling', () => {
    it('shows toast error when perpsUpdatePositionTPSL fails', async () => {
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsUpdatePositionTPSL') {
          return Promise.resolve({ success: false, error: 'Server error' });
        }
        if (method === 'perpsGetPositions') {
          return Promise.resolve(mockPositions);
        }
        return Promise.resolve({ success: true });
      });

      renderTpslModalContent();

      fireEvent.click(screen.getByText(messages.perpsSaveChanges.message));

      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
          key: 'perpsToastUpdateFailed',
          description: 'Server error',
        });
      });
      expect(screen.queryByText('Server error')).not.toBeInTheDocument();
    });

    it('shows generic toast error when an exception is thrown', async () => {
      mockSubmitRequestToBackground.mockRejectedValue(
        new Error('Network failure'),
      );

      renderTpslModalContent();

      fireEvent.click(screen.getByText(messages.perpsSaveChanges.message));

      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
          key: 'perpsToastUpdateFailed',
          description: 'Network failure',
        });
      });
      expect(screen.queryByText('Network failure')).not.toBeInTheDocument();
    });

    it('shows fallback toast when result.error is empty', async () => {
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsUpdatePositionTPSL') {
          return Promise.resolve({ success: false });
        }
        return Promise.resolve(mockPositions);
      });

      renderTpslModalContent();

      fireEvent.click(screen.getByText(messages.perpsSaveChanges.message));

      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
          key: 'perpsToastUpdateFailed',
          description: 'Failed to update TP/SL',
        });
      });
    });

    it('shows fallback message when a non-Error value is thrown', async () => {
      mockSubmitRequestToBackground.mockRejectedValue('string-error');

      renderTpslModalContent();

      fireEvent.click(screen.getByText(messages.perpsSaveChanges.message));

      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
          key: 'perpsToastUpdateFailed',
          description: 'An unknown error occurred',
        });
      });
    });

    it('does not call onClose when save fails', async () => {
      const onClose = jest.fn();
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsUpdatePositionTPSL') {
          return Promise.resolve({ success: false, error: 'fail' });
        }
        if (method === 'perpsGetPositions') {
          return Promise.resolve(mockPositions);
        }
        return Promise.resolve({ success: true });
      });

      renderTpslModalContent({ onClose });

      fireEvent.click(screen.getByText(messages.perpsSaveChanges.message));

      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
          key: 'perpsToastUpdateFailed',
          description: 'fail',
        });
      });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('short position (RoE% with leverage)', () => {
    // mockPositions[1] is BTC with size=-0.5 (short), entry=45000, leverage=15
    const shortPosition = mockPositions[1];

    it('calculates TP preset correctly for a short position with RoE%', () => {
      // BTC short: entry=45000, leverage=15
      // +10% RoE -> short TP: 45000 * (1 - 10/(15*100)) = 45000 * 0.9933 = 44700
      renderTpslModalContent({
        position: shortPosition,
        currentPrice: 45000,
      });

      fireEvent.click(screen.getByText('+10%'));

      const tpInput = screen.getAllByPlaceholderText(
        '0.00',
      )[0] as HTMLInputElement;
      const numValue = parseFloat(tpInput.value.replace(/,/gu, ''));
      expect(numValue).toBeCloseTo(44700, 0);
    });

    it('calculates SL preset correctly for a short position with RoE%', () => {
      // BTC short: entry=45000, leverage=15
      // -10% RoE -> short SL: 45000 * (1 + 10/(15*100)) = 45000 * 1.0067 = 45300
      renderTpslModalContent({
        position: shortPosition,
        currentPrice: 45000,
      });

      fireEvent.click(screen.getByText('-10%'));

      const slInput = screen.getAllByPlaceholderText(
        '0.00',
      )[1] as HTMLInputElement;
      const numValue = parseFloat(slInput.value.replace(/,/gu, ''));
      expect(numValue).toBeCloseTo(45300, 0);
    });
  });

  describe('geo-blocking', () => {
    it('shows geo-block modal instead of saving when user is not eligible', async () => {
      mockUsePerpsEligibility.mockReturnValue({ isEligible: false });

      renderTpslModalContent();

      const submitButton = screen.getByTestId('perps-update-tpsl-modal-submit');
      expect(submitButton).toBeEnabled();

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument();
      });
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });
  });
});
