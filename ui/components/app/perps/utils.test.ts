import { TextColor } from '@metamask/design-system-react';
import {
  getDisplayName,
  getPositionDirection,
  formatOrderType,
  formatStatus,
  getStatusColor,
  getDisplaySymbol,
  getAssetIconUrl,
  safeDecodeURIComponent,
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
});
