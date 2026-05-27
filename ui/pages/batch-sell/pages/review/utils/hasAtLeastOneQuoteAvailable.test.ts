import {
  BATCH_SELL_ASSET_IDS,
  buildSendAssetConfigEntry,
  buildQuoteEntry,
} from '../../../../../../test/data/batch-sell';
import type { BatchSellQuotesConfig, BatchSellQuotesResults } from '../types';
import { hasAtLeastOneQuoteAvailable } from './hasAtLeastOneQuoteAvailable';

type SendAssetsConfig = BatchSellQuotesConfig['sendAssetsConfig'];
type Quotes = BatchSellQuotesResults['quotes'];

const ASSET_ID_A = BATCH_SELL_ASSET_IDS.USDC;
const ASSET_ID_B = BATCH_SELL_ASSET_IDS.DAI;

describe('hasAtLeastOneQuoteAvailable', () => {
  describe('when there are no enabled assets', () => {
    it('returns false even when a quote is available', () => {
      const sendAssetsConfig: SendAssetsConfig = {
        [ASSET_ID_A]: buildSendAssetConfigEntry(false),
      };
      const quotes: Quotes = {
        [ASSET_ID_A]: buildQuoteEntry(true),
      };

      expect(hasAtLeastOneQuoteAvailable(sendAssetsConfig, quotes)).toBe(false);
    });

    it('returns false when quotes is undefined', () => {
      const sendAssetsConfig: SendAssetsConfig = {
        [ASSET_ID_A]: buildSendAssetConfigEntry(false),
      };

      expect(hasAtLeastOneQuoteAvailable(sendAssetsConfig, undefined)).toBe(
        false,
      );
    });
  });

  describe('when there is at least one enabled asset', () => {
    it('returns true when a quote is available for an enabled asset', () => {
      const sendAssetsConfig: SendAssetsConfig = {
        [ASSET_ID_A]: buildSendAssetConfigEntry(true),
      };
      const quotes: Quotes = {
        [ASSET_ID_A]: buildQuoteEntry(true),
      };

      expect(hasAtLeastOneQuoteAvailable(sendAssetsConfig, quotes)).toBe(true);
    });

    it('returns false when no quotes are available', () => {
      const sendAssetsConfig: SendAssetsConfig = {
        [ASSET_ID_A]: buildSendAssetConfigEntry(true),
      };
      const quotes: Quotes = {
        [ASSET_ID_A]: buildQuoteEntry(false),
      };

      expect(hasAtLeastOneQuoteAvailable(sendAssetsConfig, quotes)).toBe(false);
    });

    it('returns false when quotes is undefined', () => {
      const sendAssetsConfig: SendAssetsConfig = {
        [ASSET_ID_A]: buildSendAssetConfigEntry(true),
      };

      expect(hasAtLeastOneQuoteAvailable(sendAssetsConfig, undefined)).toBe(
        false,
      );
    });

    it('returns false when quotes is empty', () => {
      const sendAssetsConfig: SendAssetsConfig = {
        [ASSET_ID_A]: buildSendAssetConfigEntry(true),
      };

      expect(hasAtLeastOneQuoteAvailable(sendAssetsConfig, {})).toBe(false);
    });

    it('returns true when at least one of multiple quotes is available', () => {
      const sendAssetsConfig: SendAssetsConfig = {
        [ASSET_ID_A]: buildSendAssetConfigEntry(true),
        [ASSET_ID_B]: buildSendAssetConfigEntry(true),
      };
      const quotes: Quotes = {
        [ASSET_ID_A]: buildQuoteEntry(false),
        [ASSET_ID_B]: buildQuoteEntry(true),
      };

      expect(hasAtLeastOneQuoteAvailable(sendAssetsConfig, quotes)).toBe(true);
    });

    it('returns false when all quotes are unavailable', () => {
      const sendAssetsConfig: SendAssetsConfig = {
        [ASSET_ID_A]: buildSendAssetConfigEntry(true),
        [ASSET_ID_B]: buildSendAssetConfigEntry(true),
      };
      const quotes: Quotes = {
        [ASSET_ID_A]: buildQuoteEntry(false),
        [ASSET_ID_B]: buildQuoteEntry(false),
      };

      expect(hasAtLeastOneQuoteAvailable(sendAssetsConfig, quotes)).toBe(false);
    });

    it('returns true when a quote is available even if another asset is disabled', () => {
      const sendAssetsConfig: SendAssetsConfig = {
        [ASSET_ID_A]: buildSendAssetConfigEntry(true),
        [ASSET_ID_B]: buildSendAssetConfigEntry(false),
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
