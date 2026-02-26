import { GasEstimateTypes } from '../../shared/constants/gas';
import { CHAIN_IDS } from '../../shared/constants/network';
import { mockNetworkState } from '../../test/stub/networks';
import {
  getCustomGasLimit,
  getCustomGasPrice,
  isCustomPriceSafe,
} from './custom-gas';

describe('custom-gas selectors', () => {
  describe('getCustomGasPrice()', () => {
    it('should return gas.customData.price', () => {
      const mockState = {
        gas: { customData: { price: 'mockPrice' } },
      };
      expect(getCustomGasPrice(mockState)).toStrictEqual('mockPrice');
    });
  });
  describe('isCustomGasPriceSafe()', () => {
    it('should return true for gas.customData.price 0x77359400', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GasEstimateTypes.legacy,
          gasFeeEstimates: {
            low: '1',
          },
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
        },
        gas: {
          customData: { price: '0x77359400' },
        },
      };
      expect(isCustomPriceSafe(mockState)).toStrictEqual(true);
    });
    it('should return true for gas.customData.price null', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GasEstimateTypes.legacy,
          gasFeeEstimates: {
            low: '1',
          },
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
        },
        gas: {
          customData: { price: null },
        },
      };
      expect(isCustomPriceSafe(mockState)).toStrictEqual(true);
    });
    it('should return true gas.customData.price undefined', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GasEstimateTypes.legacy,
          gasFeeEstimates: {
            low: '1',
          },
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
        },
        gas: {
          customData: { price: undefined },
        },
      };
      expect(isCustomPriceSafe(mockState)).toStrictEqual(true);
    });
    it('should return false gas.basicEstimates.safeLow undefined', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GasEstimateTypes.none,
          gasFeeEstimates: {
            low: undefined,
          },
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
        },
        gas: {
          customData: { price: '0x77359400' },
        },
      };
      expect(isCustomPriceSafe(mockState)).toStrictEqual(false);
    });
  });

  describe('getCustomGasLimit()', () => {
    it('should return gas.customData.limit', () => {
      const mockState = { gas: { customData: { limit: 'mockLimit' } } };
      expect(getCustomGasLimit(mockState)).toStrictEqual('mockLimit');
    });
  });
});
