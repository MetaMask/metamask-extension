import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { mockPositions } from '../mocks';
import { UpdateTPSLModalContent } from './update-tpsl-modal-content';

const mockSubmitRequestToBackground = jest.fn();
const mockGetPerpsStreamManager = jest.fn();

jest.mock('../../../../providers/perps', () => ({
  getPerpsStreamManager: () => mockGetPerpsStreamManager(),
}));

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

jest.mock('../../../../hooks/perps/usePerpsEligibility', () => ({
  usePerpsEligibility: () => ({ isEligible: true }),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const positionWithTPSL = mockPositions[0]; // ETH: TP=3200.00, SL=2600.00, size=2.5 (long)
const positionWithoutTPSL = mockPositions[2]; // LINK: TP=undefined, SL=undefined

const defaultProps = {
  position: positionWithTPSL,
  currentPrice: 2900,
  onClose: jest.fn(),
};

describe('UpdateTPSLModalContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      renderWithProvider(
        <UpdateTPSLModalContent {...defaultProps} />,
        mockStore,
      );

      expect(
        screen.getByText(messages.perpsTakeProfit.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsStopLoss.message),
      ).toBeInTheDocument();
    });

    it('renders TP preset buttons', () => {
      renderWithProvider(
        <UpdateTPSLModalContent {...defaultProps} />,
        mockStore,
      );

      expect(screen.getByText('+10%')).toBeInTheDocument();
      expect(screen.getByText('+25%')).toBeInTheDocument();
      expect(screen.getByText('+50%')).toBeInTheDocument();
      expect(screen.getByText('+100%')).toBeInTheDocument();
    });

    it('renders SL preset buttons', () => {
      renderWithProvider(
        <UpdateTPSLModalContent {...defaultProps} />,
        mockStore,
      );

      expect(screen.getByText('-10%')).toBeInTheDocument();
      expect(screen.getByText('-25%')).toBeInTheDocument();
      expect(screen.getByText('-50%')).toBeInTheDocument();
      expect(screen.getByText('-75%')).toBeInTheDocument();
    });

    it('renders the save button', () => {
      renderWithProvider(
        <UpdateTPSLModalContent {...defaultProps} />,
        mockStore,
      );

      expect(
        screen.getByText(messages.perpsSaveChanges.message),
      ).toBeInTheDocument();
    });

    it('renders four text inputs (TP price, TP %, SL price, SL %)', () => {
      renderWithProvider(
        <UpdateTPSLModalContent {...defaultProps} />,
        mockStore,
      );

      const priceInputs = screen.getAllByPlaceholderText('0.00');
      const percentInputs = screen.getAllByPlaceholderText('0.0');
      expect(priceInputs).toHaveLength(2);
      expect(percentInputs).toHaveLength(2);
    });
  });

  describe('initialization', () => {
    it('initializes TP/SL prices from position data', () => {
      renderWithProvider(
        <UpdateTPSLModalContent {...defaultProps} />,
        mockStore,
      );

      const priceInputs = screen.getAllByPlaceholderText('0.00');
      const tpInput = priceInputs[0] as HTMLInputElement;
      const slInput = priceInputs[1] as HTMLInputElement;

      expect(tpInput.value).toBe('3200.00');
      expect(slInput.value).toBe('2600.00');
    });

    it('initializes with empty inputs when position has no TP/SL', () => {
      renderWithProvider(
        <UpdateTPSLModalContent
          {...defaultProps}
          position={positionWithoutTPSL}
        />,
        mockStore,
      );

      const priceInputs = screen.getAllByPlaceholderText('0.00');
      const tpInput = priceInputs[0] as HTMLInputElement;
      const slInput = priceInputs[1] as HTMLInputElement;

      expect(tpInput.value).toBe('');
      expect(slInput.value).toBe('');
    });
  });

  describe('presets', () => {
    it('sets TP price when a TP preset is clicked', () => {
      renderWithProvider(
        <UpdateTPSLModalContent {...defaultProps} />,
        mockStore,
      );

      fireEvent.click(screen.getByText('+25%'));

      const tpInput = screen.getAllByPlaceholderText(
        '0.00',
      )[0] as HTMLInputElement;
      const numValue = parseFloat(tpInput.value.replace(/,/gu, ''));
      expect(numValue).toBeGreaterThan(0);
      // Entry price 2850 * 1.25 = 3562.50 for a long position
      expect(numValue).toBeCloseTo(3562.5, 0);
    });

    it('sets SL price when a SL preset is clicked', () => {
      renderWithProvider(
        <UpdateTPSLModalContent {...defaultProps} />,
        mockStore,
      );

      fireEvent.click(screen.getByText('-25%'));

      const slInput = screen.getAllByPlaceholderText(
        '0.00',
      )[1] as HTMLInputElement;
      const numValue = parseFloat(slInput.value.replace(/,/gu, ''));
      expect(numValue).toBeGreaterThan(0);
      // Entry price 2850 * 0.75 = 2137.50 for a long position
      expect(numValue).toBeCloseTo(2137.5, 0);
    });
  });

  describe('price input', () => {
    it('allows typing a TP price directly', () => {
      renderWithProvider(
        <UpdateTPSLModalContent {...defaultProps} />,
        mockStore,
      );

      const tpInput = screen.getAllByPlaceholderText('0.00')[0];
      fireEvent.change(tpInput, { target: { value: '3500' } });

      expect((tpInput as HTMLInputElement).value).toBe('3500');
    });

    it('allows clearing the TP price input', () => {
      renderWithProvider(
        <UpdateTPSLModalContent {...defaultProps} />,
        mockStore,
      );

      const tpInput = screen.getAllByPlaceholderText('0.00')[0];
      fireEvent.change(tpInput, { target: { value: '' } });

      expect((tpInput as HTMLInputElement).value).toBe('');
    });

    it('formats the TP price on blur', () => {
      renderWithProvider(
        <UpdateTPSLModalContent
          {...defaultProps}
          position={positionWithoutTPSL}
        />,
        mockStore,
      );

      const tpInput = screen.getAllByPlaceholderText('0.00')[0];
      fireEvent.change(tpInput, { target: { value: '3500' } });
      fireEvent.blur(tpInput);

      const formatted = (tpInput as HTMLInputElement).value;
      expect(formatted).toContain('3');
      expect(formatted).toContain('500');
    });

    it('formats the SL price on blur', () => {
      renderWithProvider(
        <UpdateTPSLModalContent
          {...defaultProps}
          position={positionWithoutTPSL}
        />,
        mockStore,
      );

      const slInput = screen.getAllByPlaceholderText('0.00')[1];
      fireEvent.change(slInput, { target: { value: '2500' } });
      fireEvent.blur(slInput);

      const formatted = (slInput as HTMLInputElement).value;
      expect(formatted).toContain('2');
      expect(formatted).toContain('500');
    });
  });

  describe('percent input', () => {
    it('updates TP price when a percent value is typed', () => {
      renderWithProvider(
        <UpdateTPSLModalContent {...defaultProps} />,
        mockStore,
      );

      const percentInputs = screen.getAllByPlaceholderText('0.0');
      const tpPercentInput = percentInputs[0];
      fireEvent.change(tpPercentInput, { target: { value: '50' } });

      const tpPriceInput = screen.getAllByPlaceholderText(
        '0.00',
      )[0] as HTMLInputElement;
      const numValue = parseFloat(tpPriceInput.value.replace(/,/gu, ''));
      // Entry price 2850 * 1.50 = 4275 for long TP at +50%
      expect(numValue).toBeCloseTo(4275, 0);
    });

    it('updates SL price when a percent value is typed', () => {
      renderWithProvider(
        <UpdateTPSLModalContent {...defaultProps} />,
        mockStore,
      );

      const percentInputs = screen.getAllByPlaceholderText('0.0');
      const slPercentInput = percentInputs[1];
      fireEvent.change(slPercentInput, { target: { value: '50' } });

      const slPriceInput = screen.getAllByPlaceholderText(
        '0.00',
      )[1] as HTMLInputElement;
      const numValue = parseFloat(slPriceInput.value.replace(/,/gu, ''));
      // Entry price 2850 * 0.50 = 1425 for long SL at -50%
      expect(numValue).toBeCloseTo(1425, 0);
    });

    it('clears TP price when percent input is cleared', () => {
      renderWithProvider(
        <UpdateTPSLModalContent {...defaultProps} />,
        mockStore,
      );

      const tpPercentInput = screen.getAllByPlaceholderText('0.0')[0];
      fireEvent.change(tpPercentInput, { target: { value: '' } });

      const tpPriceInput = screen.getAllByPlaceholderText(
        '0.00',
      )[0] as HTMLInputElement;
      expect(tpPriceInput.value).toBe('');
    });
  });

  describe('submit', () => {
    it('calls perpsUpdatePositionTPSL and onClose on successful save', async () => {
      const onClose = jest.fn();

      renderWithProvider(
        <UpdateTPSLModalContent {...defaultProps} onClose={onClose} />,
        mockStore,
      );

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
      renderWithProvider(
        <UpdateTPSLModalContent
          {...defaultProps}
          position={positionWithoutTPSL}
        />,
        mockStore,
      );

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

      renderWithProvider(
        <UpdateTPSLModalContent {...defaultProps} />,
        mockStore,
      );

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
  });

  describe('error handling', () => {
    it('displays an error when perpsUpdatePositionTPSL fails', async () => {
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsUpdatePositionTPSL') {
          return Promise.resolve({ success: false, error: 'Server error' });
        }
        if (method === 'perpsGetPositions') {
          return Promise.resolve(mockPositions);
        }
        return Promise.resolve({ success: true });
      });

      renderWithProvider(
        <UpdateTPSLModalContent {...defaultProps} />,
        mockStore,
      );

      fireEvent.click(screen.getByText(messages.perpsSaveChanges.message));

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('displays a generic error when an exception is thrown', async () => {
      mockSubmitRequestToBackground.mockRejectedValue(
        new Error('Network failure'),
      );

      renderWithProvider(
        <UpdateTPSLModalContent {...defaultProps} />,
        mockStore,
      );

      fireEvent.click(screen.getByText(messages.perpsSaveChanges.message));

      await waitFor(() => {
        expect(screen.getByText('Network failure')).toBeInTheDocument();
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

      renderWithProvider(
        <UpdateTPSLModalContent {...defaultProps} onClose={onClose} />,
        mockStore,
      );

      fireEvent.click(screen.getByText(messages.perpsSaveChanges.message));

      await waitFor(() => {
        expect(screen.getByText('fail')).toBeInTheDocument();
      });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('short position', () => {
    // mockPositions[1] is BTC with size=-0.5 (short)
    const shortPosition = mockPositions[1];

    it('calculates TP preset correctly for a short position', () => {
      renderWithProvider(
        <UpdateTPSLModalContent
          {...defaultProps}
          position={shortPosition}
          currentPrice={45000}
        />,
        mockStore,
      );

      fireEvent.click(screen.getByText('+10%'));

      const tpInput = screen.getAllByPlaceholderText(
        '0.00',
      )[0] as HTMLInputElement;
      const numValue = parseFloat(tpInput.value.replace(/,/gu, ''));
      // Short position: TP at +10% means price goes DOWN by 10%
      // entry 45000 * 0.90 = 40500
      expect(numValue).toBeCloseTo(40500, 0);
    });

    it('calculates SL preset correctly for a short position', () => {
      renderWithProvider(
        <UpdateTPSLModalContent
          {...defaultProps}
          position={shortPosition}
          currentPrice={45000}
        />,
        mockStore,
      );

      fireEvent.click(screen.getByText('-10%'));

      const slInput = screen.getAllByPlaceholderText(
        '0.00',
      )[1] as HTMLInputElement;
      const numValue = parseFloat(slInput.value.replace(/,/gu, ''));
      // Short position: SL at -10% means price goes UP by 10%
      // entry 45000 * 1.10 = 49500
      expect(numValue).toBeCloseTo(49500, 0);
    });
  });
});
