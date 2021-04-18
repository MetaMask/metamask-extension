import { ETH } from '../constants/common';
import * as utils from './conversions.util';

describe('conversion utils', () => {
  describe('getWeiHexFromDecimalValue', () => {
    it('should correctly convert 0 in ETH', () => {
      const weiValue = utils.getWeiHexFromDecimalValue({
        value: '0',
        fromCurrency: ETH,
        fromDenomination: ETH,
      });
      expect(weiValue).toStrictEqual('0');
    });
  });

  describe('decETHToDecWEI', () => {
    it('should correctly convert 1 ETH to WEI', () => {
      const weiValue = utils.decETHToDecWEI('1');
      expect(weiValue).toStrictEqual('1000000000000000000');
    });

    it('should correctly convert 0.000000000000000001 ETH to WEI', () => {
      const weiValue = utils.decETHToDecWEI('0.000000000000000001');
      expect(weiValue).toStrictEqual('1');
    });

    it('should correctly convert 1000000.000000000000000001 ETH to WEI', () => {
      const weiValue = utils.decETHToDecWEI('1000000.000000000000000001');
      expect(weiValue).toStrictEqual('1000000000000000000000001');
    });

    it('should correctly convert 9876.543210 ETH to WEI', () => {
      const weiValue = utils.decETHToDecWEI('9876.543210');
      expect(weiValue).toStrictEqual('9876543210000000000000');
    });

    it('should correctly convert 1.0000000000000000 ETH to WEI', () => {
      const weiValue = utils.decETHToDecWEI('1.0000000000000000');
      expect(weiValue).toStrictEqual('1000000000000000000');
    });
  });
});
