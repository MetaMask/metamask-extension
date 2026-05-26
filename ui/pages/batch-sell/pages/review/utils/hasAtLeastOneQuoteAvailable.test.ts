import { CaipAssetType } from '@metamask/utils';
import { BatchSellQuotesConfig, BatchSellQuotesResults } from '../types';
import { hasAtLeastOneQuoteAvailable } from './hasAtLeastOneQuoteAvailable';

type SendAssetsConfig = BatchSellQuotesConfig['sendAssetsConfig'];
type AssetConfig = SendAssetsConfig[CaipAssetType];
type Quotes = BatchSellQuotesResults['quotes'];
type QuoteEntry = Quotes[CaipAssetType];

const ASSET_ID_A =
  'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as CaipAssetType;
const ASSET_ID_B =
  'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F' as CaipAssetType;

const buildAssetConfig = (enabled: boolean): AssetConfig => ({
  asset: {} as AssetConfig['asset'],
  sendAmountPercent: 100,
  slippagePercent: 0.5,
  enabled,
});

const buildQuoteEntry = (hasQuote: boolean): QuoteEntry => ({
  asset: {} as QuoteEntry['asset'],
  quote: {} as QuoteEntry['quote'],
  hasQuote,
  isLoadingQuote: false,
});

describe('hasAtLeastOneQuoteAvailable', () => {
  describe('when there are no enabled assets', () => {
    it('returns false even when a quote is available', () => {
      const sendAssetsConfig: SendAssetsConfig = {
        [ASSET_ID_A]: buildAssetConfig(false),
      };
      const quotes: Quotes = {
        [ASSET_ID_A]: buildQuoteEntry(true),
      };

      expect(hasAtLeastOneQuoteAvailable(sendAssetsConfig, quotes)).toBe(false);
    });

    it('returns false when quotes is undefined', () => {
      const sendAssetsConfig: SendAssetsConfig = {
        [ASSET_ID_A]: buildAssetConfig(false),
      };

      expect(hasAtLeastOneQuoteAvailable(sendAssetsConfig, undefined)).toBe(
        false,
      );
    });
  });

  describe('when there is at least one enabled asset', () => {
    it('returns true when a quote is available for an enabled asset', () => {
      const sendAssetsConfig: SendAssetsConfig = {
        [ASSET_ID_A]: buildAssetConfig(true),
      };
      const quotes: Quotes = {
        [ASSET_ID_A]: buildQuoteEntry(true),
      };

      expect(hasAtLeastOneQuoteAvailable(sendAssetsConfig, quotes)).toBe(true);
    });

    it('returns false when no quotes are available', () => {
      const sendAssetsConfig: SendAssetsConfig = {
        [ASSET_ID_A]: buildAssetConfig(true),
      };
      const quotes: Quotes = {
        [ASSET_ID_A]: buildQuoteEntry(false),
      };

      expect(hasAtLeastOneQuoteAvailable(sendAssetsConfig, quotes)).toBe(false);
    });

    it('returns false when quotes is undefined', () => {
      const sendAssetsConfig: SendAssetsConfig = {
        [ASSET_ID_A]: buildAssetConfig(true),
      };

      expect(hasAtLeastOneQuoteAvailable(sendAssetsConfig, undefined)).toBe(
        false,
      );
    });

    it('returns false when quotes is empty', () => {
      const sendAssetsConfig: SendAssetsConfig = {
        [ASSET_ID_A]: buildAssetConfig(true),
      };

      expect(hasAtLeastOneQuoteAvailable(sendAssetsConfig, {})).toBe(false);
    });

    it('returns true when at least one of multiple quotes is available', () => {
      const sendAssetsConfig: SendAssetsConfig = {
        [ASSET_ID_A]: buildAssetConfig(true),
        [ASSET_ID_B]: buildAssetConfig(true),
      };
      const quotes: Quotes = {
        [ASSET_ID_A]: buildQuoteEntry(false),
        [ASSET_ID_B]: buildQuoteEntry(true),
      };

      expect(hasAtLeastOneQuoteAvailable(sendAssetsConfig, quotes)).toBe(true);
    });

    it('returns false when all quotes are unavailable', () => {
      const sendAssetsConfig: SendAssetsConfig = {
        [ASSET_ID_A]: buildAssetConfig(true),
        [ASSET_ID_B]: buildAssetConfig(true),
      };
      const quotes: Quotes = {
        [ASSET_ID_A]: buildQuoteEntry(false),
        [ASSET_ID_B]: buildQuoteEntry(false),
      };

      expect(hasAtLeastOneQuoteAvailable(sendAssetsConfig, quotes)).toBe(false);
    });

    it('returns true when a quote is available even if another asset is disabled', () => {
      const sendAssetsConfig: SendAssetsConfig = {
        [ASSET_ID_A]: buildAssetConfig(true),
        [ASSET_ID_B]: buildAssetConfig(false),
      };
      const quotes: Quotes = {
        [ASSET_ID_A]: buildQuoteEntry(true),
        [ASSET_ID_B]: buildQuoteEntry(false),
      };

      expect(hasAtLeastOneQuoteAvailable(sendAssetsConfig, quotes)).toBe(true);
    });
  });

  describe('when sendAssetsConfig is empty', () => {
    it('returns false regardless of quotes', () => {
      const sendAssetsConfig: SendAssetsConfig = {};
      const quotes: Quotes = {
        [ASSET_ID_A]: buildQuoteEntry(true),
      };

      expect(hasAtLeastOneQuoteAvailable(sendAssetsConfig, quotes)).toBe(false);
    });
  });
});
