import { getCustomGasPrice } from './custom-gas';

describe('custom-gas selectors', () => {
  describe('getCustomGasPrice()', () => {
    it('should return gas.customData.price', () => {
      const mockState = {
        gas: { customData: { price: 'mockPrice' } },
      };
      expect(getCustomGasPrice(mockState)).toStrictEqual('mockPrice');
    });
  });
  // Legacy selectors removed:
  // - isCustomPriceSafe
  // - getCustomGasLimit
});
