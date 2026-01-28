import type { TransactionPayControllerState } from '@metamask/transaction-pay-controller';
import {
  selectTransactionDataByTransactionId,
  selectTransactionPayTotalsByTransactionId,
  selectIsTransactionPayLoadingByTransactionId,
  selectTransactionPayQuotesByTransactionId,
  selectTransactionPayTokensByTransactionId,
  selectTransactionPaymentTokenByTransactionId,
  selectTransactionPaySourceAmountsByTransactionId,
  selectTransactionPayIsMaxAmountByTransactionId,
  TransactionPayState,
} from './transactionPayController';

const TRANSACTION_ID = 'test-transaction-id';

const MOCK_TOTALS = {
  sourceAmount: { raw: '1000', usd: '1.00' },
  fees: { sourceNetwork: { max: { raw: '100', usd: '0.01' } } },
};

const MOCK_QUOTES = [{ id: 'quote-1', amount: '1000' }];

const MOCK_TOKENS = [{ address: '0x123', symbol: 'TEST', decimals: 18 }];

const MOCK_PAYMENT_TOKEN = {
  address: '0x456',
  chainId: '0x1',
  symbol: 'PAY',
};

const MOCK_SOURCE_AMOUNTS = [{ amount: '1000', targetTokenAddress: '0x123' }];

function createMockState(
  transactionData: Record<string, unknown> = {},
): TransactionPayState {
  return {
    metamask: {
      transactionData: {
        [TRANSACTION_ID]: transactionData,
      },
    } as unknown as TransactionPayControllerState,
  };
}

describe('transactionPayController selectors', () => {
  describe('selectTransactionDataByTransactionId', () => {
    it('returns transaction data for given transaction ID', () => {
      const transactionData = { isLoading: true };
      const state = createMockState(transactionData);

      const result = selectTransactionDataByTransactionId(
        state,
        TRANSACTION_ID,
      );

      expect(result).toStrictEqual(transactionData);
    });

    it('returns undefined for non-existent transaction ID', () => {
      const state = createMockState({ isLoading: true });

      const result = selectTransactionDataByTransactionId(
        state,
        'non-existent-id',
      );

      expect(result).toBeUndefined();
    });
  });

  describe('selectTransactionPayTotalsByTransactionId', () => {
    it('returns totals for given transaction ID', () => {
      const state = createMockState({ totals: MOCK_TOTALS });

      const result = selectTransactionPayTotalsByTransactionId(
        state,
        TRANSACTION_ID,
      );

      expect(result).toStrictEqual(MOCK_TOTALS);
    });

    it('returns undefined when transaction data does not exist', () => {
      const state = createMockState();

      const result = selectTransactionPayTotalsByTransactionId(
        state,
        TRANSACTION_ID,
      );

      expect(result).toBeUndefined();
    });
  });

  describe('selectIsTransactionPayLoadingByTransactionId', () => {
    it('returns true when transaction is loading', () => {
      const state = createMockState({ isLoading: true });

      const result = selectIsTransactionPayLoadingByTransactionId(
        state,
        TRANSACTION_ID,
      );

      expect(result).toBe(true);
    });

    it('returns false when transaction is not loading', () => {
      const state = createMockState({ isLoading: false });

      const result = selectIsTransactionPayLoadingByTransactionId(
        state,
        TRANSACTION_ID,
      );

      expect(result).toBe(false);
    });

    it('returns false when transaction data does not exist', () => {
      const state = createMockState();

      const result = selectIsTransactionPayLoadingByTransactionId(
        state,
        TRANSACTION_ID,
      );

      expect(result).toBe(false);
    });
  });

  describe('selectTransactionPayQuotesByTransactionId', () => {
    it('returns quotes for given transaction ID', () => {
      const state = createMockState({ quotes: MOCK_QUOTES });

      const result = selectTransactionPayQuotesByTransactionId(
        state,
        TRANSACTION_ID,
      );

      expect(result).toStrictEqual(MOCK_QUOTES);
    });

    it('returns undefined when no quotes exist', () => {
      const state = createMockState();

      const result = selectTransactionPayQuotesByTransactionId(
        state,
        TRANSACTION_ID,
      );

      expect(result).toBeUndefined();
    });
  });

  describe('selectTransactionPayTokensByTransactionId', () => {
    it('returns tokens for given transaction ID', () => {
      const state = createMockState({ tokens: MOCK_TOKENS });

      const result = selectTransactionPayTokensByTransactionId(
        state,
        TRANSACTION_ID,
      );

      expect(result).toStrictEqual(MOCK_TOKENS);
    });

    it('returns empty array when no tokens exist', () => {
      const state = createMockState();

      const result = selectTransactionPayTokensByTransactionId(
        state,
        TRANSACTION_ID,
      );

      expect(result).toStrictEqual([]);
    });
  });

  describe('selectTransactionPaymentTokenByTransactionId', () => {
    it('returns payment token for given transaction ID', () => {
      const state = createMockState({ paymentToken: MOCK_PAYMENT_TOKEN });

      const result = selectTransactionPaymentTokenByTransactionId(
        state,
        TRANSACTION_ID,
      );

      expect(result).toStrictEqual(MOCK_PAYMENT_TOKEN);
    });

    it('returns undefined when no payment token exists', () => {
      const state = createMockState();

      const result = selectTransactionPaymentTokenByTransactionId(
        state,
        TRANSACTION_ID,
      );

      expect(result).toBeUndefined();
    });
  });

  describe('selectTransactionPaySourceAmountsByTransactionId', () => {
    it('returns source amounts for given transaction ID', () => {
      const state = createMockState({ sourceAmounts: MOCK_SOURCE_AMOUNTS });

      const result = selectTransactionPaySourceAmountsByTransactionId(
        state,
        TRANSACTION_ID,
      );

      expect(result).toStrictEqual(MOCK_SOURCE_AMOUNTS);
    });

    it('returns undefined when no source amounts exist', () => {
      const state = createMockState();

      const result = selectTransactionPaySourceAmountsByTransactionId(
        state,
        TRANSACTION_ID,
      );

      expect(result).toBeUndefined();
    });
  });

  describe('selectTransactionPayIsMaxAmountByTransactionId', () => {
    it('returns true when isMaxAmount is true', () => {
      const state = createMockState({ isMaxAmount: true });

      const result = selectTransactionPayIsMaxAmountByTransactionId(
        state,
        TRANSACTION_ID,
      );

      expect(result).toBe(true);
    });

    it('returns false when isMaxAmount is false', () => {
      const state = createMockState({ isMaxAmount: false });

      const result = selectTransactionPayIsMaxAmountByTransactionId(
        state,
        TRANSACTION_ID,
      );

      expect(result).toBe(false);
    });

    it('returns false when transaction data does not exist', () => {
      const state = createMockState();

      const result = selectTransactionPayIsMaxAmountByTransactionId(
        state,
        TRANSACTION_ID,
      );

      expect(result).toBe(false);
    });
  });
});
