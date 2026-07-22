import {
  BATCH_SELL_ASSET_IDS,
  noValidationErrors,
  buildSendAssetEntry,
  buildReceivedAsset,
  buildRecommendedQuote,
  buildBatchSellControllerResult,
} from '../../../../../../test/data/batch-sell';
import { buildResults } from './buildResults';

const ASSET_ID_A = BATCH_SELL_ASSET_IDS.USDC;
const ASSET_ID_B = BATCH_SELL_ASSET_IDS.DAI;

describe('buildResults', () => {
  describe('individual quote entries', () => {
    it('marks a disabled entry as hasQuote:false with isLoadingQuote:false', () => {
      const entries = [
        buildSendAssetEntry({ assetId: ASSET_ID_A, enabled: false }),
      ];
      const result = buildResults({
        controllerResult: buildBatchSellControllerResult([
          buildRecommendedQuote(),
        ]),
        entries,
        receivedAsset: buildReceivedAsset(),
        validationErrorsByIndex: [noValidationErrors],
        isLoading: true,
      });

      expect(result.quotes[ASSET_ID_A]).toMatchObject({
        hasQuote: false,
        isLoadingQuote: false,
      });
    });

    it('marks an enabled entry with no recommendedQuote as hasQuote:false', () => {
      const entries = [
        buildSendAssetEntry({ assetId: ASSET_ID_A, enabled: true }),
      ];
      const result = buildResults({
        controllerResult: buildBatchSellControllerResult([]),
        entries,
        receivedAsset: buildReceivedAsset(),
        validationErrorsByIndex: [noValidationErrors],
        isLoading: false,
      });

      expect(result.quotes[ASSET_ID_A]).toMatchObject({
        hasQuote: false,
        isLoadingQuote: false,
      });
    });

    it('sets isLoadingQuote:true for an enabled entry with no quote when isLoading is true', () => {
      const entries = [
        buildSendAssetEntry({ assetId: ASSET_ID_A, enabled: true }),
      ];
      const result = buildResults({
        controllerResult: buildBatchSellControllerResult([]),
        entries,
        receivedAsset: buildReceivedAsset(),
        validationErrorsByIndex: [noValidationErrors],
        isLoading: true,
      });

      expect(result.quotes[ASSET_ID_A].isLoadingQuote).toBe(true);
    });

    it('marks an enabled entry with a recommendedQuote as hasQuote:true', () => {
      const entries = [buildSendAssetEntry({ assetId: ASSET_ID_A })];
      const result = buildResults({
        controllerResult: buildBatchSellControllerResult([
          buildRecommendedQuote(),
        ]),
        entries,
        receivedAsset: buildReceivedAsset(),
        validationErrorsByIndex: [noValidationErrors],
        isLoading: false,
      });

      expect(result.quotes[ASSET_ID_A]).toMatchObject({
        hasQuote: true,
        isLoadingQuote: false,
      });
    });

    it('populates receivedAmount, receivedAmountFiat, and minimumReceivedAmount from the quote', () => {
      const entries = [buildSendAssetEntry({ assetId: ASSET_ID_A })];
      const quote = buildRecommendedQuote({
        dest: {
          amount: '42000000',
          normalizedAmount: '42',
          valueInCurrency: '420',
          minAmount: '38000000',
          minAmountNormalized: '38',
        },
      });
      const result = buildResults({
        controllerResult: buildBatchSellControllerResult([quote]),
        entries,
        receivedAsset: buildReceivedAsset(),
        validationErrorsByIndex: [noValidationErrors],
        isLoading: false,
      });

      expect(result.quotes[ASSET_ID_A].receivedAmount).toBe(42);
      expect(result.quotes[ASSET_ID_A].receivedAmountFiat).toBe(420);
      expect(result.quotes[ASSET_ID_A].minimumReceivedAmount).toBe(38);
    });

    it('treats missing token amounts as 0 via toFinite', () => {
      const entries = [buildSendAssetEntry({ assetId: ASSET_ID_A })];
      const quote = buildRecommendedQuote({
        dest: {},
      });
      const result = buildResults({
        controllerResult: buildBatchSellControllerResult([quote]),
        entries,
        receivedAsset: buildReceivedAsset(),
        validationErrorsByIndex: [noValidationErrors],
        isLoading: false,
      });

      expect(result.quotes[ASSET_ID_A].receivedAmount).toBe(0);
      expect(result.quotes[ASSET_ID_A].receivedAmountFiat).toBe(0);
      expect(result.quotes[ASSET_ID_A].minimumReceivedAmount).toBe(0);
    });

    it('sets slippagePercent from the entry', () => {
      const entries = [
        buildSendAssetEntry({ assetId: ASSET_ID_A, slippagePercent: 2.5 }),
      ];
      const result = buildResults({
        controllerResult: buildBatchSellControllerResult([
          buildRecommendedQuote(),
        ]),
        entries,
        receivedAsset: buildReceivedAsset(),
        validationErrorsByIndex: [noValidationErrors],
        isLoading: false,
      });

      expect(result.quotes[ASSET_ID_A].slippagePercent).toBe(2.5);
    });

    it('sets hasHighPriceImpactWarning when isPriceImpactWarning is true', () => {
      const entries = [buildSendAssetEntry({ assetId: ASSET_ID_A })];
      const result = buildResults({
        controllerResult: buildBatchSellControllerResult([
          buildRecommendedQuote(),
        ]),
        entries,
        receivedAsset: buildReceivedAsset(),
        validationErrorsByIndex: [
          { ...noValidationErrors, isPriceImpactWarning: true },
        ],
        isLoading: false,
      });

      expect(result.quotes[ASSET_ID_A].hasHighPriceImpactWarning).toBe(true);
    });

    it('sets hasHighPriceImpactWarning when isPriceImpactError is true', () => {
      const entries = [buildSendAssetEntry({ assetId: ASSET_ID_A })];
      const result = buildResults({
        controllerResult: buildBatchSellControllerResult([
          buildRecommendedQuote(),
        ]),
        entries,
        receivedAsset: buildReceivedAsset(),
        validationErrorsByIndex: [
          { ...noValidationErrors, isPriceImpactError: true },
        ],
        isLoading: false,
      });

      expect(result.quotes[ASSET_ID_A].hasHighPriceImpactWarning).toBe(true);
    });

    it('sets hasHighPriceImpactWarning to false when no price-impact flags are set', () => {
      const entries = [buildSendAssetEntry({ assetId: ASSET_ID_A })];
      const result = buildResults({
        controllerResult: buildBatchSellControllerResult([
          buildRecommendedQuote(),
        ]),
        entries,
        receivedAsset: buildReceivedAsset(),
        validationErrorsByIndex: [noValidationErrors],
        isLoading: false,
      });

      expect(result.quotes[ASSET_ID_A].hasHighPriceImpactWarning).toBe(false);
    });
  });

  describe('totals', () => {
    it('returns undefined totals when no enabled entries have quotes', () => {
      const entries = [
        buildSendAssetEntry({ assetId: ASSET_ID_A, enabled: true }),
      ];
      const result = buildResults({
        controllerResult: buildBatchSellControllerResult([]),
        entries,
        receivedAsset: buildReceivedAsset(),
        validationErrorsByIndex: [noValidationErrors],
        isLoading: false,
      });

      expect(result.totalReceivedAmount).toBeUndefined();
      expect(result.totalReceivedAmountFiat).toBeUndefined();
      expect(result.minimumReceivedAmount).toBeUndefined();
    });

    it('sums totals across all enabled quotes', () => {
      const entries = [
        buildSendAssetEntry({ assetId: ASSET_ID_A }),
        buildSendAssetEntry({ assetId: ASSET_ID_B }),
      ];
      const quotes = [
        buildRecommendedQuote({
          dest: {
            amount: '10000000',
            normalizedAmount: '10',
            valueInCurrency: '100',
            minAmountNormalized: '9',
            minAmount: '9000000',
          },
        }),
        buildRecommendedQuote({
          dest: {
            amount: '5000000',
            normalizedAmount: '5',
            valueInCurrency: '50',
            minAmountNormalized: '4',
            minAmount: '4000000',
          },
        }),
      ];
      const result = buildResults({
        controllerResult: buildBatchSellControllerResult(quotes),
        entries,
        receivedAsset: buildReceivedAsset(),
        validationErrorsByIndex: [noValidationErrors, noValidationErrors],
        isLoading: false,
      });

      expect(result.totalReceivedAmount).toBe(15);
      expect(result.totalReceivedAmountFiat).toBe(150);
      expect(result.minimumReceivedAmount).toBe(13);
    });

    it('reads the controller totals directly without re-summing per slot', () => {
      // Disabled entries are never sent to the controller, so the controller
      // result only carries the enabled slot's quote. `buildResults` must use
      // the controller's pre-aggregated totals as-is.
      const entries = [
        buildSendAssetEntry({ assetId: ASSET_ID_A, enabled: true }),
        buildSendAssetEntry({ assetId: ASSET_ID_B, enabled: false }),
      ];
      const enabledQuote = buildRecommendedQuote({
        dest: {
          amount: '10000000',
          normalizedAmount: '10',
          valueInCurrency: '100',
          minAmountNormalized: '9',
          minAmount: '9000000',
        },
      });
      const result = buildResults({
        controllerResult: buildBatchSellControllerResult([enabledQuote]),
        entries,
        receivedAsset: buildReceivedAsset(),
        validationErrorsByIndex: [noValidationErrors],
        isLoading: false,
      });

      console.log(result);
      expect(result.quotes[ASSET_ID_B].hasQuote).toBe(false);
      expect(result.totalReceivedAmount).toBe(10);
      expect(result.totalReceivedAmountFiat).toBe(100);
      expect(result.minimumReceivedAmount).toBe(9);
    });

    it('uses controller totals even when they differ from the per-slot quotes', () => {
      const entries = [buildSendAssetEntry({ assetId: ASSET_ID_A })];
      const result = buildResults({
        controllerResult: {
          recommendedQuotes: [buildRecommendedQuote()],
          totalReceived: {
            amount: '42000000',
            normalizedAmount: '42',
            valueInCurrency: '420',
            usd: '0',
          },
          minimumReceived: {
            amount: '38000000',
            normalizedAmount: '38',
            valueInCurrency: '0',
            usd: '0',
          },
        },
        entries,
        receivedAsset: buildReceivedAsset(),
        validationErrorsByIndex: [noValidationErrors],
        isLoading: false,
      });

      expect(result.totalReceivedAmount).toBe(42);
      expect(result.totalReceivedAmountFiat).toBe(420);
      expect(result.minimumReceivedAmount).toBe(38);
    });
  });

  describe('top-level shape', () => {
    it('passes receivedAsset through unchanged', () => {
      const receivedAsset = buildReceivedAsset();
      const result = buildResults({
        controllerResult: buildBatchSellControllerResult([]),
        entries: [],
        receivedAsset,
        validationErrorsByIndex: [],
        isLoading: false,
      });

      expect(result.receivedAsset).toStrictEqual(receivedAsset);
    });

    it('returns an entry in quotes for every entry in the input', () => {
      const entries = [
        buildSendAssetEntry({ assetId: ASSET_ID_A }),
        buildSendAssetEntry({ assetId: ASSET_ID_B }),
      ];
      const result = buildResults({
        controllerResult: buildBatchSellControllerResult([
          buildRecommendedQuote(),
          buildRecommendedQuote(),
        ]),
        entries,
        receivedAsset: buildReceivedAsset(),
        validationErrorsByIndex: [noValidationErrors, noValidationErrors],
        isLoading: false,
      });

      expect(Object.keys(result.quotes)).toHaveLength(2);
      expect(result.quotes[ASSET_ID_A]).toBeDefined();
      expect(result.quotes[ASSET_ID_B]).toBeDefined();
    });
  });
});
