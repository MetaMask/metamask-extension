import { act, renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { TRANSACTION_ENVELOPE_TYPES } from '../../../shared/constants/transaction';
import {
  GAS_RECOMMENDATIONS,
  CUSTOM_GAS_ESTIMATE,
  EDIT_GAS_MODES,
} from '../../../shared/constants/gas';

import { ETH, PRIMARY } from '../../helpers/constants/common';

import { useUserPreferencedCurrency } from '../useUserPreferencedCurrency';
import { useGasFeeEstimates } from '../useGasFeeEstimates';
import { useGasFeeInputs } from './useGasFeeInputs';

import {
  MOCK_ETH_USD_CONVERSION_RATE,
  LEGACY_GAS_ESTIMATE_RETURN_VALUE,
  FEE_MARKET_ESTIMATE_RETURN_VALUE,
  HIGH_FEE_MARKET_ESTIMATE_RETURN_VALUE,
  configureEIP1559,
  configureLegacy,
  generateUseSelectorRouter,
  getTotalCostInETH,
} from './test-utils';

jest.mock('../useUserPreferencedCurrency', () => ({
  useUserPreferencedCurrency: jest.fn(),
}));

jest.mock('../useGasFeeEstimates', () => ({
  useGasFeeEstimates: jest.fn(),
}));

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');

  return {
    ...actual,
    useSelector: jest.fn(),
    useDispatch: () => jest.fn(),
  };
});

describe('useGasFeeInputs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUserPreferencedCurrency.mockImplementation((type) => {
      if (type === PRIMARY) {
        return { currency: ETH, numberOfDecimals: 6 };
      }
      return { currency: 'USD', numberOfDecimals: 2 };
    });
  });

  describe('when using gasPrice API for estimation', () => {
    beforeEach(() => {
      configureLegacy();
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
      useSelector.mockImplementation(
        generateUseSelectorRouter({
          checkNetworkAndAccountSupports1559Response: false,
        }),
      );
      const { result } = renderHook(() => useGasFeeInputs());
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

  describe('when transaction is type-0', () => {
    beforeEach(() => {
      configureEIP1559();
    });

    it('returns gasPrice appropriately, and "0" for EIP1559 fields', () => {
      const { result } = renderHook(() =>
        useGasFeeInputs(GAS_RECOMMENDATIONS.MEDIUM, {
          txParams: {
            value: '3782DACE9D90000',
            gasLimit: '0x5028',
            gasPrice: '0x5028',
            type: TRANSACTION_ENVELOPE_TYPES.LEGACY,
          },
        }),
      );
      expect(result.current.gasPrice).toBe(0.00002052);
      expect(result.current.maxFeePerGas).toBe('0');
      expect(result.current.maxPriorityFeePerGas).toBe('0');
      expect(result.current.hasBlockingGasErrors).toBeUndefined();
    });
  });

  describe('when using EIP 1559 API for estimation', () => {
    beforeEach(() => {
      configureEIP1559();
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
      useSelector.mockImplementation(
        generateUseSelectorRouter({
          checkNetworkAndAccountSupports1559Response: true,
        }),
      );
      const { result } = renderHook(() =>
        useGasFeeInputs(null, {
          txParams: {},
          userFeeLevel: GAS_RECOMMENDATIONS.MEDIUM,
        }),
      );
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

  describe('when balance is sufficient for minimum transaction cost', () => {
    beforeEach(() => {
      configureEIP1559();
    });

    it('should return false', () => {
      const { result } = renderHook(() => useGasFeeInputs());
      expect(result.current.balanceError).toBe(false);
    });
  });

  describe('when balance is insufficient for minimum transaction cost', () => {
    beforeEach(() => {
      configureEIP1559();
      useGasFeeEstimates.mockImplementation(
        () => HIGH_FEE_MARKET_ESTIMATE_RETURN_VALUE,
      );
    });

    it('should return true', () => {
      const { result } = renderHook(() =>
        useGasFeeInputs(null, {
          userFeeLevel: GAS_RECOMMENDATIONS.MEDIUM,
          txParams: { gas: '0x5208' },
        }),
      );
      expect(result.current.balanceError).toBe(true);
    });
  });

  describe('callback setEstimateToUse', () => {
    beforeEach(() => {
      configureEIP1559();
    });

    it('should change estimateToUse value', () => {
      const { result } = renderHook(() =>
        useGasFeeInputs(null, {
          userFeeLevel: GAS_RECOMMENDATIONS.MEDIUM,
          txParams: { gas: '0x5208' },
        }),
      );
      act(() => {
        result.current.setEstimateToUse(GAS_RECOMMENDATIONS.HIGH);
      });
      expect(result.current.estimateToUse).toBe(GAS_RECOMMENDATIONS.HIGH);
      expect(result.current.maxFeePerGas).toBe(
        FEE_MARKET_ESTIMATE_RETURN_VALUE.gasFeeEstimates.high
          .suggestedMaxFeePerGas,
      );
      expect(result.current.maxPriorityFeePerGas).toBe(
        FEE_MARKET_ESTIMATE_RETURN_VALUE.gasFeeEstimates.high
          .suggestedMaxPriorityFeePerGas,
      );
    });
  });

  describe('callback onManualChange', () => {
    beforeEach(() => {
      configureEIP1559();
    });

    it('should change estimateToUse value to custom', () => {
      const { result } = renderHook(() =>
        useGasFeeInputs(null, {
          userFeeLevel: GAS_RECOMMENDATIONS.MEDIUM,
          txParams: { gas: '0x5208' },
        }),
      );
      act(() => {
        result.current.onManualChange();
        result.current.setMaxFeePerGas('100');
        result.current.setMaxPriorityFeePerGas('10');
      });
      expect(result.current.estimateToUse).toBe(CUSTOM_GAS_ESTIMATE);
      expect(result.current.maxFeePerGas).toBe('100');
      expect(result.current.maxPriorityFeePerGas).toBe('10');
    });
  });

  describe('when showFiat is false', () => {
    beforeEach(() => {
      configureEIP1559();
      useSelector.mockImplementation(
        generateUseSelectorRouter({
          checkNetworkAndAccountSupports1559Response: true,
          shouldShowFiat: false,
        }),
      );
    });

    it('does not return fiat values', () => {
      const { result } = renderHook(() =>
        useGasFeeInputs(null, {
          userFeeLevel: GAS_RECOMMENDATIONS.MEDIUM,
          txParams: { gas: '0x5208' },
        }),
      );
      expect(result.current.maxFeePerGasFiat).toBe('');
      expect(result.current.maxPriorityFeePerGasFiat).toBe('');
      expect(result.current.estimatedMaximumFiat).toBe('');
      expect(result.current.estimatedMinimumFiat).toBe('');
    });
  });

  describe('supportsEIP1559V2', () => {
    beforeEach(() => {
      configureEIP1559();
      useSelector.mockImplementation(
        generateUseSelectorRouter({
          checkNetworkAndAccountSupports1559Response: true,
          eip1559V2Enabled: true,
        }),
      );
    });

    it('return true for fee_market transaction type', () => {
      const { result } = renderHook(() =>
        useGasFeeInputs(null, {
          txParams: { type: TRANSACTION_ENVELOPE_TYPES.FEE_MARKET },
        }),
      );
      expect(result.current.supportsEIP1559V2).toBe(true);
    });

    it('return false for legacy transaction type', () => {
      const { result } = renderHook(() =>
        useGasFeeInputs(null, {
          txParams: { type: TRANSACTION_ENVELOPE_TYPES.LEGACY },
        }),
      );
      expect(result.current.supportsEIP1559V2).toBe(false);
    });
  });

  describe('editGasMode', () => {
    it('should return editGasMode passed', () => {
      const { result } = renderHook(() =>
        useGasFeeInputs(undefined, undefined, undefined, EDIT_GAS_MODES.SWAPS),
      );
      expect(result.current.editGasMode).toBe(EDIT_GAS_MODES.SWAPS);
    });
  });
});
