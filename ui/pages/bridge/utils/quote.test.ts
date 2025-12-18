import { BigNumber } from 'bignumber.js';
import { ChainId, getNativeAssetForChainId } from '@metamask/bridge-controller';
import {
  formatTokenAmount,
  formatCurrencyAmount,
  formatProviderLabel,
} from './quote';

describe('Bridge quote utils', () => {
  describe('getNativeAssetForChainId', () => {
    it('should return the native asset for a given chainId', () => {
      const result = getNativeAssetForChainId(ChainId.SOLANA);
      expect(result).toStrictEqual({
        address: '0x0000000000000000000000000000000000000000',
        assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
        chainId: 1151111081099710,
        decimals: 9,
        iconUrl: '',
        name: 'Solana',
        symbol: 'SOL',
      });
    });
  });

  describe('formatTokenAmount', () => {
    it('should format token amount with symbol', () => {
      const locale = 'en-US';
      const amount = '123.456';
      const symbol = 'ETH';

      const result = formatTokenAmount(locale, amount, symbol);

      const expectedAmount = '123.5';
      expect(result).toBe(`${expectedAmount} ${symbol}`);
    });

    it('should format token amount without symbol', () => {
      const locale = 'en-US';
      const amount = '123.456';

      const result = formatTokenAmount(locale, amount);

      const expectedAmount = '123.5';
      expect(result).toBe(expectedAmount);
    });

    it('should handle zero amount', () => {
      const locale = 'en-US';
      const amount = '0';
      const symbol = 'ETH';

      const result = formatTokenAmount(locale, amount, symbol);

      const expectedAmount = new Intl.NumberFormat(locale).format(
        new BigNumber(amount).toNumber(),
      );
      expect(result).toBe(`${expectedAmount} ${symbol}`);
    });
  });

  describe('formatCurrencyAmount', () => {
    it('should return undefined for null input', () => {
      const result = formatCurrencyAmount(null, 'USD');

      expect(result).toBeUndefined();
    });

    it('should format currency amount with default precision', () => {
      const amount = '123.456';
      const currency = 'USD';

      const result = formatCurrencyAmount(amount, currency);

      const expectedAmount = `$${Number(amount).toFixed(6)}`; // DEFAULT_PRECISION is 6
      expect(result).toBe(expectedAmount);
    });

    it('should format currency amount with specified precision', () => {
      const amount = '123.456';
      const currency = 'USD';
      const precision = 2;

      const result = formatCurrencyAmount(amount, currency, precision);

      const expectedAmount = `$${Number(amount).toFixed(precision)}`;
      expect(result).toBe(expectedAmount);
    });

    it('should handle precision 0 with amount less than 0.01', () => {
      const amount = '0.009';
      const currency = 'USD';
      const precision = 0;

      const result = formatCurrencyAmount(amount, currency, precision);

      expect(result).toBe('<$0.01');
    });

    it('should handle precision 0 with amount less than 1', () => {
      const amount = '0.5';
      const currency = 'USD';
      const precision = 0;

      const result = formatCurrencyAmount(amount, currency, precision);

      const expectedAmount = `$${Number(amount).toFixed(2)}`;
      expect(result).toBe(expectedAmount);
    });

    it('should handle precision 0 with amount greater than or equal to 1', () => {
      const amount = '1.5';
      const currency = 'USD';
      const precision = 0;

      const result = formatCurrencyAmount(amount, currency, precision);

      const expectedAmount = `$${Number(amount).toFixed(precision)}`;
      expect(result).toBe(expectedAmount);
    });
  });

  describe('formatProviderLabel', () => {
    it('should format provider label with bridgeId and bridges', () => {
      const args = {
        bridgeId: 'bridge1',
        bridges: ['provider1', 'provider2'],
      };

      const result = formatProviderLabel(args);

      expect(result).toBe('bridge1_provider1');
    });

    it('should handle undefined args', () => {
      const result = formatProviderLabel(undefined);

      expect(result).toBe('undefined_undefined');
    });

    it('should handle empty bridges array', () => {
      const args = {
        bridgeId: 'bridge1',
        bridges: [],
      };

      const result = formatProviderLabel(args);

      expect(result).toBe('bridge1_undefined');
    });
  });
});
