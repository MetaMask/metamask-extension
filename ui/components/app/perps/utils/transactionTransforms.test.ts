import {
  FillType,
  PerpsOrderTransactionStatus,
  PerpsOrderTransactionStatusType,
} from '../types/transactionHistory';
import {
  aggregateFillsByTimestamp,
  transformFillsToTransactions,
  transformOrdersToTransactions,
  transformFundingToTransactions,
  transformUserHistoryToTransactions,
  transformWithdrawalRequestsToTransactions,
  transformDepositRequestsToTransactions,
  type WithdrawalRequest,
  type DepositRequest,
} from './transactionTransforms';
import type {
  Funding,
  Order,
  OrderFill,
  UserHistoryItem,
} from '@metamask/perps-controller';

// Helper to create mock OrderFill
const createMockFill = (overrides: Partial<OrderFill> = {}): OrderFill => ({
  orderId: 'order-001',
  symbol: 'BTC',
  side: 'buy',
  size: '1.0',
  price: '50000',
  pnl: '0',
  direction: 'Open Long',
  fee: '10',
  feeToken: 'USDC',
  timestamp: Date.now(),
  ...overrides,
});

// Helper to create mock Order
const createMockOrder = (overrides: Partial<Order> = {}): Order => ({
  orderId: 'order-001',
  symbol: 'BTC',
  side: 'buy',
  orderType: 'limit',
  size: '1.0',
  originalSize: '1.0',
  price: '50000',
  filledSize: '0',
  remainingSize: '1.0',
  status: 'open',
  timestamp: Date.now(),
  ...overrides,
});

// Helper to create mock Funding
const createMockFunding = (overrides: Partial<Funding> = {}): Funding => ({
  symbol: 'BTC',
  amountUsd: '5.00',
  rate: '0.0001',
  timestamp: Date.now(),
  ...overrides,
});

// Helper to create mock UserHistoryItem
const createMockUserHistory = (
  overrides: Partial<UserHistoryItem> = {},
): UserHistoryItem => ({
  id: 'history-001',
  timestamp: Date.now(),
  type: 'deposit',
  amount: '1000.00',
  asset: 'USDC',
  txHash: '0x1234567890abcdef',
  status: 'completed',
  details: {
    source: '0xabc',
  },
  ...overrides,
});

describe('Transaction Transform Utilities', () => {
  describe('aggregateFillsByTimestamp', () => {
    it('aggregates fills with same timestamp and close direction', () => {
      const timestamp = Date.now();
      const fills = [
        createMockFill({
          orderId: 'order-1',
          symbol: 'ETH',
          direction: 'Close Long',
          size: '1.0',
          price: '2000',
          pnl: '100',
          fee: '5',
          timestamp,
        }),
        createMockFill({
          orderId: 'order-2',
          symbol: 'ETH',
          direction: 'Close Long',
          size: '0.5',
          price: '2010',
          pnl: '50',
          fee: '2.5',
          timestamp,
        }),
      ];

      const result = aggregateFillsByTimestamp(fills);

      expect(result).toHaveLength(1);
      expect(result[0].size).toBe('1.5'); // 1.0 + 0.5
      expect(result[0].pnl).toBe('150'); // 100 + 50
      expect(result[0].fee).toBe('7.5'); // 5 + 2.5
    });

    it('does not aggregate fills with different timestamps', () => {
      const fills = [
        createMockFill({
          direction: 'Close Long',
          timestamp: 1000000000000,
        }),
        createMockFill({
          direction: 'Close Long',
          timestamp: 2000000000000,
        }),
      ];

      const result = aggregateFillsByTimestamp(fills);

      expect(result).toHaveLength(2);
    });

    it('does not aggregate open position fills', () => {
      const timestamp = Date.now();
      const fills = [
        createMockFill({
          direction: 'Open Long',
          timestamp,
        }),
        createMockFill({
          direction: 'Open Long',
          timestamp,
        }),
      ];

      const result = aggregateFillsByTimestamp(fills);

      expect(result).toHaveLength(2);
    });

    it('preserves detailedOrderType from aggregated fills', () => {
      const timestamp = Date.now();
      const fills = [
        createMockFill({
          direction: 'Close Long',
          timestamp,
          detailedOrderType: 'Stop Loss',
        }),
        createMockFill({
          direction: 'Close Long',
          timestamp,
        }),
      ];

      const result = aggregateFillsByTimestamp(fills);

      expect(result).toHaveLength(1);
      expect(result[0].detailedOrderType).toBe('Stop Loss');
    });

    it('sorts result by timestamp descending', () => {
      const fills = [
        createMockFill({ direction: 'Open Long', timestamp: 1000 }),
        createMockFill({ direction: 'Open Long', timestamp: 3000 }),
        createMockFill({ direction: 'Open Long', timestamp: 2000 }),
      ];

      const result = aggregateFillsByTimestamp(fills);

      expect(result[0].timestamp).toBe(3000);
      expect(result[1].timestamp).toBe(2000);
      expect(result[2].timestamp).toBe(1000);
    });
  });

  describe('transformFillsToTransactions', () => {
    it('transforms an open long fill to a trade transaction', () => {
      const fill = createMockFill({
        direction: 'Open Long',
        size: '1.0',
        price: '50000',
        fee: '10',
      });

      const result = transformFillsToTransactions([fill]);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('trade');
      expect(result[0].category).toBe('position_open');
      expect(result[0].title).toBe('Opened long');
      expect(result[0].fill?.action).toBe('Opened');
      expect(result[0].fill?.isPositive).toBe(false); // Fee is a cost
    });

    it('transforms a close long fill to a trade transaction', () => {
      const fill = createMockFill({
        direction: 'Close Long',
        size: '1.0',
        price: '51000',
        pnl: '1000',
        fee: '10',
      });

      const result = transformFillsToTransactions([fill]);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('trade');
      expect(result[0].category).toBe('position_close');
      expect(result[0].title).toBe('Closed long');
      expect(result[0].fill?.action).toBe('Closed');
      expect(result[0].fill?.isPositive).toBe(true); // Profitable trade
    });

    it('sets fillType to Liquidation when liquidation info is present', () => {
      const fill = createMockFill({
        direction: 'Close Long',
        liquidation: {
          liquidatedUser: '0xabc',
          markPx: '49000',
          method: 'market',
        },
      });

      const result = transformFillsToTransactions([fill]);

      expect(result[0].fill?.fillType).toBe(FillType.Liquidation);
    });

    it('sets fillType to TakeProfit when detailedOrderType includes Take Profit', () => {
      const fill = createMockFill({
        direction: 'Close Long',
        detailedOrderType: 'Take Profit Limit',
      });

      const result = transformFillsToTransactions([fill]);

      expect(result[0].fill?.fillType).toBe(FillType.TakeProfit);
    });

    it('sets fillType to StopLoss when detailedOrderType includes Stop', () => {
      const fill = createMockFill({
        direction: 'Close Long',
        detailedOrderType: 'Stop Market',
      });

      const result = transformFillsToTransactions([fill]);

      expect(result[0].fill?.fillType).toBe(FillType.StopLoss);
    });

    it('handles Buy/Sell directions for spot-perps markets', () => {
      const buyFill = createMockFill({ direction: 'Buy' });
      const sellFill = createMockFill({ direction: 'Sell' });

      const buyResult = transformFillsToTransactions([buyFill]);
      const sellResult = transformFillsToTransactions([sellFill]);

      expect(buyResult[0].title).toBe('Bought');
      expect(sellResult[0].title).toBe('Sold');
    });
  });

  describe('transformOrdersToTransactions', () => {
    it('transforms an open limit order', () => {
      const order = createMockOrder({
        status: 'open',
        orderType: 'limit',
        side: 'buy',
      });

      const result = transformOrdersToTransactions([order]);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('order');
      expect(result[0].category).toBe('limit_order');
      expect(result[0].order?.statusType).toBe(
        PerpsOrderTransactionStatusType.Pending,
      );
      expect(result[0].order?.text).toBe(PerpsOrderTransactionStatus.Open);
    });

    it('transforms a filled order', () => {
      const order = createMockOrder({
        status: 'filled',
        size: '0',
        originalSize: '1.0',
      });

      const result = transformOrdersToTransactions([order]);

      expect(result[0].order?.statusType).toBe(
        PerpsOrderTransactionStatusType.Filled,
      );
      expect(result[0].order?.text).toBe(PerpsOrderTransactionStatus.Filled);
      expect(result[0].order?.filled).toBe('100%');
    });

    it('transforms a canceled order', () => {
      const order = createMockOrder({ status: 'canceled' });

      const result = transformOrdersToTransactions([order]);

      expect(result[0].order?.statusType).toBe(
        PerpsOrderTransactionStatusType.Canceled,
      );
      expect(result[0].order?.text).toBe(PerpsOrderTransactionStatus.Canceled);
    });

    it('transforms a rejected order', () => {
      const order = createMockOrder({ status: 'rejected' });

      const result = transformOrdersToTransactions([order]);

      expect(result[0].order?.statusType).toBe(
        PerpsOrderTransactionStatusType.Canceled,
      );
      expect(result[0].order?.text).toBe(PerpsOrderTransactionStatus.Rejected);
    });

    it('calculates filled percentage correctly', () => {
      const order = createMockOrder({
        status: 'open',
        size: '0.5',
        originalSize: '1.0',
      });

      const result = transformOrdersToTransactions([order]);

      expect(result[0].order?.filled).toBe('50%');
    });
  });

  describe('transformFundingToTransactions', () => {
    it('transforms positive funding (received)', () => {
      const funding = createMockFunding({
        amountUsd: '5.00',
        rate: '0.0001',
      });

      const result = transformFundingToTransactions([funding]);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('funding');
      expect(result[0].category).toBe('funding_fee');
      expect(result[0].title).toBe('Received funding fee');
      expect(result[0].fundingAmount?.isPositive).toBe(true);
      expect(result[0].fundingAmount?.fee).toBe('+$5');
    });

    it('transforms negative funding (paid)', () => {
      const funding = createMockFunding({
        amountUsd: '-3.50',
        rate: '-0.0001',
      });

      const result = transformFundingToTransactions([funding]);

      expect(result[0].title).toBe('Paid funding fee');
      expect(result[0].fundingAmount?.isPositive).toBe(false);
      expect(result[0].fundingAmount?.fee).toBe('-$3.5');
    });

    it('sorts funding by timestamp descending', () => {
      const funding = [
        createMockFunding({ timestamp: 1000 }),
        createMockFunding({ timestamp: 3000 }),
        createMockFunding({ timestamp: 2000 }),
      ];

      const result = transformFundingToTransactions(funding);

      expect(result[0].timestamp).toBe(3000);
      expect(result[1].timestamp).toBe(2000);
      expect(result[2].timestamp).toBe(1000);
    });

    it('calculates funding rate percentage correctly', () => {
      const funding = createMockFunding({ rate: '0.0001' });

      const result = transformFundingToTransactions([funding]);

      expect(result[0].fundingAmount?.rate).toBe('0.01%');
    });
  });

  describe('transformUserHistoryToTransactions', () => {
    it('transforms a completed deposit', () => {
      const history = createMockUserHistory({
        type: 'deposit',
        amount: '1000.00',
        asset: 'USDC',
        status: 'completed',
      });

      const result = transformUserHistoryToTransactions([history]);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('deposit');
      expect(result[0].category).toBe('deposit');
      expect(result[0].title).toBe('Deposited 1000.00 USDC');
      expect(result[0].depositWithdrawal?.isPositive).toBe(true);
      expect(result[0].depositWithdrawal?.amount).toBe('+$1000.00');
    });

    it('transforms a completed withdrawal', () => {
      const history = createMockUserHistory({
        type: 'withdrawal',
        amount: '500.00',
        asset: 'USDC',
        status: 'completed',
      });

      const result = transformUserHistoryToTransactions([history]);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('withdrawal');
      expect(result[0].category).toBe('withdrawal');
      expect(result[0].title).toBe('Withdrew 500.00 USDC');
      expect(result[0].depositWithdrawal?.isPositive).toBe(false);
      expect(result[0].depositWithdrawal?.amount).toBe('-$500.00');
    });

    it('filters out non-completed transactions', () => {
      const history = [
        createMockUserHistory({ id: '1', status: 'completed' }),
        createMockUserHistory({ id: '2', status: 'pending' }),
        createMockUserHistory({ id: '3', status: 'failed' }),
      ];

      const result = transformUserHistoryToTransactions(history);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('deposit-1');
    });
  });

  describe('transformWithdrawalRequestsToTransactions', () => {
    it('transforms a completed withdrawal request', () => {
      const request: WithdrawalRequest = {
        id: 'wd-001',
        timestamp: Date.now(),
        amount: '250.00',
        asset: 'USDC',
        status: 'completed',
        txHash: '0xabc',
      };

      const result = transformWithdrawalRequestsToTransactions([request]);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('withdrawal');
      expect(result[0].title).toBe('Withdrew 250.00 USDC');
      expect(result[0].depositWithdrawal?.amount).toBe('-$250.00');
    });

    it('filters out non-completed withdrawal requests', () => {
      const requests: WithdrawalRequest[] = [
        {
          id: 'wd-1',
          timestamp: Date.now(),
          amount: '100',
          asset: 'USDC',
          status: 'completed',
        },
        {
          id: 'wd-2',
          timestamp: Date.now(),
          amount: '200',
          asset: 'USDC',
          status: 'pending',
        },
      ];

      const result = transformWithdrawalRequestsToTransactions(requests);

      expect(result).toHaveLength(1);
    });
  });

  describe('transformDepositRequestsToTransactions', () => {
    it('transforms a completed deposit request', () => {
      const request: DepositRequest = {
        id: 'dep-001',
        timestamp: Date.now(),
        amount: '500.00',
        asset: 'USDC',
        status: 'completed',
        txHash: '0xdef',
      };

      const result = transformDepositRequestsToTransactions([request]);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('deposit');
      expect(result[0].title).toBe('Deposited 500.00 USDC');
      expect(result[0].depositWithdrawal?.amount).toBe('+$500.00');
    });

    it('uses generic title for zero amount deposits', () => {
      const request: DepositRequest = {
        id: 'dep-001',
        timestamp: Date.now(),
        amount: '0',
        asset: 'USDC',
        status: 'completed',
      };

      const result = transformDepositRequestsToTransactions([request]);

      expect(result[0].title).toBe('Deposit');
    });

    it('filters out non-completed deposit requests', () => {
      const requests: DepositRequest[] = [
        {
          id: 'dep-1',
          timestamp: Date.now(),
          amount: '100',
          asset: 'USDC',
          status: 'completed',
        },
        {
          id: 'dep-2',
          timestamp: Date.now(),
          amount: '200',
          asset: 'USDC',
          status: 'bridging',
        },
      ];

      const result = transformDepositRequestsToTransactions(requests);

      expect(result).toHaveLength(1);
    });
  });
});
