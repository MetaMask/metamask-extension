import { TextColor } from '@metamask/design-system-react';
import {
  getDisplayName,
  getPositionDirection,
  formatOrderType,
  formatStatus,
  getStatusColor,
  getChangeColor,
  getDisplaySymbol,
  getAssetIconUrl,
  safeDecodeURIComponent,
  filterMarketsByQuery,
  groupTransactionsByDate,
  filterTransactionsByType,
  getTransactionStatusColor,
  getTransactionAmountColor,
} from './utils';
import { HYPERLIQUID_ASSET_ICONS_BASE_URL } from './constants';
import type { PerpsMarketData, PerpsTransaction } from './types';

const createMockMarket = (
  overrides: Partial<PerpsMarketData> = {},
): PerpsMarketData => ({
  symbol: overrides.symbol ?? 'BTC',
  name: overrides.name ?? 'Bitcoin',
  maxLeverage: overrides.maxLeverage ?? '20x',
  price: overrides.price ?? '$50,000',
  change24h: overrides.change24h ?? '+$1,250.00',
  change24hPercent: overrides.change24hPercent ?? '+2.5%',
  volume: overrides.volume ?? '$1.2B',
  openInterest: overrides.openInterest,
  nextFundingTime: overrides.nextFundingTime,
  fundingIntervalHours: overrides.fundingIntervalHours,
  fundingRate: overrides.fundingRate,
  marketSource: overrides.marketSource,
  marketType: overrides.marketType,
});

describe('Perps Utils', () => {
  describe('getDisplayName', () => {
    it('returns the symbol unchanged for regular assets', () => {
      expect(getDisplayName('BTC')).toBe('BTC');
      expect(getDisplayName('ETH')).toBe('ETH');
    });

    it('extracts the asset name from HIP-3 prefixed symbols', () => {
      expect(getDisplayName('xyz:TSLA')).toBe('TSLA');
      expect(getDisplayName('abc:AAPL')).toBe('AAPL');
    });

    it('handles edge cases with colons', () => {
      expect(getDisplayName(':INVALID')).toBe(':INVALID');
      expect(getDisplayName('INVALID:')).toBe('INVALID:');
      expect(getDisplayName(':')).toBe(':');
    });
  });

  describe('getPositionDirection', () => {
    it('returns long for positive sizes', () => {
      expect(getPositionDirection('100')).toBe('long');
      expect(getPositionDirection('0.5')).toBe('long');
    });

    it('returns short for negative sizes', () => {
      expect(getPositionDirection('-50')).toBe('short');
      expect(getPositionDirection('-0.1')).toBe('short');
    });

    it('returns long for zero', () => {
      expect(getPositionDirection('0')).toBe('long');
    });
  });

  describe('formatOrderType', () => {
    it('capitalizes the first letter of order type', () => {
      expect(formatOrderType('market')).toBe('Market');
      expect(formatOrderType('limit')).toBe('Limit');
    });
  });

  describe('formatStatus', () => {
    it('capitalizes the first letter of status', () => {
      expect(formatStatus('open')).toBe('Open');
      expect(formatStatus('filled')).toBe('Filled');
      expect(formatStatus('canceled')).toBe('Canceled');
      expect(formatStatus('rejected')).toBe('Rejected');
      expect(formatStatus('queued')).toBe('Queued');
      expect(formatStatus('triggered')).toBe('Triggered');
    });
  });

  describe('getStatusColor', () => {
    it('returns SuccessDefault for filled status', () => {
      expect(getStatusColor('filled')).toBe(TextColor.SuccessDefault);
    });

    it('returns ErrorDefault for canceled and rejected statuses', () => {
      expect(getStatusColor('canceled')).toBe(TextColor.ErrorDefault);
      expect(getStatusColor('rejected')).toBe(TextColor.ErrorDefault);
    });

    it('returns TextAlternative for open, queued, and triggered statuses', () => {
      expect(getStatusColor('open')).toBe(TextColor.TextAlternative);
      expect(getStatusColor('queued')).toBe(TextColor.TextAlternative);
      expect(getStatusColor('triggered')).toBe(TextColor.TextAlternative);
    });
  });

  describe('getChangeColor', () => {
    it('returns SuccessDefault for positive percentages with + prefix', () => {
      expect(getChangeColor('+2.84%')).toBe(TextColor.SuccessDefault);
      expect(getChangeColor('+0.01%')).toBe(TextColor.SuccessDefault);
    });

    it('returns SuccessDefault for positive percentages without + prefix', () => {
      expect(getChangeColor('2.84%')).toBe(TextColor.SuccessDefault);
      expect(getChangeColor('100%')).toBe(TextColor.SuccessDefault);
    });

    it('returns ErrorDefault for negative percentages', () => {
      expect(getChangeColor('-1.23%')).toBe(TextColor.ErrorDefault);
      expect(getChangeColor('-50%')).toBe(TextColor.ErrorDefault);
    });

    it('returns SuccessDefault for zero percentages', () => {
      expect(getChangeColor('0%')).toBe(TextColor.SuccessDefault);
      expect(getChangeColor('0.00%')).toBe(TextColor.SuccessDefault);
      expect(getChangeColor('+0%')).toBe(TextColor.SuccessDefault);
      expect(getChangeColor('-0%')).toBe(TextColor.SuccessDefault);
    });
  });

  describe('getDisplaySymbol', () => {
    it('returns the symbol unchanged for regular assets', () => {
      expect(getDisplaySymbol('BTC')).toBe('BTC');
      expect(getDisplaySymbol('ETH')).toBe('ETH');
    });

    it('extracts the asset name from HIP-3 prefixed symbols', () => {
      expect(getDisplaySymbol('xyz:TSLA')).toBe('TSLA');
      expect(getDisplaySymbol('abc:AAPL')).toBe('AAPL');
    });

    it('handles edge cases with colons', () => {
      expect(getDisplaySymbol(':INVALID')).toBe(':INVALID');
      expect(getDisplaySymbol('INVALID:')).toBe('INVALID:');
    });
  });

  describe('getAssetIconUrl', () => {
    it('generates correct URL for regular assets', () => {
      expect(getAssetIconUrl('BTC')).toBe(
        `${HYPERLIQUID_ASSET_ICONS_BASE_URL}BTC.svg`,
      );
      expect(getAssetIconUrl('eth')).toBe(
        `${HYPERLIQUID_ASSET_ICONS_BASE_URL}ETH.svg`,
      );
    });

    it('generates correct URL for HIP-3 assets', () => {
      expect(getAssetIconUrl('xyz:TSLA')).toBe(
        `${HYPERLIQUID_ASSET_ICONS_BASE_URL}xyz:TSLA.svg`,
      );
      expect(getAssetIconUrl('ABC:aapl')).toBe(
        `${HYPERLIQUID_ASSET_ICONS_BASE_URL}abc:AAPL.svg`,
      );
    });

    it('returns empty string for empty input', () => {
      expect(getAssetIconUrl('')).toBe('');
    });
  });

  describe('safeDecodeURIComponent', () => {
    it('decodes valid URI-encoded strings', () => {
      expect(safeDecodeURIComponent('hello%20world')).toBe('hello world');
      expect(safeDecodeURIComponent('xyz%3ATSLA')).toBe('xyz:TSLA');
      expect(safeDecodeURIComponent('BTC')).toBe('BTC');
    });

    it('decodes special characters correctly', () => {
      expect(safeDecodeURIComponent('%2F')).toBe('/');
      expect(safeDecodeURIComponent('%3F')).toBe('?');
      expect(safeDecodeURIComponent('%26')).toBe('&');
      expect(safeDecodeURIComponent('%3D')).toBe('=');
    });

    it('returns undefined for malformed percent-encoding sequences', () => {
      expect(safeDecodeURIComponent('%E0%A4%A')).toBeUndefined();
      expect(safeDecodeURIComponent('%')).toBeUndefined();
      expect(safeDecodeURIComponent('%ZZ')).toBeUndefined();
    });

    it('returns the original string when no encoding is present', () => {
      expect(safeDecodeURIComponent('simple')).toBe('simple');
      expect(safeDecodeURIComponent('ETH')).toBe('ETH');
    });

    it('handles empty string', () => {
      expect(safeDecodeURIComponent('')).toBe('');
    });
  });

  describe('filterMarketsByQuery', () => {
    const markets = [
      createMockMarket({ symbol: 'BTC', name: 'Bitcoin' }),
      createMockMarket({ symbol: 'ETH', name: 'Ethereum' }),
      createMockMarket({ symbol: 'SOL', name: 'Solana' }),
      createMockMarket({ symbol: 'xyz:TSLA', name: 'Tesla' }),
    ];

    it('filters by symbol match', () => {
      const result = filterMarketsByQuery(markets, 'btc');
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('BTC');
    });

    it('filters by name match', () => {
      const result = filterMarketsByQuery(markets, 'ethereum');
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('ETH');
    });

    it('is case insensitive', () => {
      const result = filterMarketsByQuery(markets, 'BITCOIN');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bitcoin');
    });

    it('trims leading and trailing whitespace', () => {
      const result = filterMarketsByQuery(markets, '  btc  ');
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('BTC');
    });

    it('returns all markets for empty query', () => {
      expect(filterMarketsByQuery(markets, '')).toHaveLength(4);
      expect(filterMarketsByQuery(markets, '   ')).toHaveLength(4);
    });

    it('returns empty array when no matches', () => {
      const result = filterMarketsByQuery(markets, 'xyz123');
      expect(result).toHaveLength(0);
    });

    it('handles partial matches', () => {
      const result = filterMarketsByQuery(markets, 'bit');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bitcoin');
    });

    it('matches HIP-3 symbols', () => {
      const result = filterMarketsByQuery(markets, 'tsla');
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('xyz:TSLA');
    });

    it('returns empty array for null/undefined query', () => {
      expect(filterMarketsByQuery(markets, null as unknown as string)).toEqual(
        markets,
      );
      expect(
        filterMarketsByQuery(markets, undefined as unknown as string),
      ).toEqual(markets);
    });
  });

  describe('groupTransactionsByDate', () => {
    const mockT = (key: string): string => {
      const translations: Record<string, string> = {
        perpsDateToday: 'Today',
        perpsDateYesterday: 'Yesterday',
      };
      return translations[key] || key;
    };

    const createMockTransaction = (
      overrides: Partial<PerpsTransaction> = {},
    ): PerpsTransaction => ({
      id: 'tx-001',
      type: 'trade',
      category: 'position_open',
      symbol: 'ETH',
      title: 'Opened long',
      subtitle: '2.5 ETH @ $2,850.00',
      timestamp: Date.now(),
      ...overrides,
    });

    it('groups transactions from today with "Today" label', () => {
      const transactions = [
        createMockTransaction({ id: 'tx-1', timestamp: Date.now() - 1000 }),
        createMockTransaction({ id: 'tx-2', timestamp: Date.now() - 2000 }),
      ];

      const result = groupTransactionsByDate(transactions, mockT);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('Today');
      expect(result[0].transactions).toHaveLength(2);
    });

    it('groups transactions from yesterday with "Yesterday" label', () => {
      const yesterday = Date.now() - 86400000; // 24 hours ago
      const transactions = [
        createMockTransaction({ id: 'tx-1', timestamp: yesterday }),
        createMockTransaction({ id: 'tx-2', timestamp: yesterday - 1000 }),
      ];

      const result = groupTransactionsByDate(transactions, mockT);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('Yesterday');
      expect(result[0].transactions).toHaveLength(2);
    });

    it('groups transactions from different days separately', () => {
      const today = Date.now();
      const yesterday = Date.now() - 86400000;
      const transactions = [
        createMockTransaction({ id: 'tx-today', timestamp: today }),
        createMockTransaction({ id: 'tx-yesterday', timestamp: yesterday }),
      ];

      const result = groupTransactionsByDate(transactions, mockT);

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('Today');
      expect(result[1].date).toBe('Yesterday');
    });

    it('sorts transactions by timestamp within groups (newest first)', () => {
      const transactions = [
        createMockTransaction({ id: 'tx-old', timestamp: Date.now() - 5000 }),
        createMockTransaction({ id: 'tx-new', timestamp: Date.now() - 1000 }),
        createMockTransaction({ id: 'tx-mid', timestamp: Date.now() - 3000 }),
      ];

      const result = groupTransactionsByDate(transactions, mockT);

      expect(result[0].transactions[0].id).toBe('tx-new');
      expect(result[0].transactions[1].id).toBe('tx-mid');
      expect(result[0].transactions[2].id).toBe('tx-old');
    });

    it('returns empty array for empty transactions', () => {
      const result = groupTransactionsByDate([], mockT);

      expect(result).toHaveLength(0);
    });

    it('handles older dates with formatted date string', () => {
      // 5 days ago
      const fiveDaysAgo = Date.now() - 5 * 86400000;
      const transactions = [
        createMockTransaction({ id: 'tx-old', timestamp: fiveDaysAgo }),
      ];

      const result = groupTransactionsByDate(transactions, mockT);

      expect(result).toHaveLength(1);
      // Should not be "Today" or "Yesterday"
      expect(result[0].date).not.toBe('Today');
      expect(result[0].date).not.toBe('Yesterday');
    });
  });

  describe('filterTransactionsByType', () => {
    const categoryMap: Record<
      PerpsTransaction['type'],
      PerpsTransaction['category']
    > = {
      trade: 'position_open',
      order: 'limit_order',
      funding: 'funding_fee',
      deposit: 'deposit',
      withdrawal: 'withdrawal',
    };

    const createMockTransaction = (
      type: PerpsTransaction['type'],
      id: string,
    ): PerpsTransaction => ({
      id,
      type,
      category: categoryMap[type],
      symbol: 'ETH',
      title: 'Test transaction',
      subtitle: 'Test',
      timestamp: Date.now(),
    });

    const transactions: PerpsTransaction[] = [
      createMockTransaction('trade', 'tx-trade-1'),
      createMockTransaction('trade', 'tx-trade-2'),
      createMockTransaction('order', 'tx-order-1'),
      createMockTransaction('funding', 'tx-funding-1'),
      createMockTransaction('deposit', 'tx-deposit-1'),
      createMockTransaction('withdrawal', 'tx-withdrawal-1'),
    ];

    it('filters by trade type', () => {
      const result = filterTransactionsByType(transactions, 'trade');

      expect(result).toHaveLength(2);
      expect(result.every((tx) => tx.type === 'trade')).toBe(true);
    });

    it('filters by order type', () => {
      const result = filterTransactionsByType(transactions, 'order');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('order');
    });

    it('filters by funding type', () => {
      const result = filterTransactionsByType(transactions, 'funding');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('funding');
    });

    it('filters by deposit type and includes withdrawals', () => {
      const result = filterTransactionsByType(transactions, 'deposit');

      expect(result).toHaveLength(2);
      expect(result.some((tx) => tx.type === 'deposit')).toBe(true);
      expect(result.some((tx) => tx.type === 'withdrawal')).toBe(true);
    });

    it('returns empty array when no transactions match filter', () => {
      const tradesOnly = [
        createMockTransaction('trade', 'tx-1'),
        createMockTransaction('trade', 'tx-2'),
      ];

      const result = filterTransactionsByType(tradesOnly, 'funding');

      expect(result).toHaveLength(0);
    });

    it('returns empty array for empty input', () => {
      const result = filterTransactionsByType([], 'trade');

      expect(result).toHaveLength(0);
    });
  });

  describe('getTransactionStatusColor', () => {
    it('returns SuccessDefault for confirmed status', () => {
      expect(getTransactionStatusColor('confirmed')).toBe(
        TextColor.SuccessDefault,
      );
    });

    it('returns WarningDefault for pending status', () => {
      expect(getTransactionStatusColor('pending')).toBe(
        TextColor.WarningDefault,
      );
    });

    it('returns ErrorDefault for failed status', () => {
      expect(getTransactionStatusColor('failed')).toBe(TextColor.ErrorDefault);
    });
  });

  describe('getTransactionAmountColor', () => {
    it('returns SuccessDefault for positive amounts with + prefix', () => {
      expect(getTransactionAmountColor('+125.00')).toBe(
        TextColor.SuccessDefault,
      );
      expect(getTransactionAmountColor('+0.01')).toBe(TextColor.SuccessDefault);
    });

    it('returns ErrorDefault for negative amounts with - prefix', () => {
      expect(getTransactionAmountColor('-45.50')).toBe(TextColor.ErrorDefault);
      expect(getTransactionAmountColor('-1000.00')).toBe(
        TextColor.ErrorDefault,
      );
    });

    it('returns TextDefault for amounts without prefix', () => {
      expect(getTransactionAmountColor('100.00')).toBe(TextColor.TextDefault);
      expect(getTransactionAmountColor('0')).toBe(TextColor.TextDefault);
    });
  });
});
