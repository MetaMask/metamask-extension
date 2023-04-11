import { act, renderHook } from '@testing-library/react-hooks';

import {
  GasRecommendations,
  CUSTOM_GAS_ESTIMATE,
} from '../../../shared/constants/gas';
import {
  FEE_MARKET_ESTIMATE_RETURN_VALUE,
  LEGACY_GAS_ESTIMATE_RETURN_VALUE,
  configure,
} from './test-utils';
import { useGasPriceInput } from './useGasPriceInput';

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

describe('useGasPriceInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configure();
  });

  it('returns gasPrice values from transaction if transaction.userFeeLevel is custom', () => {
    const { result } = renderHook(() =>
      useGasPriceInput({
        transaction: {
          userFeeLevel: CUSTOM_GAS_ESTIMATE,
          txParams: { gasPrice: '0x5028' },
        },
      }),
    );
    expect(result.current.gasPrice).toBe(0.00002052);
  });

  it('does not return gasPrice values from transaction if transaction.userFeeLevel is not custom', () => {
    configure();
    const { result } = renderHook(() =>
      useGasPriceInput({
        estimateToUse: GasRecommendations.high,
        transaction: {
          userFeeLevel: GasRecommendations.high,
          txParams: { gasPrice: '0x5028' },
        },
        ...LEGACY_GAS_ESTIMATE_RETURN_VALUE,
      }),
    );
    expect(result.current.gasPrice).toBe('30');
  });

  it('if no gasPrice is provided returns default estimate for legacy transaction', () => {
    const { result } = renderHook(() =>
      useGasPriceInput({
        estimateToUse: GasRecommendations.medium,
        ...LEGACY_GAS_ESTIMATE_RETURN_VALUE,
      }),
    );
    expect(result.current.gasPrice).toBe('20');
  });

  it('for legacy transaction if estimateToUse is high and no gasPrice is provided returns high estimate value', () => {
    const { result } = renderHook(() =>
      useGasPriceInput({
        estimateToUse: GasRecommendations.high,
        ...LEGACY_GAS_ESTIMATE_RETURN_VALUE,
      }),
    );
    expect(result.current.gasPrice).toBe('30');
  });

  it('returns 0 if gasPrice is not present in transaction and estimates are also not legacy', () => {
    const { result } = renderHook(() =>
      useGasPriceInput({
        estimateToUse: GasRecommendations.medium,
        ...FEE_MARKET_ESTIMATE_RETURN_VALUE,
      }),
    );
    expect(result.current.gasPrice).toBe('0');
  });

  it('returns gasPrice set by user if gasPriceHasBeenManuallySet is true', () => {
    const { result } = renderHook(() =>
      useGasPriceInput({ estimateToUse: GasRecommendations.medium }),
    );
    act(() => {
      result.current.setGasPriceHasBeenManuallySet(true);
      result.current.setGasPrice(100);
    });
    expect(result.current.gasPrice).toBe(100);
  });
});
