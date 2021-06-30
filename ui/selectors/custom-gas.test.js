import { GAS_LIMITS } from '../../shared/constants/gas';
import {
  getCustomGasLimit,
  getCustomGasPrice,
  getRenderableBasicEstimateData,
  getRenderableEstimateDataForSmallButtonsFromGWEI,
  isCustomPriceSafe,
  isCustomPriceExcessive,
} from './custom-gas';

describe('custom-gas selectors', () => {
  describe('getCustomGasPrice()', () => {
    it('should return gas.customData.price', () => {
      const mockState = { gas: { customData: { price: 'mockPrice' } } };
      expect(getCustomGasPrice(mockState)).toStrictEqual('mockPrice');
    });
  });
  describe('isCustomGasPriceSafe()', () => {
    it('should return true for gas.customData.price 0x77359400', () => {
      const mockState = {
        gas: {
          customData: { price: '0x77359400' },
          basicEstimates: { safeLow: 1 },
        },
      };
      expect(isCustomPriceSafe(mockState)).toStrictEqual(true);
    });
    it('should return true for gas.customData.price null', () => {
      const mockState = {
        gas: {
          customData: { price: null },
          basicEstimates: { safeLow: 1 },
        },
      };
      expect(isCustomPriceSafe(mockState)).toStrictEqual(true);
    });
    it('should return true gas.customData.price undefined', () => {
      const mockState = {
        gas: {
          customData: { price: undefined },
          basicEstimates: { safeLow: 1 },
        },
      };
      expect(isCustomPriceSafe(mockState)).toStrictEqual(true);
    });
    it('should return false gas.basicEstimates.safeLow undefined', () => {
      const mockState = {
        gas: {
          customData: { price: '0x77359400' },
          basicEstimates: { safeLow: undefined },
        },
      };
      expect(isCustomPriceSafe(mockState)).toStrictEqual(false);
    });
  });

  describe('isCustomPriceExcessive()', () => {
    it('should return false for gas.customData.price null', () => {
      const mockState = {
        gas: {
          customData: { price: null },
          basicEstimates: { fast: 150 },
        },
      };
      expect(isCustomPriceExcessive(mockState)).toStrictEqual(false);
    });
    it('should return false gas.basicEstimates.fast undefined', () => {
      const mockState = {
        gas: {
          customData: { price: '0x77359400' },
          basicEstimates: { fast: undefined },
        },
      };
      expect(isCustomPriceExcessive(mockState)).toStrictEqual(false);
    });
    it('should return false gas.basicEstimates.price 0x205d0bae00 (139)', () => {
      const mockState = {
        gas: {
          customData: { price: '0x205d0bae00' },
          basicEstimates: { fast: 139 },
        },
      };
      expect(isCustomPriceExcessive(mockState)).toStrictEqual(false);
    });
    it('should return false gas.basicEstimates.price 0x1bf08eb000 (120)', () => {
      const mockState = {
        gas: {
          customData: { price: '0x1bf08eb000' },
          basicEstimates: { fast: 139 },
        },
      };
      expect(isCustomPriceExcessive(mockState)).toStrictEqual(false);
    });
    it('should return false gas.basicEstimates.price 0x28bed01600 (175)', () => {
      const mockState = {
        gas: {
          customData: { price: '0x28bed01600' },
          basicEstimates: { fast: 139 },
        },
      };
      expect(isCustomPriceExcessive(mockState)).toStrictEqual(false);
    });
    it('should return true gas.basicEstimates.price 0x30e4f9b400 (210)', () => {
      const mockState = {
        gas: {
          customData: { price: '0x30e4f9b400' },
          basicEstimates: { fast: 139 },
        },
      };
      expect(isCustomPriceExcessive(mockState)).toStrictEqual(true);
    });
    it('should return false gas.basicEstimates.price 0x28bed01600 (175) (checkSend=true)', () => {
      const mockState = {
        send: {
          gas: {
            gasPrice: '0x28bed0160',
          },
        },
        gas: {
          customData: { price: null },
          basicEstimates: { fast: 139 },
        },
      };
      expect(isCustomPriceExcessive(mockState, true)).toStrictEqual(false);
    });
    it('should return true gas.basicEstimates.price 0x30e4f9b400 (210) (checkSend=true)', () => {
      const mockState = {
        send: {
          gas: {
            gasPrice: '0x30e4f9b400',
          },
        },
        gas: {
          customData: { price: null },
          basicEstimates: { fast: 139 },
        },
      };
      expect(isCustomPriceExcessive(mockState, true)).toStrictEqual(true);
    });
  });

  describe('getCustomGasLimit()', () => {
    it('should return gas.customData.limit', () => {
      const mockState = { gas: { customData: { limit: 'mockLimit' } } };
      expect(getCustomGasLimit(mockState)).toStrictEqual('mockLimit');
    });
  });

  describe('getRenderableBasicEstimateData()', () => {
    const tests = [
      {
        expectedResult: [
          {
            gasEstimateType: 'SLOW',
            feeInSecondaryCurrency: '$0.01',
            feeInPrimaryCurrency: '0.0000525 ETH',
            priceInHexWei: '0x9502f900',
          },
          {
            gasEstimateType: 'AVERAGE',
            feeInPrimaryCurrency: '0.000084 ETH',
            feeInSecondaryCurrency: '$0.02',
            priceInHexWei: '0xee6b2800',
          },
          {
            gasEstimateType: 'FAST',
            feeInSecondaryCurrency: '$0.03',
            feeInPrimaryCurrency: '0.000105 ETH',
            priceInHexWei: '0x12a05f200',
          },
        ],
        mockState: {
          metamask: {
            conversionRate: 255.71,
            currentCurrency: 'usd',
            preferences: {
              showFiatInTestnets: false,
            },
            provider: {
              type: 'mainnet',
              chainId: '0x1',
            },
          },
          gas: {
            basicEstimates: {
              blockTime: 14.16326530612245,
              safeLow: 2.5,
              safeLowWait: 6.6,
              average: 4,
              avgWait: 5.3,
              fast: 5,
              fastWait: 3.3,
              fastest: 10,
              fastestWait: 0.5,
            },
          },
        },
      },
      {
        expectedResult: [
          {
            gasEstimateType: 'SLOW',
            feeInSecondaryCurrency: '$0.27',
            feeInPrimaryCurrency: '0.000105 ETH',
            priceInHexWei: '0x12a05f200',
          },
          {
            feeInPrimaryCurrency: '0.000147 ETH',
            feeInSecondaryCurrency: '$0.38',
            gasEstimateType: 'AVERAGE',
            priceInHexWei: '0x1a13b8600',
          },
          {
            gasEstimateType: 'FAST',
            feeInSecondaryCurrency: '$0.54',
            feeInPrimaryCurrency: '0.00021 ETH',
            priceInHexWei: '0x2540be400',
          },
        ],
        mockState: {
          metamask: {
            conversionRate: 2557.1,
            currentCurrency: 'usd',
            preferences: {
              showFiatInTestnets: false,
            },
            provider: {
              type: 'mainnet',
              chainId: '0x1',
            },
          },
          send: {
            gas: {
              gasLimit: GAS_LIMITS.SIMPLE,
            },
          },
          gas: {
            basicEstimates: {
              blockTime: 14.16326530612245,
              safeLow: 5,
              safeLowWait: 13.2,
              average: 7,
              avgWait: 10.1,
              fast: 10,
              fastWait: 6.6,
              fastest: 20,
              fastestWait: 1.0,
            },
          },
        },
      },
      {
        expectedResult: [
          {
            gasEstimateType: 'SLOW',
            feeInSecondaryCurrency: '',
            feeInPrimaryCurrency: '0.000105 ETH',
            priceInHexWei: '0x12a05f200',
          },
          {
            gasEstimateType: 'AVERAGE',
            feeInPrimaryCurrency: '0.000147 ETH',
            feeInSecondaryCurrency: '',
            priceInHexWei: '0x1a13b8600',
          },
          {
            gasEstimateType: 'FAST',
            feeInSecondaryCurrency: '',
            feeInPrimaryCurrency: '0.00021 ETH',
            priceInHexWei: '0x2540be400',
          },
        ],
        mockState: {
          metamask: {
            conversionRate: 2557.1,
            currentCurrency: 'usd',
            preferences: {
              showFiatInTestnets: false,
            },
            provider: {
              type: 'rinkeby',
              chainId: '0x4',
            },
          },
          send: {
            gas: {
              gasLimit: GAS_LIMITS.SIMPLE,
            },
          },
          gas: {
            basicEstimates: {
              blockTime: 14.16326530612245,
              safeLow: 5,
              safeLowWait: 13.2,
              average: 7,
              avgWait: 10.1,
              fast: 10,
              fastWait: 6.6,
              fastest: 20,
              fastestWait: 1.0,
            },
          },
        },
      },
      {
        expectedResult: [
          {
            gasEstimateType: 'SLOW',
            feeInSecondaryCurrency: '$0.27',
            feeInPrimaryCurrency: '0.000105 ETH',
            priceInHexWei: '0x12a05f200',
          },
          {
            gasEstimateType: 'AVERAGE',
            feeInPrimaryCurrency: '0.000147 ETH',
            feeInSecondaryCurrency: '$0.38',
            priceInHexWei: '0x1a13b8600',
          },
          {
            gasEstimateType: 'FAST',
            feeInSecondaryCurrency: '$0.54',
            feeInPrimaryCurrency: '0.00021 ETH',
            priceInHexWei: '0x2540be400',
          },
        ],
        mockState: {
          metamask: {
            conversionRate: 2557.1,
            currentCurrency: 'usd',
            preferences: {
              showFiatInTestnets: true,
            },
            provider: {
              type: 'rinkeby',
              chainId: '0x4',
            },
          },
          send: {
            gas: {
              gasLimit: GAS_LIMITS.SIMPLE,
            },
          },
          gas: {
            basicEstimates: {
              safeLow: 5,
              average: 7,
              fast: 10,
            },
          },
        },
      },
      {
        expectedResult: [
          {
            gasEstimateType: 'SLOW',
            feeInSecondaryCurrency: '$0.27',
            feeInPrimaryCurrency: '0.000105 ETH',
            priceInHexWei: '0x12a05f200',
          },
          {
            gasEstimateType: 'AVERAGE',
            feeInPrimaryCurrency: '0.000147 ETH',
            feeInSecondaryCurrency: '$0.38',
            priceInHexWei: '0x1a13b8600',
          },
          {
            gasEstimateType: 'FAST',
            feeInSecondaryCurrency: '$0.54',
            feeInPrimaryCurrency: '0.00021 ETH',
            priceInHexWei: '0x2540be400',
          },
        ],
        mockState: {
          metamask: {
            conversionRate: 2557.1,
            currentCurrency: 'usd',
            preferences: {
              showFiatInTestnets: true,
            },
            provider: {
              type: 'mainnet',
              chainId: '0x1',
            },
          },
          send: {
            gas: {
              gasLimit: GAS_LIMITS.SIMPLE,
            },
          },
          gas: {
            basicEstimates: {
              safeLow: 5,
              average: 7,
              fast: 10,
            },
          },
        },
      },
    ];
    it('should return renderable data about basic estimates', () => {
      tests.forEach((test) => {
        expect(
          getRenderableBasicEstimateData(
            test.mockState,
            GAS_LIMITS.SIMPLE,
            test.useFastestButtons,
          ),
        ).toStrictEqual(test.expectedResult);
      });
    });
  });

  describe('getRenderableEstimateDataForSmallButtonsFromGWEI()', () => {
    const tests = [
      {
        expectedResult: [
          {
            feeInSecondaryCurrency: '$0.13',
            feeInPrimaryCurrency: '0.00052 ETH',
            gasEstimateType: 'SLOW',
            priceInHexWei: '0x5d21dba00',
          },
          {
            feeInSecondaryCurrency: '$0.16',
            feeInPrimaryCurrency: '0.00063 ETH',
            gasEstimateType: 'AVERAGE',
            priceInHexWei: '0x6fc23ac00',
          },
          {
            feeInSecondaryCurrency: '$0.27',
            feeInPrimaryCurrency: '0.00105 ETH',
            gasEstimateType: 'FAST',
            priceInHexWei: '0xba43b7400',
          },
        ],
        mockState: {
          metamask: {
            conversionRate: 255.71,
            currentCurrency: 'usd',
            preferences: {
              showFiatInTestnets: false,
            },
            provider: {
              type: 'mainnet',
              chainId: '0x1',
            },
          },
          send: {
            gas: {
              gasLimit: GAS_LIMITS.SIMPLE,
            },
          },
          gas: {
            basicEstimates: {
              safeLow: 25,
              average: 30,
              fast: 50,
            },
          },
        },
      },
      {
        expectedResult: [
          {
            feeInSecondaryCurrency: '$2.68',
            feeInPrimaryCurrency: '0.00105 ETH',
            gasEstimateType: 'SLOW',
            priceInHexWei: '0xba43b7400',
          },
          {
            feeInSecondaryCurrency: '$4.03',
            feeInPrimaryCurrency: '0.00157 ETH',
            gasEstimateType: 'AVERAGE',
            priceInHexWei: '0x1176592e00',
          },
          {
            feeInSecondaryCurrency: '$5.37',
            feeInPrimaryCurrency: '0.0021 ETH',
            gasEstimateType: 'FAST',
            priceInHexWei: '0x174876e800',
          },
        ],
        mockState: {
          metamask: {
            conversionRate: 2557.1,
            currentCurrency: 'usd',
            preferences: {
              showFiatInTestnets: false,
            },
            provider: {
              type: 'mainnet',
              chainId: '0x1',
            },
          },
          send: {
            gas: {
              gasLimit: GAS_LIMITS.SIMPLE,
            },
          },
          gas: {
            basicEstimates: {
              blockTime: 14.16326530612245,
              safeLow: 50,
              safeLowWait: 13.2,
              average: 75,
              avgWait: 9.6,
              fast: 100,
              fastWait: 6.6,
              fastest: 200,
              fastestWait: 1.0,
            },
          },
        },
      },
      {
        expectedResult: [
          {
            feeInSecondaryCurrency: '',
            feeInPrimaryCurrency: '0.00105 ETH',
            gasEstimateType: 'SLOW',
            priceInHexWei: '0xba43b7400',
          },
          {
            feeInSecondaryCurrency: '',
            feeInPrimaryCurrency: '0.00157 ETH',
            gasEstimateType: 'AVERAGE',
            priceInHexWei: '0x1176592e00',
          },
          {
            feeInSecondaryCurrency: '',
            feeInPrimaryCurrency: '0.0021 ETH',
            gasEstimateType: 'FAST',
            priceInHexWei: '0x174876e800',
          },
        ],
        mockState: {
          metamask: {
            conversionRate: 2557.1,
            currentCurrency: 'usd',
            preferences: {
              showFiatInTestnets: false,
            },
            provider: {
              type: 'rinkeby',
              chainId: '0x4',
            },
          },
          send: {
            gas: {
              gasLimit: GAS_LIMITS.SIMPLE,
            },
          },
          gas: {
            basicEstimates: {
              blockTime: 14.16326530612245,
              safeLow: 50,
              safeLowWait: 13.2,
              average: 75,
              avgWait: 9.6,
              fast: 100,
              fastWait: 6.6,
              fastest: 200,
              fastestWait: 1.0,
            },
          },
        },
      },
      {
        expectedResult: [
          {
            feeInSecondaryCurrency: '$2.68',
            feeInPrimaryCurrency: '0.00105 ETH',
            gasEstimateType: 'SLOW',
            priceInHexWei: '0xba43b7400',
          },
          {
            feeInSecondaryCurrency: '$4.03',
            feeInPrimaryCurrency: '0.00157 ETH',
            gasEstimateType: 'AVERAGE',
            priceInHexWei: '0x1176592e00',
          },
          {
            feeInSecondaryCurrency: '$5.37',
            feeInPrimaryCurrency: '0.0021 ETH',
            gasEstimateType: 'FAST',
            priceInHexWei: '0x174876e800',
          },
        ],
        mockState: {
          metamask: {
            conversionRate: 2557.1,
            currentCurrency: 'usd',
            preferences: {
              showFiatInTestnets: true,
            },
            provider: {
              type: 'rinkeby',
              chainId: '0x4',
            },
          },
          send: {
            gas: {
              gasLimit: GAS_LIMITS.SIMPLE,
            },
          },
          gas: {
            basicEstimates: {
              safeLow: 50,
              average: 75,
              fast: 100,
            },
          },
        },
      },
      {
        expectedResult: [
          {
            feeInSecondaryCurrency: '$2.68',
            feeInPrimaryCurrency: '0.00105 ETH',
            gasEstimateType: 'SLOW',
            priceInHexWei: '0xba43b7400',
          },
          {
            feeInSecondaryCurrency: '$4.03',
            feeInPrimaryCurrency: '0.00157 ETH',
            gasEstimateType: 'AVERAGE',
            priceInHexWei: '0x1176592e00',
          },
          {
            feeInSecondaryCurrency: '$5.37',
            feeInPrimaryCurrency: '0.0021 ETH',
            gasEstimateType: 'FAST',
            priceInHexWei: '0x174876e800',
          },
        ],
        mockState: {
          metamask: {
            conversionRate: 2557.1,
            currentCurrency: 'usd',
            preferences: {
              showFiatInTestnets: true,
            },
            provider: {
              type: 'mainnet',
              chainId: '0x1',
            },
          },
          send: {
            gas: {
              gasLimit: GAS_LIMITS.SIMPLE,
            },
          },
          gas: {
            basicEstimates: {
              safeLow: 50,
              average: 75,
              fast: 100,
            },
          },
        },
      },
    ];
    it('should return renderable data about basic estimates appropriate for buttons with less info', () => {
      tests.forEach((test) => {
        expect(
          getRenderableEstimateDataForSmallButtonsFromGWEI(test.mockState),
        ).toStrictEqual(test.expectedResult);
      });
    });
  });
});
