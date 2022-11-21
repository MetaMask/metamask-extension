import { CHAIN_IDS } from '../../../shared/constants/network';
import { formatMoonpaySymbol } from './moonpay';

describe('Moonpay Utils', () => {
  describe('formatMoonpaySymbol', () => {
    it('should return the same input if falsy input is provided', () => {
      expect(formatMoonpaySymbol()).toBe(undefined);
      expect(formatMoonpaySymbol(null)).toBe(null);
      expect(formatMoonpaySymbol('')).toBe('');
    });

    it('should return the symbol in uppercase if no chainId is provided', () => {
      const result = formatMoonpaySymbol('ETH');
      expect(result).toStrictEqual('ETH');
    });

    it('should return the symbol in uppercase if chainId is different than Avalanche/BSC/Polygon', () => {
      const result = formatMoonpaySymbol('ETH', CHAIN_IDS.MAINNET);
      expect(result).toStrictEqual('ETH');
      const result2 = formatMoonpaySymbol('CELO', CHAIN_IDS.CELO);
      expect(result2).toStrictEqual('CELO');
    });

    it('should return the symbol in uppercase with the network name if chainId is Avalanche/BSC/Polygon', () => {
      const result = formatMoonpaySymbol('BNB', CHAIN_IDS.BSC);
      expect(result).toStrictEqual('BNB_BSC');
      const result2 = formatMoonpaySymbol('MATIC', CHAIN_IDS.POLYGON);
      expect(result2).toStrictEqual('MATIC_POLYGON');
      const result3 = formatMoonpaySymbol('AVAX', CHAIN_IDS.AVALANCHE);
      expect(result3).toStrictEqual('AVAX_CCHAIN');
    });
  });
});
