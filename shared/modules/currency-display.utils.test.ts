import * as currencyDisplayUtils from './currency-display.utils';
import { getPrimaryValue, getSecondaryValue } from './currency-display.utils';

describe('Currency Display Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('showPrimaryCurrency', () => {
    it('should return true when useNativeCurrencyAsPrimaryCurrency is true', () => {
      const result = currencyDisplayUtils.showPrimaryCurrency(true, true);
      expect(result).toBe(true);
    });

    it('should return true when isOriginalNativeSymbol is true', () => {
      const result = currencyDisplayUtils.showPrimaryCurrency(true, false);
      expect(result).toBe(true);
    });

    it('should return false when useNativeCurrencyAsPrimaryCurrency and isOriginalNativeSymbol are false', () => {
      const result = currencyDisplayUtils.showPrimaryCurrency(false, false);
      expect(result).toBe(false);
    });
  });

  describe('showSecondaryCurrency', () => {
    it('should return true when useNativeCurrencyAsPrimaryCurrency is false', () => {
      const result = currencyDisplayUtils.showSecondaryCurrency(true, false);
      expect(result).toBe(true);
    });

    it('should return true when isOriginalNativeSymbol is true', () => {
      const result = currencyDisplayUtils.showSecondaryCurrency(true, true);
      expect(result).toBe(true);
    });

    it('should return false when useNativeCurrencyAsPrimaryCurrency is true and isOriginalNativeSymbol is false', () => {
      const result = currencyDisplayUtils.showSecondaryCurrency(false, true);
      expect(result).toBe(false);
    });
  });

  describe('getPrimaryValue', () => {
    it('should return primaryCurrencyDisplay when useNativeCurrencyAsPrimaryCurrency is true and showPrimaryCurrency returns true', () => {
      const result = getPrimaryValue({
        useNativeCurrencyAsPrimaryCurrency: true,
        primaryCurrencyDisplay: 'ETH',
        showFiat: true,
        secondaryCurrencyDisplay: 'USD',
        isOriginalNativeSymbol: true,
      });

      expect(result).toBe('ETH');
    });

    it('should return secondaryCurrencyDisplay when useNativeCurrencyAsPrimaryCurrency is false, showFiat is true, and showSecondaryCurrency returns true', () => {
      const result = getPrimaryValue({
        useNativeCurrencyAsPrimaryCurrency: false,
        primaryCurrencyDisplay: 'ETH',
        showFiat: true,
        secondaryCurrencyDisplay: 'USD',
        isOriginalNativeSymbol: true,
      });

      expect(result).toBe('USD');
    });

    it('should return undefined when useNativeCurrencyAsPrimaryCurrency is false and showFiat is false', () => {
      const result = getPrimaryValue({
        useNativeCurrencyAsPrimaryCurrency: false,
        primaryCurrencyDisplay: 'ETH',
        showFiat: false,
        secondaryCurrencyDisplay: 'USD',
        isOriginalNativeSymbol: true,
      });

      expect(result).toBeUndefined();
    });
  });

  describe('getSecondaryValue', () => {
    it('should return secondaryCurrencyDisplay when useNativeCurrencyAsPrimaryCurrency is true and showSecondaryCurrency returns true', () => {
      const result = getSecondaryValue({
        useNativeCurrencyAsPrimaryCurrency: true,
        primaryCurrencyDisplay: 'ETH',
        showFiat: true,
        secondaryCurrencyDisplay: 'USD',
        isOriginalNativeSymbol: true,
      });

      expect(result).toBe('USD');
    });

    it('should return primaryCurrencyDisplay when useNativeCurrencyAsPrimaryCurrency is false, showFiat is true, and showPrimaryCurrency returns true', () => {
      const result = getSecondaryValue({
        useNativeCurrencyAsPrimaryCurrency: false,
        primaryCurrencyDisplay: 'ETH',
        showFiat: true,
        secondaryCurrencyDisplay: 'USD',
        isOriginalNativeSymbol: true,
      });

      expect(result).toBe('ETH');
    });

    it('should return undefined when useNativeCurrencyAsPrimaryCurrency is false and showFiat is false', () => {
      const result = getSecondaryValue({
        useNativeCurrencyAsPrimaryCurrency: false,
        primaryCurrencyDisplay: 'ETH',
        showFiat: false,
        secondaryCurrencyDisplay: 'USD',
        isOriginalNativeSymbol: true,
      });

      expect(result).toBeUndefined();
    });
  });
});
