import assert from 'assert';
import { ETH } from '../constants/common';
import * as utils from './conversions.util';

describe('conversion utils', function () {
  describe('getWeiHexFromDecimalValue', function () {
    it('should correctly convert 0 in ETH', function () {
      const weiValue = utils.getWeiHexFromDecimalValue({
        value: '0',
        fromCurrency: ETH,
        fromDenomination: ETH,
      });
      assert.strictEqual(weiValue, '0');
    });
  });

  describe('decETHToDecWEI', function () {
    it('should correctly convert 1 ETH to WEI', function () {
      const weiValue = utils.decETHToDecWEI('1');
      assert.strictEqual(weiValue, '1000000000000000000');
    });

    it('should correctly convert 0.000000000000000001 ETH to WEI', function () {
      const weiValue = utils.decETHToDecWEI('0.000000000000000001');
      assert.strictEqual(weiValue, '1');
    });

    it('should correctly convert 1000000.000000000000000001 ETH to WEI', function () {
      const weiValue = utils.decETHToDecWEI('1000000.000000000000000001');
      assert.strictEqual(weiValue, '1000000000000000000000001');
    });

    it('should correctly convert 9876.543210 ETH to WEI', function () {
      const weiValue = utils.decETHToDecWEI('9876.543210');
      assert.strictEqual(weiValue, '9876543210000000000000');
    });

    it('should correctly convert 1.0000000000000000 ETH to WEI', function () {
      const weiValue = utils.decETHToDecWEI('1.0000000000000000');
      assert.strictEqual(weiValue, '1000000000000000000');
    });
  });
});
