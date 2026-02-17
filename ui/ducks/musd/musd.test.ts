import { MusdConversionFlowState } from '../../pages/musd-conversion/types';
import musdReducer, {
  musdSlice,
  setFlowState,
  setSelectedPaymentToken,
  setInputAmountFiat,
  setInputAmountWei,
  setOutputAmountWei,
  setQuote,
  setQuoteLoading,
  setQuoteError,
  setTransactionId,
  setTransactionHash,
  setTransactionError,
  setEducationSeen,
  addDismissedCtaKey,
  resetConversionState,
  initialState,
} from './musd';

describe('musd Redux slice', () => {
  describe('initial state', () => {
    it('should have correct initial values', () => {
      expect(initialState.flowState).toBe(MusdConversionFlowState.IDLE);
      expect(initialState.selectedPaymentToken).toBeNull();
      expect(initialState.inputAmountFiat).toBe('');
      expect(initialState.inputAmountWei).toBe('');
      expect(initialState.outputAmountWei).toBe('');
      expect(initialState.quote).toBeNull();
      expect(initialState.isQuoteLoading).toBe(false);
      expect(initialState.quoteError).toBeNull();
      expect(initialState.transactionId).toBeNull();
      expect(initialState.transactionHash).toBeNull();
      expect(initialState.transactionError).toBeNull();
      expect(initialState.educationSeen).toBe(false);
      expect(initialState.dismissedCtaKeys).toEqual([]);
    });
  });

  describe('setFlowState', () => {
    it('should update flow state', () => {
      const state = musdReducer(
        initialState,
        setFlowState(MusdConversionFlowState.LOADING_QUOTE),
      );
      expect(state.flowState).toBe(MusdConversionFlowState.LOADING_QUOTE);
    });
  });

  describe('setSelectedPaymentToken', () => {
    const mockToken = {
      address: '0x123' as `0x${string}`,
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: '0x1' as `0x${string}`,
      balance: '100000000',
      fiatBalance: '100',
    };

    it('should set the selected payment token', () => {
      const state = musdReducer(
        initialState,
        setSelectedPaymentToken(mockToken),
      );
      expect(state.selectedPaymentToken).toEqual(mockToken);
    });

    it('should allow clearing the payment token', () => {
      const stateWithToken = musdReducer(
        initialState,
        setSelectedPaymentToken(mockToken),
      );
      const state = musdReducer(stateWithToken, setSelectedPaymentToken(null));
      expect(state.selectedPaymentToken).toBeNull();
    });
  });

  describe('setInputAmountFiat', () => {
    it('should set the fiat input amount', () => {
      const state = musdReducer(initialState, setInputAmountFiat('100'));
      expect(state.inputAmountFiat).toBe('100');
    });
  });

  describe('setInputAmountWei', () => {
    it('should set the wei input amount', () => {
      const state = musdReducer(initialState, setInputAmountWei('100000000'));
      expect(state.inputAmountWei).toBe('100000000');
    });
  });

  describe('setOutputAmountWei', () => {
    it('should set the output amount', () => {
      const state = musdReducer(initialState, setOutputAmountWei('103000000'));
      expect(state.outputAmountWei).toBe('103000000');
    });
  });

  describe('quote actions', () => {
    const mockQuote = {
      steps: [],
      details: {
        operation: 'swap' as const,
        sender: '0x123',
        recipient: '0x123',
        currencyIn: {
          currency: {
            chainId: 1,
            address: '0x123',
            symbol: 'USDC',
            decimals: 6,
          },
          amount: '100000000',
          amountFormatted: '100',
          amountUsd: '100',
        },
        currencyOut: {
          currency: {
            chainId: 1,
            address: '0x456',
            symbol: 'MUSD',
            decimals: 6,
          },
          amount: '103000000',
          amountFormatted: '103',
          amountUsd: '103',
        },
        totalImpact: { usd: '-0.01', percent: '-0.01' },
        timeEstimate: 4,
      },
      fees: {
        gas: { amountUsd: '0.50' },
        relayer: { amountUsd: '0.25' },
        relayerGas: { amountUsd: '0' },
        relayerService: { amountUsd: '0' },
        app: { amountUsd: '0' },
        subsidized: { amountUsd: '0' },
      },
    };

    it('should set quote', () => {
      const state = musdReducer(initialState, setQuote(mockQuote));
      expect(state.quote).toEqual(mockQuote);
    });

    it('should set quote loading state', () => {
      const state = musdReducer(initialState, setQuoteLoading(true));
      expect(state.isQuoteLoading).toBe(true);
    });

    it('should set quote error', () => {
      const state = musdReducer(
        initialState,
        setQuoteError('Failed to fetch quote'),
      );
      expect(state.quoteError).toBe('Failed to fetch quote');
    });

    it('should clear error when setting new quote', () => {
      const stateWithError = musdReducer(initialState, setQuoteError('Error'));
      const state = musdReducer(stateWithError, setQuote(mockQuote));
      expect(state.quoteError).toBeNull();
    });
  });

  describe('transaction actions', () => {
    it('should set transaction ID', () => {
      const state = musdReducer(initialState, setTransactionId('tx-123'));
      expect(state.transactionId).toBe('tx-123');
    });

    it('should set transaction hash', () => {
      const state = musdReducer(initialState, setTransactionHash('0xabc123'));
      expect(state.transactionHash).toBe('0xabc123');
    });

    it('should set transaction error', () => {
      const state = musdReducer(
        initialState,
        setTransactionError('Transaction failed'),
      );
      expect(state.transactionError).toBe('Transaction failed');
    });
  });

  describe('education state', () => {
    it('should set education as seen', () => {
      const state = musdReducer(initialState, setEducationSeen(true));
      expect(state.educationSeen).toBe(true);
    });
  });

  describe('dismissed CTAs', () => {
    it('should add a dismissed CTA key', () => {
      const state = musdReducer(initialState, addDismissedCtaKey('0x1-0x123'));
      expect(state.dismissedCtaKeys).toContain('0x1-0x123');
    });

    it('should not add duplicate keys', () => {
      const state1 = musdReducer(initialState, addDismissedCtaKey('0x1-0x123'));
      const state2 = musdReducer(state1, addDismissedCtaKey('0x1-0x123'));
      expect(state2.dismissedCtaKeys).toHaveLength(1);
    });
  });

  describe('resetConversionState', () => {
    it('should reset to initial state while preserving education and dismissed CTAs', () => {
      // Set up a modified state
      let state = musdReducer(initialState, setInputAmountFiat('100'));
      state = musdReducer(state, setEducationSeen(true));
      state = musdReducer(state, addDismissedCtaKey('0x1-0x123'));
      state = musdReducer(state, setTransactionId('tx-123'));
      state = musdReducer(
        state,
        setFlowState(MusdConversionFlowState.QUOTE_READY),
      );

      // Reset
      const resetState = musdReducer(state, resetConversionState());

      // Check that conversion-specific state is reset
      expect(resetState.flowState).toBe(MusdConversionFlowState.IDLE);
      expect(resetState.inputAmountFiat).toBe('');
      expect(resetState.selectedPaymentToken).toBeNull();
      expect(resetState.transactionId).toBeNull();

      // Check that persisted state is preserved
      expect(resetState.educationSeen).toBe(true);
      expect(resetState.dismissedCtaKeys).toContain('0x1-0x123');
    });
  });
});
