import { BigNumber } from 'bignumber.js';
import { ChainId, getNativeAssetForChainId } from '@metamask/bridge-controller';
import {
  formatTokenAmount,
  formatCurrencyAmount,
  formatProviderLabel,
  getAddressFromAssetIdOrAddress,
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

  describe('getAddressFromAssetIdOrAddress', () => {
    it('should return empty string for undefined input', () => {
      expect(getAddressFromAssetIdOrAddress(undefined)).toBe('');
    });

    it('should return empty string for empty string input', () => {
      expect(getAddressFromAssetIdOrAddress('')).toBe('');
    });

    it('should return plain EVM address unchanged', () => {
      const evmAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      expect(getAddressFromAssetIdOrAddress(evmAddress)).toBe(evmAddress);
    });

    it('should return plain Tron base58 address unchanged', () => {
      const tronAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
      expect(getAddressFromAssetIdOrAddress(tronAddress)).toBe(tronAddress);
    });

    it('should return plain Solana address unchanged', () => {
      const solanaAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      expect(getAddressFromAssetIdOrAddress(solanaAddress)).toBe(solanaAddress);
    });

    it('should extract address from Tron TRC-20 CAIP-19 asset ID', () => {
      const caip19AssetId =
        'tron:728126428/trc20:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
      expect(getAddressFromAssetIdOrAddress(caip19AssetId)).toBe(
        'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      );
    });

    it('should extract address from Solana token CAIP-19 asset ID', () => {
      const caip19AssetId =
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      expect(getAddressFromAssetIdOrAddress(caip19AssetId)).toBe(
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      );
    });

    it('should extract address from EVM ERC-20 CAIP-19 asset ID', () => {
      const caip19AssetId =
        'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
      expect(getAddressFromAssetIdOrAddress(caip19AssetId)).toBe(
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      );
    });

    it('should extract address from native asset CAIP-19 asset ID', () => {
      const caip19AssetId =
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
      expect(getAddressFromAssetIdOrAddress(caip19AssetId)).toBe('501');
    });
  });
});
