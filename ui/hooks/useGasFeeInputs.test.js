import { act, renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { GAS_ESTIMATE_TYPES } from '../../shared/constants/gas';
import { multiplyCurrencies } from '../../shared/modules/conversion.utils';
import {
  getConversionRate,
  getNativeCurrency,
} from '../ducks/metamask/metamask';
import { ETH, PRIMARY } from '../helpers/constants/common';
import {
  getCurrentCurrency,
  getShouldShowFiat,
  getCustomGasPrice,
  getCustomGasLimit,
  getCustomMaxFeePerGas,
  getCustomMaxPriorityFeePerGas,
} from '../selectors';
import {
  setCustomGasPrice,
  setCustomGasLimit,
  setCustomMaxFeePerGas,
  setCustomMaxPriorityFeePerGas,
} from '../ducks/gas/gas.duck';
import { useGasFeeEstimates } from './useGasFeeEstimates';
import { useGasFeeInputs } from './useGasFeeInputs';
import { useUserPreferencedCurrency } from './useUserPreferencedCurrency';

jest.mock('./useUserPreferencedCurrency', () => ({
  useUserPreferencedCurrency: jest.fn(),
}));

jest.mock('./useGasFeeEstimates', () => ({
  useGasFeeEstimates: jest.fn(),
}));

jest.mock('../ducks/gas/gas.duck', () => ({
  setCustomGasPrice: jest.fn(),
  setCustomGasLimit: jest.fn(),
  setCustomMaxFeePerGas: jest.fn(),
  setCustomMaxPriorityFeePerGas: jest.fn(),
}));

let mockState = {};
const mockDispatch = (mockAction) => {
  Object.keys(mockAction).forEach((key) => {
    mockState[key] = mockAction[key];
  });
};

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');

  return {
    ...actual,
    useSelector: jest.fn(),
    useDispatch: jest.fn(() => mockDispatch),
  };
});

// Why this number?
// 20 gwei * 21000 gasLimit = 420,000 gwei
// 420,000 gwei is 0.00042 ETH
// 0.00042 ETH * 100000 = $42
const MOCK_ETH_USD_CONVERSION_RATE = 100000;

const LEGACY_GAS_ESTIMATE_RETURN_VALUE = {
  gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
  gasFeeEstimates: {
    low: '10',
    medium: '20',
    high: '30',
  },
  estimatedGasFeeTimeBounds: {},
};

const FEE_MARKET_ESTIMATE_RETURN_VALUE = {
  gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
  gasFeeEstimates: {
    low: {
      minWaitTimeEstimate: 180000,
      maxWaitTimeEstimate: 300000,
      suggestedMaxPriorityFeePerGas: '3',
      suggestedMaxFeePerGas: '53',
    },
    medium: {
      minWaitTimeEstimate: 15000,
      maxWaitTimeEstimate: 60000,
      suggestedMaxPriorityFeePerGas: '7',
      suggestedMaxFeePerGas: '70',
    },
    high: {
      minWaitTimeEstimate: 0,
      maxWaitTimeEstimate: 15000,
      suggestedMaxPriorityFeePerGas: '10',
      suggestedMaxFeePerGas: '100',
    },
    estimatedBaseFee: '50',
  },
  estimatedGasFeeTimeBounds: {},
};

const generateUseSelectorRouter = () => (selector) => {
  if (selector === getConversionRate) {
    return MOCK_ETH_USD_CONVERSION_RATE;
  }
  if (selector === getNativeCurrency) {
    return ETH;
  }
  if (selector === getCurrentCurrency) {
    return 'USD';
  }
  if (selector === getShouldShowFiat) {
    return true;
  }
  if (selector === getCustomGasPrice) {
    return mockState.gasPrice;
  }
  if (selector === getCustomGasLimit) {
    return mockState.gasLimit;
  }
  if (selector === getCustomMaxFeePerGas) {
    return mockState.maxFeePerGas;
  }
  if (selector === getCustomMaxPriorityFeePerGas) {
    return mockState.maxPriorityFeePerGas;
  }
  return undefined;
};

function getTotalCostInETH(gwei, gasLimit) {
  return multiplyCurrencies(gwei, gasLimit, {
    fromDenomination: 'GWEI',
    toDenomination: 'ETH',
    multiplicandBase: 10,
    multiplierBase: 10,
  });
}

describe('useGasFeeInputs', () => {
  beforeEach(() => {
    mockState = {};
    jest.clearAllMocks();
    useUserPreferencedCurrency.mockImplementation((type) => {
      if (type === PRIMARY) {
        return { currency: ETH, numberOfDecimals: 6 };
      }
      return { currency: 'USD', numberOfDecimals: 2 };
    });

    setCustomGasPrice.mockImplementation((value) => {
      return { gasPrice: value };
    });
    setCustomGasLimit.mockImplementation((value) => ({ gasLimit: value }));
    setCustomMaxFeePerGas.mockImplementation((value) => ({
      maxFeePerGas: value,
    }));
    setCustomMaxPriorityFeePerGas.mockImplementation((value) => ({
      maxPriorityFeePerGas: value,
    }));
  });

  describe('when using gasPrice API for estimation', () => {
    beforeEach(() => {
      useGasFeeEstimates.mockImplementation(
        () => LEGACY_GAS_ESTIMATE_RETURN_VALUE,
      );
      useSelector.mockImplementation(generateUseSelectorRouter());
    });
    it('passes through the raw estimate values from useGasFeeEstimates', () => {
      const { result } = renderHook(() => useGasFeeInputs());
      expect(result.current.gasFeeEstimates).toMatchObject(
        LEGACY_GAS_ESTIMATE_RETURN_VALUE.gasFeeEstimates,
      );
      expect(result.current.gasEstimateType).toBe(
        LEGACY_GAS_ESTIMATE_RETURN_VALUE.gasEstimateType,
      );
      expect(result.current.estimatedGasFeeTimeBounds).toMatchObject({});
    });

    it('returns gasPrice appropriately, and "0" for EIP1559 fields', () => {
      const { result } = renderHook(() => useGasFeeInputs());
      expect(result.current.gasPrice).toBe(
        LEGACY_GAS_ESTIMATE_RETURN_VALUE.gasFeeEstimates.medium,
      );
      expect(result.current.maxFeePerGas).toBe('0');
      expect(result.current.maxPriorityFeePerGas).toBe('0');
    });

    it('updates values when user modifies gasPrice', () => {
      const { result, rerender } = renderHook(() => useGasFeeInputs());
      expect(result.current.gasPrice).toBe(
        LEGACY_GAS_ESTIMATE_RETURN_VALUE.gasFeeEstimates.medium,
      );
      let totalEthGasFee = getTotalCostInETH(
        LEGACY_GAS_ESTIMATE_RETURN_VALUE.gasFeeEstimates.medium,
        result.current.gasLimit,
      );
      let totalFiat = (
        Number(totalEthGasFee) * MOCK_ETH_USD_CONVERSION_RATE
      ).toFixed(2);
      expect(result.current.estimatedMaximumNative).toBe(
        `${totalEthGasFee} ETH`,
      );
      expect(result.current.estimatedMaximumFiat).toBe(`$${totalFiat}`);
      expect(result.current.estimatedMinimumFiat).toBe(`$${totalFiat}`);
      act(() => {
        result.current.setGasPrice('30');
      });
      rerender();
      totalEthGasFee = getTotalCostInETH('30', result.current.gasLimit);
      totalFiat = (
        Number(totalEthGasFee) * MOCK_ETH_USD_CONVERSION_RATE
      ).toFixed(2);
      expect(result.current.gasPrice).toBe('30');
      expect(result.current.estimatedMaximumNative).toBe(
        `${totalEthGasFee} ETH`,
      );
      expect(result.current.estimatedMaximumFiat).toBe(`$${totalFiat}`);
      expect(result.current.estimatedMinimumFiat).toBe(`$${totalFiat}`);
    });
  });

  describe('when using EIP 1559 API for estimation', () => {
    beforeEach(() => {
      useGasFeeEstimates.mockImplementation(
        () => FEE_MARKET_ESTIMATE_RETURN_VALUE,
      );
      useSelector.mockImplementation(generateUseSelectorRouter());
    });
    it('passes through the raw estimate values from useGasFeeEstimates', () => {
      const { result } = renderHook(() => useGasFeeInputs());
      expect(result.current.gasFeeEstimates).toMatchObject(
        FEE_MARKET_ESTIMATE_RETURN_VALUE.gasFeeEstimates,
      );
      expect(result.current.gasEstimateType).toBe(
        FEE_MARKET_ESTIMATE_RETURN_VALUE.gasEstimateType,
      );
      expect(result.current.estimatedGasFeeTimeBounds).toMatchObject({});
    });

    it('returns EIP-1559 fields appropriately, and "0" for gasPrice fields', () => {
      const { result } = renderHook(() => useGasFeeInputs());
      expect(result.current.gasPrice).toBe('0');
      expect(result.current.maxFeePerGas).toBe(
        FEE_MARKET_ESTIMATE_RETURN_VALUE.gasFeeEstimates.medium
          .suggestedMaxFeePerGas,
      );
      expect(result.current.maxPriorityFeePerGas).toBe(
        FEE_MARKET_ESTIMATE_RETURN_VALUE.gasFeeEstimates.medium
          .suggestedMaxPriorityFeePerGas,
      );
    });

    it('updates values when user modifies maxFeePerGas', () => {
      const { result, rerender } = renderHook(() => useGasFeeInputs());
      expect(result.current.maxFeePerGas).toBe(
        FEE_MARKET_ESTIMATE_RETURN_VALUE.gasFeeEstimates.medium
          .suggestedMaxFeePerGas,
      );
      let totalEthGasFee = getTotalCostInETH(
        FEE_MARKET_ESTIMATE_RETURN_VALUE.gasFeeEstimates.medium
          .suggestedMaxFeePerGas,
        result.current.gasLimit,
      );
      let totalMaxFiat = (
        Number(totalEthGasFee) * MOCK_ETH_USD_CONVERSION_RATE
      ).toFixed(2);
      expect(result.current.estimatedMaximumNative).toBe(
        `${totalEthGasFee} ETH`,
      );
      expect(result.current.estimatedMaximumFiat).toBe(`$${totalMaxFiat}`);
      // TODO: test minimum fiat too
      // expect(result.current.estimatedMinimumFiat).toBe(`$${totalMaxFiat}`);
      act(() => {
        result.current.setMaxFeePerGas('90');
      });
      rerender();
      totalEthGasFee = getTotalCostInETH('90', result.current.gasLimit);
      totalMaxFiat = (
        Number(totalEthGasFee) * MOCK_ETH_USD_CONVERSION_RATE
      ).toFixed(2);
      expect(result.current.maxFeePerGas).toBe('90');
      expect(result.current.estimatedMaximumNative).toBe(
        `${totalEthGasFee} ETH`,
      );
      expect(result.current.estimatedMaximumFiat).toBe(`$${totalMaxFiat}`);
      // TODO: test minimum fiat too
      // expect(result.current.estimatedMinimumFiat).toBe(`$${totalMaxFiat}`);
    });
  });
});
