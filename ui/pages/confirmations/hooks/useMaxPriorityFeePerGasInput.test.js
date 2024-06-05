import { act, renderHook } from '@testing-library/react-hooks';

import {
  GasRecommendations,
  CUSTOM_GAS_ESTIMATE,
} from '../../../../shared/constants/gas';
import {
  FEE_MARKET_ESTIMATE_RETURN_VALUE,
  LEGACY_GAS_ESTIMATE_RETURN_VALUE,
  configureEIP1559,
  configureLegacy,
} from './test-utils';
import { useMaxPriorityFeePerGasInput } from './useMaxPriorityFeePerGasInput';

jest.mock('../../../hooks/useGasFeeEstimates', () => ({
  useGasFeeEstimates: jest.fn(),
}));

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');

  return {
    ...actual,
    useSelector: jest.fn(),
  };
});

const renderUseMaxPriorityFeePerGasInputHook = (props) => {
  return renderHook(() =>
    useMaxPriorityFeePerGasInput({
      gasLimit: '21000',
      estimateToUse: GasRecommendations.medium,
      transaction: {
        userFeeLevel: CUSTOM_GAS_ESTIMATE,
        txParams: { maxPriorityFeePerGas: '0x5028' },
      },
      ...FEE_MARKET_ESTIMATE_RETURN_VALUE,
      ...props,
    }),
  );
};

describe('useMaxPriorityFeePerGasInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configureEIP1559();
  });

  it('returns maxPriorityFeePerGas values from transaction if transaction.userFeeLevel is custom', () => {
    const { result } = renderUseMaxPriorityFeePerGasInputHook();
    expect(result.current.maxPriorityFeePerGas).toBe(0.00002052);
  });

  it('returns maxFeePerGas values from transaction if transaction.userFeeLevel is custom and maxPriorityFeePerGas is not provided', () => {
    const { result } = renderUseMaxPriorityFeePerGasInputHook({
      transaction: {
        userFeeLevel: CUSTOM_GAS_ESTIMATE,
        txParams: { maxFeePerGas: '0x5028' },
      },
    });
    expect(result.current.maxPriorityFeePerGas).toBe(0.00002052);
  });

  it('does not returns maxPriorityFeePerGas values from transaction if transaction.userFeeLevel is not custom', () => {
    const { result } = renderUseMaxPriorityFeePerGasInputHook({
      estimateToUse: GasRecommendations.high,
      transaction: {
        userFeeLevel: GasRecommendations.high,
        txParams: { maxPriorityFeePerGas: '0x5028' },
      },
    });
    expect(result.current.maxPriorityFeePerGas).toBe(
      FEE_MARKET_ESTIMATE_RETURN_VALUE.gasFeeEstimates.high
        .suggestedMaxPriorityFeePerGas,
    );
  });

  it('if no maxPriorityFeePerGas is provided by user or in transaction it returns value from fee market estimate', () => {
    const { result } = renderUseMaxPriorityFeePerGasInputHook({
      transaction: {
        txParams: {},
      },
    });
    expect(result.current.maxPriorityFeePerGas).toBe(
      FEE_MARKET_ESTIMATE_RETURN_VALUE.gasFeeEstimates.medium
        .suggestedMaxPriorityFeePerGas,
    );
  });

  it('returns 0 if EIP1559 is not supported and gas estimates are legacy', () => {
    configureLegacy();
    const { result } = renderUseMaxPriorityFeePerGasInputHook({
      ...LEGACY_GAS_ESTIMATE_RETURN_VALUE,
    });
    expect(result.current.maxPriorityFeePerGas).toBe('0');
  });

  it('returns maxPriorityFeePerGas set by user if setMaxPriorityFeePerGas is called', () => {
    const { result } = renderUseMaxPriorityFeePerGasInputHook();
    act(() => {
      result.current.setMaxPriorityFeePerGas(100);
    });
    expect(result.current.maxPriorityFeePerGas).toBe(100);
  });

  it('returns maxPriorityFeePerGas from transaction if it is 0', () => {
    const { result } = renderUseMaxPriorityFeePerGasInputHook({
      transaction: {
        txParams: {
          maxPriorityFeePerGas: '0x0',
        },
      },
    });
    expect(result.current.maxPriorityFeePerGas).toBe(0);
  });
});
