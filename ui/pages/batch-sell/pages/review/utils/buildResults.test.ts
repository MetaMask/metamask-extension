import { CaipAssetType } from '@metamask/utils';
import { BatchSellAsset } from '../../../../../ducks/batch-sell/types';
import { QuoteValidationErrors } from '../../../../../ducks/bridge/types';
import { BatchSellQuotesConfig, ReceivedAsset, SendAssetEntry } from '../types';
import { buildResults } from './buildResults';

const ASSET_ID_A =
  'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as CaipAssetType;
const ASSET_ID_B =
  'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F' as CaipAssetType;

const buildEntry = (
  assetId: CaipAssetType,
  overrides: Partial<SendAssetEntry> = {},
): SendAssetEntry => ({
  assetId,
  asset: { assetId } as BatchSellAsset,
  sendAmountPercent: 100,
  slippagePercent: 0.5,
  enabled: true,
  ...overrides,
});

const buildRecommendedQuote = (overrides: Record<string, unknown> = {}) => ({
  toTokenAmount: { amount: 10, valueInCurrency: 100 },
  minToTokenAmount: { amount: 9 },
  ...overrides,
});

const noValidationErrors: QuoteValidationErrors = {
  isInsufficientGasBalance: false,
  isInsufficientNativeReserve: false,
  isNetworkFeeUnavailable: false,
  isInsufficientGasForQuote: false,
  isInsufficientBalance: false,
  isEstimatedReturnLow: false,
  isPriceImpactWarning: false,
  isPriceImpactError: false,
};

const receivedAsset: ReceivedAsset = {
  id: 'eip155:1/slip44:60' as CaipAssetType,
  symbol: 'ETH',
};

const buildControllerResult = (
  recommendedQuotes: ReturnType<typeof buildRecommendedQuote>[],
) => ({ recommendedQuotes }) as never;

describe('buildResults', () => {
  describe('individual quote entries', () => {
    it('marks a disabled entry as hasQuote:false with isLoadingQuote:false', () => {
      const entries = [buildEntry(ASSET_ID_A, { enabled: false })];
      const result = buildResults({
        controllerResult: buildControllerResult([buildRecommendedQuote()]),
        entries,
        receivedAsset,
        validationErrorsByIndex: [noValidationErrors],
        isLoading: true,
      });

      expect(result.quotes[ASSET_ID_A]).toMatchObject({
        hasQuote: false,
        isLoadingQuote: false,
      });
    });

    it('marks an enabled entry with no recommendedQuote as hasQuote:false', () => {
      const entries = [buildEntry(ASSET_ID_A, { enabled: true })];
      const result = buildResults({
        controllerResult: buildControllerResult([]),
        entries,
        receivedAsset,
        validationErrorsByIndex: [noValidationErrors],
        isLoading: false,
      });

      expect(result.quotes[ASSET_ID_A]).toMatchObject({
        hasQuote: false,
        isLoadingQuote: false,
      });
    });

    it('sets isLoadingQuote:true for an enabled entry with no quote when isLoading is true', () => {
      const entries = [buildEntry(ASSET_ID_A, { enabled: true })];
      const result = buildResults({
        controllerResult: buildControllerResult([]),
        entries,
        receivedAsset,
        validationErrorsByIndex: [noValidationErrors],
        isLoading: true,
      });

      expect(result.quotes[ASSET_ID_A].isLoadingQuote).toBe(true);
    });

    it('marks an enabled entry with a recommendedQuote as hasQuote:true', () => {
      const entries = [buildEntry(ASSET_ID_A)];
      const result = buildResults({
        controllerResult: buildControllerResult([buildRecommendedQuote()]),
        entries,
        receivedAsset,
        validationErrorsByIndex: [noValidationErrors],
        isLoading: false,
      });

      expect(result.quotes[ASSET_ID_A]).toMatchObject({
        hasQuote: true,
        isLoadingQuote: false,
      });
    });

    it('populates receivedAmount, receivedAmountFiat, and minimumReceivedAmount from the quote', () => {
      const entries = [buildEntry(ASSET_ID_A)];
      const quote = buildRecommendedQuote({
        toTokenAmount: { amount: 42, valueInCurrency: 420 },
        minToTokenAmount: { amount: 38 },
      });
      const result = buildResults({
        controllerResult: buildControllerResult([quote]),
        entries,
        receivedAsset,
        validationErrorsByIndex: [noValidationErrors],
        isLoading: false,
      });

      expect(result.quotes[ASSET_ID_A].receivedAmount).toBe(42);
      expect(result.quotes[ASSET_ID_A].receivedAmountFiat).toBe(420);
      expect(result.quotes[ASSET_ID_A].minimumReceivedAmount).toBe(38);
    });

    it('treats missing token amounts as 0 via toFinite', () => {
      const entries = [buildEntry(ASSET_ID_A)];
      const quote = buildRecommendedQuote({
        toTokenAmount: undefined,
        minToTokenAmount: undefined,
      });
      const result = buildResults({
        controllerResult: buildControllerResult([quote]),
        entries,
        receivedAsset,
        validationErrorsByIndex: [noValidationErrors],
        isLoading: false,
      });

      expect(result.quotes[ASSET_ID_A].receivedAmount).toBe(0);
      expect(result.quotes[ASSET_ID_A].receivedAmountFiat).toBe(0);
      expect(result.quotes[ASSET_ID_A].minimumReceivedAmount).toBe(0);
    });

    it('sets slippagePercent from the entry', () => {
      const entries = [buildEntry(ASSET_ID_A, { slippagePercent: 2.5 })];
      const result = buildResults({
        controllerResult: buildControllerResult([buildRecommendedQuote()]),
        entries,
        receivedAsset,
        validationErrorsByIndex: [noValidationErrors],
        isLoading: false,
      });

      expect(result.quotes[ASSET_ID_A].slippagePercent).toBe(2.5);
    });

    it('sets hasHighPriceImpactWarning when isPriceImpactWarning is true', () => {
      const entries = [buildEntry(ASSET_ID_A)];
      const result = buildResults({
        controllerResult: buildControllerResult([buildRecommendedQuote()]),
        entries,
        receivedAsset,
        validationErrorsByIndex: [
          { ...noValidationErrors, isPriceImpactWarning: true },
        ],
        isLoading: false,
      });

      expect(result.quotes[ASSET_ID_A].hasHighPriceImpactWarning).toBe(true);
    });

    it('sets hasHighPriceImpactWarning when isPriceImpactError is true', () => {
      const entries = [buildEntry(ASSET_ID_A)];
      const result = buildResults({
        controllerResult: buildControllerResult([buildRecommendedQuote()]),
        entries,
        receivedAsset,
        validationErrorsByIndex: [
          { ...noValidationErrors, isPriceImpactError: true },
        ],
        isLoading: false,
      });

      expect(result.quotes[ASSET_ID_A].hasHighPriceImpactWarning).toBe(true);
    });

    it('sets hasHighPriceImpactWarning to false when no price-impact flags are set', () => {
      const entries = [buildEntry(ASSET_ID_A)];
      const result = buildResults({
        controllerResult: buildControllerResult([buildRecommendedQuote()]),
        entries,
        receivedAsset,
        validationErrorsByIndex: [noValidationErrors],
        isLoading: false,
      });

      expect(result.quotes[ASSET_ID_A].hasHighPriceImpactWarning).toBe(false);
    });
  });

  describe('totals', () => {
    it('returns undefined totals when no enabled entries have quotes', () => {
      const entries = [buildEntry(ASSET_ID_A, { enabled: true })];
      const result = buildResults({
        controllerResult: buildControllerResult([]),
        entries,
        receivedAsset,
        validationErrorsByIndex: [noValidationErrors],
        isLoading: false,
      });

      expect(result.totalReceivedAmount).toBeUndefined();
      expect(result.totalReceivedAmountFiat).toBeUndefined();
      expect(result.minimumReceivedAmount).toBeUndefined();
    });

    it('sums totals across all enabled quotes', () => {
      const entries = [buildEntry(ASSET_ID_A), buildEntry(ASSET_ID_B)];
      const quotes = [
        buildRecommendedQuote({
          toTokenAmount: { amount: 10, valueInCurrency: 100 },
          minToTokenAmount: { amount: 9 },
        }),
        buildRecommendedQuote({
          toTokenAmount: { amount: 5, valueInCurrency: 50 },
          minToTokenAmount: { amount: 4 },
        }),
      ];
      const result = buildResults({
        controllerResult: buildControllerResult(quotes),
        entries,
        receivedAsset,
        validationErrorsByIndex: [noValidationErrors, noValidationErrors],
        isLoading: false,
      });

      expect(result.totalReceivedAmount).toBe(15);
      expect(result.totalReceivedAmountFiat).toBe(150);
      expect(result.minimumReceivedAmount).toBe(13);
    });

    it('excludes disabled entries from the totals', () => {
      const entries = [
        buildEntry(ASSET_ID_A, { enabled: true }),
        buildEntry(ASSET_ID_B, { enabled: false }),
      ];
      const quotes = [
        buildRecommendedQuote({
          toTokenAmount: { amount: 10, valueInCurrency: 100 },
          minToTokenAmount: { amount: 9 },
        }),
        buildRecommendedQuote({
          toTokenAmount: { amount: 99, valueInCurrency: 999 },
          minToTokenAmount: { amount: 88 },
        }),
      ];
      const result = buildResults({
        controllerResult: buildControllerResult(quotes),
        entries,
        receivedAsset,
        validationErrorsByIndex: [noValidationErrors, noValidationErrors],
        isLoading: false,
      });

      expect(result.totalReceivedAmount).toBe(10);
      expect(result.totalReceivedAmountFiat).toBe(100);
      expect(result.minimumReceivedAmount).toBe(9);
    });
  });

  describe('top-level shape', () => {
    it('passes receivedAsset through unchanged', () => {
      const result = buildResults({
        controllerResult: buildControllerResult([]),
        entries: [],
        receivedAsset,
        validationErrorsByIndex: [],
        isLoading: false,
      });

      expect(result.receivedAsset).toStrictEqual(receivedAsset);
    });

    it('returns an entry in quotes for every entry in the input', () => {
      const entries = [buildEntry(ASSET_ID_A), buildEntry(ASSET_ID_B)];
      const result = buildResults({
        controllerResult: buildControllerResult([
          buildRecommendedQuote(),
          buildRecommendedQuote(),
        ]),
        entries,
        receivedAsset,
        validationErrorsByIndex: [noValidationErrors, noValidationErrors],
        isLoading: false,
      });

      expect(Object.keys(result.quotes)).toHaveLength(2);
      expect(result.quotes[ASSET_ID_A]).toBeDefined();
      expect(result.quotes[ASSET_ID_B]).toBeDefined();
    });
  });
});
