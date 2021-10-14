import { useSelector } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import {
  getMaximumGasTotalInHexWei,
  getMinimumGasTotalInHexWei,
} from '../../../shared/modules/gas.utils';
import {
  decGWEIToHexWEI,
  decimalToHex,
} from '../../helpers/utils/conversions.util';

import {
  FEE_MARKET_ESTIMATE_RETURN_VALUE,
  LEGACY_GAS_ESTIMATE_RETURN_VALUE,
  configureEIP1559,
  configureLegacy,
  convertFromHexToETH,
  convertFromHexToFiat,
  generateUseSelectorRouter,
} from './test-utils';
import { useGasEstimates } from './useGasEstimates';

jest.mock('../useGasFeeEstimates', () => ({
  useGasFeeEstimates: jest.fn(),
}));

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');

  return {
    ...actual,
    useSelector: jest.fn(),
  };
});

const useGasEstimatesHook = (props) =>
  useGasEstimates({
    transaction: { txParams: { type: '0x2', value: '100' } },
    gasLimit: '21000',
    gasPrice: '10',
    maxPriorityFeePerGas: '10',
    maxFeePerGas: '100',
    minimumCostInHexWei: '0x5208',
    minimumGasLimit: '0x5208',
    supportsEIP1559: true,
    ...FEE_MARKET_ESTIMATE_RETURN_VALUE,
    ...props,
  });

describe('useGasEstimates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EIP-1559 scenario', () => {
    beforeEach(() => {
      configureEIP1559();
    });

    it('uses new EIP-1559 gas fields to calculate minimum values', () => {
      const gasLimit = '21000';
      const maxFeePerGas = '100';
      const maxPriorityFeePerGas = '10';
      const {
        estimatedBaseFee,
      } = FEE_MARKET_ESTIMATE_RETURN_VALUE.gasFeeEstimates;
      const { result } = renderHook(() =>
        useGasEstimatesHook({ gasLimit, maxFeePerGas, maxPriorityFeePerGas }),
      );
      const minimumHexValue = getMinimumGasTotalInHexWei({
        baseFeePerGas: decGWEIToHexWEI(estimatedBaseFee),
        gasLimit: decimalToHex(gasLimit),
        maxFeePerGas: decGWEIToHexWEI(maxFeePerGas),
        maxPriorityFeePerGas: decGWEIToHexWEI(maxPriorityFeePerGas),
      });

      expect(result.current.minimumCostInHexWei).toBe(minimumHexValue);
      expect(result.current.estimatedMinimumFiat).toBe(
        convertFromHexToFiat(minimumHexValue),
      );
      expect(result.current.estimatedMinimumNative).toBe(
        convertFromHexToETH(minimumHexValue),
      );
    });

    it('uses new EIP-1559 gas fields to calculate maximum values', () => {
      const gasLimit = '21000';
      const maxFeePerGas = '100';
      const { result } = renderHook(() =>
        useGasEstimatesHook({ gasLimit, maxFeePerGas }),
      );
      const maximumHexValue = getMaximumGasTotalInHexWei({
        gasLimit: decimalToHex(gasLimit),
        maxFeePerGas: decGWEIToHexWEI(maxFeePerGas),
      });
      expect(result.current.estimatedMaximumFiat).toBe(
        convertFromHexToFiat(maximumHexValue),
      );
      expect(result.current.estimatedMaximumNative).toBe(
        convertFromHexToETH(maximumHexValue),
      );
    });

    it('does not  return fiat values if showFiat is false', () => {
      const gasLimit = '21000';
      const maxFeePerGas = '100';
      useSelector.mockImplementation(
        generateUseSelectorRouter({
          checkNetworkAndAccountSupports1559Response: true,
          shouldShowFiat: false,
        }),
      );
      const { result } = renderHook(() =>
        useGasEstimatesHook({ gasLimit, maxFeePerGas }),
      );

      expect(result.current.estimatedMaximumFiat).toBe('');
      expect(result.current.estimatedMinimumFiat).toBe('');
    });

    it('uses gasFeeEstimates.estimatedBaseFee prop to calculate estimatedBaseFee', () => {
      const {
        estimatedBaseFee,
      } = FEE_MARKET_ESTIMATE_RETURN_VALUE.gasFeeEstimates;
      const { result } = renderHook(() => useGasEstimatesHook());
      expect(result.current.estimatedBaseFee).toBe(
        decGWEIToHexWEI(estimatedBaseFee),
      );
    });
  });

  describe('legacy scenario', () => {
    beforeEach(() => {
      configureLegacy();
    });

    it('uses legacy gas fields to calculate minimum values', () => {
      const gasLimit = '21000';
      const gasPrice = '10';
      const { result } = renderHook(() =>
        useGasEstimatesHook({
          gasLimit,
          gasPrice,
          supportsEIP1559: false,
          ...LEGACY_GAS_ESTIMATE_RETURN_VALUE,
        }),
      );
      const minimumHexValue = getMinimumGasTotalInHexWei({
        gasLimit: decimalToHex(gasLimit),
        gasPrice: decGWEIToHexWEI(gasPrice),
      });

      expect(result.current.minimumCostInHexWei).toBe(minimumHexValue);
      expect(result.current.estimatedMinimumFiat).toBe(
        convertFromHexToFiat(minimumHexValue),
      );
      expect(result.current.estimatedMinimumNative).toBe(
        convertFromHexToETH(minimumHexValue),
      );
    });

    it('uses legacy gas fields to calculate maximum values', () => {
      const gasLimit = '21000';
      const gasPrice = '10';
      const { result } = renderHook(() =>
        useGasEstimatesHook({
          gasLimit,
          gasPrice,
          supportsEIP1559: false,
          ...LEGACY_GAS_ESTIMATE_RETURN_VALUE,
        }),
      );
      const maximumHexValue = getMaximumGasTotalInHexWei({
        gasLimit: decimalToHex(gasLimit),
        gasPrice: decGWEIToHexWEI(gasPrice),
      });
      expect(result.current.estimatedMaximumFiat).toBe(
        convertFromHexToFiat(maximumHexValue),
      );
      expect(result.current.estimatedMaximumNative).toBe(
        convertFromHexToETH(maximumHexValue),
      );
    });

    it('estimatedBaseFee is undefined', () => {
      const { result } = renderHook(() =>
        useGasEstimatesHook({ supportsEIP1559: false }),
      );
      expect(result.current.estimatedBaseFee).toBeUndefined();
    });
  });
});
