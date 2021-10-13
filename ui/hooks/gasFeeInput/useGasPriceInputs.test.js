import TestRenderer from 'react-test-renderer';
import { renderHook } from '@testing-library/react-hooks';

import { LEGACY_GAS_ESTIMATE_RETURN_VALUE, configure } from './test-utils';
import { useGasPriceInputs } from './useGasPriceInputs';

// todo: check use of act
const { act } = TestRenderer;

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

describe('useGasPriceInputs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns gasPrice values from transaction if transaction.userFeeLevel is custom', () => {
    configure();
    const { result } = renderHook(() =>
      useGasPriceInputs({
        transaction: {
          userFeeLevel: 'custom',
          txParams: { gasPrice: '0x5028' },
        },
      }),
    );
    expect(result.current.gasPrice).toBe(0.00002052);
  });

  it('does not returns gasPrice values from transaction if transaction.userFeeLevel is not custom', () => {
    configure();
    const { result } = renderHook(() =>
      useGasPriceInputs({
        estimateToUse: 'high',
        transaction: {
          userFeeLevel: 'high',
          txParams: { gasPrice: '0x5028' },
        },
        ...LEGACY_GAS_ESTIMATE_RETURN_VALUE,
      }),
    );
    expect(result.current.gasPrice).toBe('30');
  });

  it('if no gasPrice is provided returns default estimate for legacy transaction', () => {
    configure();
    const { result } = renderHook(() =>
      useGasPriceInputs({
        defaultEstimateToUse: 'medium',
        ...LEGACY_GAS_ESTIMATE_RETURN_VALUE,
      }),
    );
    expect(result.current.gasPrice).toBe('20');
  });

  it('for legacy transaction if estimateToUse is high and no gasPrice is provided returns high estimate value', () => {
    configure();
    const { result } = renderHook(() =>
      useGasPriceInputs({
        estimateToUse: 'high',
        ...LEGACY_GAS_ESTIMATE_RETURN_VALUE,
      }),
    );
    expect(result.current.gasPrice).toBe('30');
  });

  it('returns 0 for EIP-1559 transactions', () => {
    configure();
    const { result } = renderHook(() =>
      useGasPriceInputs({ defaultEstimateToUse: 'medium' }),
    );
    expect(result.current.gasPrice).toBe('0');
  });

  it('returns gasPrice set by user if gasPriceHasBeenManuallySet is true', () => {
    configure();
    const { result } = renderHook(() =>
      useGasPriceInputs({ defaultEstimateToUse: 'medium' }),
    );
    act(() => {
      result.current.setGasPriceHasBeenManuallySet(true);
      result.current.setGasPrice(0.001);
    });
    expect(result.current.gasPrice).toBe(0.001);
  });
});
