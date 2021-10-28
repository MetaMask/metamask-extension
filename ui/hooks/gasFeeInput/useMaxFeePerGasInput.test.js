import { useSelector } from 'react-redux';
import { act, renderHook } from '@testing-library/react-hooks';

import { getMaximumGasTotalInHexWei } from '../../../shared/modules/gas.utils';
import { decimalToHex } from '../../helpers/utils/conversions.util';
import {
  GAS_RECOMMENDATIONS,
  CUSTOM_GAS_ESTIMATE,
} from '../../../shared/constants/gas';

import {
  FEE_MARKET_ESTIMATE_RETURN_VALUE,
  LEGACY_GAS_ESTIMATE_RETURN_VALUE,
  configureEIP1559,
  configureLegacy,
  convertFromHexToFiat,
  generateUseSelectorRouter,
} from './test-utils';
import { useMaxFeePerGasInput } from './useMaxFeePerGasInput';

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

const renderUseMaxFeePerGasInputHook = (props) =>
  renderHook(() =>
    useMaxFeePerGasInput({
      gasLimit: '21000',
      estimateToUse: GAS_RECOMMENDATIONS.MEDIUM,
      transaction: {
        userFeeLevel: CUSTOM_GAS_ESTIMATE,
        txParams: { maxFeePerGas: '0x5028' },
      },
      ...FEE_MARKET_ESTIMATE_RETURN_VALUE,
      ...props,
    }),
  );

describe('useMaxFeePerGasInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configureEIP1559();
  });

  it('returns maxFeePerGas values from transaction if transaction.userFeeLevel is custom', () => {
    const { result } = renderUseMaxFeePerGasInputHook();
    expect(result.current.maxFeePerGas).toBe(0.00002052);
  });

  it('returns gasPrice values from transaction if transaction.userFeeLevel is custom and maxFeePerGas is not provided', () => {
    const { result } = renderUseMaxFeePerGasInputHook({
      transaction: {
        userFeeLevel: CUSTOM_GAS_ESTIMATE,
        txParams: { gasPrice: '0x5028' },
      },
    });
    expect(result.current.maxFeePerGas).toBe(0.00002052);
  });

  it('does not returns maxFeePerGas values from transaction if transaction.userFeeLevel is not custom', () => {
    const { result } = renderUseMaxFeePerGasInputHook({
      estimateToUse: GAS_RECOMMENDATIONS.HIGH,
      transaction: {
        userFeeLevel: GAS_RECOMMENDATIONS.HIGH,
        txParams: { maxFeePerGas: '0x5028' },
      },
    });
    expect(result.current.maxFeePerGas).toBe(
      FEE_MARKET_ESTIMATE_RETURN_VALUE.gasFeeEstimates.high
        .suggestedMaxFeePerGas,
    );
  });

  it('if no maxFeePerGas is provided by user or in transaction it returns value from fee market estimate', () => {
    const { result } = renderUseMaxFeePerGasInputHook({
      transaction: {
        userFeeLevel: GAS_RECOMMENDATIONS.HIGH,
        txParams: {},
      },
    });
    expect(result.current.maxFeePerGas).toBe(
      FEE_MARKET_ESTIMATE_RETURN_VALUE.gasFeeEstimates.medium
        .suggestedMaxFeePerGas,
    );
  });

  it('maxFeePerGasFiat is maximum amount that the transaction can cost', () => {
    const { result } = renderUseMaxFeePerGasInputHook();
    const maximumHexValue = getMaximumGasTotalInHexWei({
      gasLimit: decimalToHex('21000'),
      maxFeePerGas: '0x5028',
    });
    expect(result.current.maxFeePerGasFiat).toBe(
      convertFromHexToFiat(maximumHexValue),
    );
  });

  it('does not  return fiat values if showFiat is false', () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        checkNetworkAndAccountSupports1559Response: true,
        shouldShowFiat: false,
      }),
    );
    const { result } = renderUseMaxFeePerGasInputHook();
    expect(result.current.maxFeePerGasFiat).toBe('');
  });

  it('returns 0 if EIP1559 is not supported and legacy gas estimates have been provided', () => {
    configureLegacy();
    const { result } = renderUseMaxFeePerGasInputHook({
      ...LEGACY_GAS_ESTIMATE_RETURN_VALUE,
    });
    expect(result.current.maxFeePerGas).toBe('0');
  });

  it('returns maxFeePerGas set by user if setMaxFeePerGas is called', () => {
    const { result } = renderUseMaxFeePerGasInputHook();
    act(() => {
      result.current.setMaxFeePerGas(100);
    });
    expect(result.current.maxFeePerGas).toBe(100);
  });
});
