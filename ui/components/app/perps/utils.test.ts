import { TextColor } from '@metamask/design-system-react';
import {
  getDisplayName,
  getPositionDirection,
  formatOrderType,
  formatStatus,
  getStatusColor,
  formatCurrency,
  formatPnl,
  formatPercentage,
  getDisplaySymbol,
  getAssetIconUrl,
} from './utils';
import { HYPERLIQUID_ASSET_ICONS_BASE_URL } from './constants';

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

  describe('formatCurrency', () => {
    it('formats a number as currency with $ prefix', () => {
      expect(formatCurrency('1234.5')).toBe('$1,234.50');
      expect(formatCurrency('100')).toBe('$100.00');
    });

    it('handles decimal precision', () => {
      expect(formatCurrency('1234.567')).toBe('$1,234.57');
      expect(formatCurrency('0.1')).toBe('$0.10');
    });

    it('handles large numbers', () => {
      expect(formatCurrency('1000000')).toBe('$1,000,000.00');
    });
  });

  describe('formatPnl', () => {
    it('formats positive values with + prefix', () => {
      expect(formatPnl('100.50')).toBe('+$100.50');
      expect(formatPnl('0')).toBe('+$0.00');
    });

    it('formats negative values with - prefix', () => {
      expect(formatPnl('-50.25')).toBe('-$50.25');
      expect(formatPnl('-1000')).toBe('-$1,000.00');
    });

    it('handles decimal precision', () => {
      expect(formatPnl('123.456')).toBe('+$123.46');
      expect(formatPnl('-123.456')).toBe('-$123.46');
    });
  });

  describe('formatPercentage', () => {
    it('formats a value as percentage with 2 decimal places', () => {
      expect(formatPercentage('12.345')).toBe('12.35%');
      expect(formatPercentage('100')).toBe('100.00%');
    });

    it('handles negative percentages', () => {
      expect(formatPercentage('-5.5')).toBe('-5.50%');
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

    it('handles null and invalid inputs', () => {
      // @ts-expect-error Testing null input
      expect(getDisplaySymbol(null)).toBe(null);
      // @ts-expect-error Testing undefined input
      expect(getDisplaySymbol(undefined)).toBe(undefined);
      expect(getDisplaySymbol('')).toBe('');
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
});

