import { GAS_ESTIMATE_TYPES, GAS_LIMITS } from '../../shared/constants/gas';
import { getInitialSendStateWithExistingTxState } from '../../test/jest/mocks';
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
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            low: '1',
          },
          networkDetails: {
            EIPS: {},
          },
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
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            low: '1',
          },
          networkDetails: {
            EIPS: {},
          },
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
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            low: '1',
          },
          networkDetails: {
            EIPS: {},
          },
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
          gasEstimateType: GAS_ESTIMATE_TYPES.NONE,
          gasFeeEstimates: {
            low: undefined,
          },
          networkDetails: {
            EIPS: {},
          },
        },
        gas: {
          customData: { price: '0x77359400' },
        },
      };
      expect(isCustomPriceSafe(mockState)).toStrictEqual(false);
    });
  });

  describe('isCustomPriceExcessive()', () => {
    it('should return false for gas.customData.price null', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            high: '150',
          },
          networkDetails: {
            EIPS: {},
          },
        },
        gas: {
          customData: { price: null },
        },
      };
      expect(isCustomPriceExcessive(mockState)).toStrictEqual(false);
    });
    it('should return false gas.basicEstimates.fast undefined', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            high: undefined,
          },
          networkDetails: {
            EIPS: {},
          },
        },
        gas: {
          customData: { price: '0x77359400' },
        },
      };
      expect(isCustomPriceExcessive(mockState)).toStrictEqual(false);
    });
    it('should return false gas.basicEstimates.price 0x205d0bae00 (139)', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            high: '139',
          },
          networkDetails: {
            EIPS: {},
          },
        },
        gas: {
          customData: { price: '0x205d0bae00' },
        },
      };
      expect(isCustomPriceExcessive(mockState)).toStrictEqual(false);
    });
    it('should return false gas.basicEstimates.price 0x1bf08eb000 (120)', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            high: '139',
          },
          networkDetails: {
            EIPS: {},
          },
        },
        gas: {
          customData: { price: '0x1bf08eb000' },
        },
      };
      expect(isCustomPriceExcessive(mockState)).toStrictEqual(false);
    });
    it('should return false gas.basicEstimates.price 0x28bed01600 (175)', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            high: '139',
          },
          networkDetails: {
            EIPS: {},
          },
        },
        gas: {
          customData: { price: '0x28bed01600' },
        },
      };
      expect(isCustomPriceExcessive(mockState)).toStrictEqual(false);
    });
    it('should return true gas.basicEstimates.price 0x30e4f9b400 (210)', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            high: '139',
          },
          networkDetails: {
            EIPS: {},
          },
        },
        gas: {
          customData: { price: '0x30e4f9b400' },
        },
      };
      expect(isCustomPriceExcessive(mockState)).toStrictEqual(true);
    });
    it('should return false gas.basicEstimates.price 0x28bed01600 (175) (checkSend=true)', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            high: '139',
          },
          networkDetails: {
            EIPS: {},
          },
        },
        send: getInitialSendStateWithExistingTxState({
          gas: {
            gasPrice: '0x28bed0160',
          },
        }),
        gas: {
          customData: { price: null },
        },
      };
      expect(isCustomPriceExcessive(mockState, true)).toStrictEqual(false);
    });
    it('should return true gas.basicEstimates.price 0x30e4f9b400 (210) (checkSend=true)', () => {
      const mockState = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          gasFeeEstimates: {
            high: '139',
          },
          networkDetails: {
            EIPS: {},
          },
        },
        send: getInitialSendStateWithExistingTxState({
          gas: {
            gasPrice: '0x30e4f9b400',
          },
        }),
        gas: {
          customData: { price: null },
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
            gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
            gasFeeEstimates: {
              low: '2.5',
              medium: '4',
              high: '5',
            },
            networkDetails: {
              EIPS: {},
            },
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
            gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
            gasFeeEstimates: {
              low: '5',
              medium: '7',
              high: '10',
            },
            networkDetails: {
              EIPS: {},
            },
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
          send: getInitialSendStateWithExistingTxState({
            gas: {
              gasLimit: GAS_LIMITS.SIMPLE,
            },
          }),
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
            gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
            gasFeeEstimates: {
              low: '5',
              medium: '7',
              high: '10',
            },
            networkDetails: {
              EIPS: {},
            },
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
          send: getInitialSendStateWithExistingTxState({
            gas: {
              gasLimit: GAS_LIMITS.SIMPLE,
            },
          }),
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
            gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
            gasFeeEstimates: {
              low: '5',
              medium: '7',
              high: '10',
            },
            networkDetails: {
              EIPS: {},
            },
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
          send: getInitialSendStateWithExistingTxState({
            gas: {
              gasLimit: GAS_LIMITS.SIMPLE,
            },
          }),
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
            gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
            gasFeeEstimates: {
              low: '5',
              medium: '7',
              high: '10',
            },
            networkDetails: {
              EIPS: {},
            },
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
          send: getInitialSendStateWithExistingTxState({
            gas: {
              gasLimit: GAS_LIMITS.SIMPLE,
            },
          }),
        },
      },
    ];
    it('should return renderable data about basic estimates', () => {
      tests.forEach(({ expectedResult, mockState, useFastestButtons }) => {
        expect(
          getRenderableBasicEstimateData(
            mockState,
            GAS_LIMITS.SIMPLE,
            useFastestButtons,
          ),
        ).toStrictEqual(expectedResult);
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
            gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
            gasFeeEstimates: {
              low: '25',
              medium: '30',
              high: '50',
            },
            networkDetails: {
              EIPS: {},
            },
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
          send: getInitialSendStateWithExistingTxState({
            gas: {
              gasLimit: GAS_LIMITS.SIMPLE,
            },
          }),
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
            gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
            gasFeeEstimates: {
              low: '50',
              medium: '75',
              high: '100',
            },
            networkDetails: {
              EIPS: {},
            },
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
          send: getInitialSendStateWithExistingTxState({
            gas: {
              gasLimit: GAS_LIMITS.SIMPLE,
            },
          }),
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
            gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
            gasFeeEstimates: {
              low: '50',
              medium: '75',
              high: '100',
            },
            networkDetails: {
              EIPS: {},
            },
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
          send: getInitialSendStateWithExistingTxState({
            gas: {
              gasLimit: GAS_LIMITS.SIMPLE,
            },
          }),
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
            gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
            gasFeeEstimates: {
              low: '50',
              medium: '75',
              high: '100',
            },
            networkDetails: {
              EIPS: {},
            },
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
          send: getInitialSendStateWithExistingTxState({
            gas: {
              gasLimit: GAS_LIMITS.SIMPLE,
            },
          }),
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
            gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
            gasFeeEstimates: {
              low: '50',
              medium: '75',
              high: '100',
            },
            networkDetails: {
              EIPS: {},
            },
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
          send: getInitialSendStateWithExistingTxState({
            gas: {
              gasLimit: GAS_LIMITS.SIMPLE,
            },
          }),
        },
      },
    ];
    it('should return renderable data about basic estimates appropriate for buttons with less info', () => {
      tests.forEach(({ expectedResult, mockState }) => {
        expect(
          getRenderableEstimateDataForSmallButtonsFromGWEI(mockState),
        ).toStrictEqual(expectedResult);
      });
    });
  });
});
