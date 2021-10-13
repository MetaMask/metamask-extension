import { act, renderHook } from '@testing-library/react-hooks';

import {
  FEE_MARKET_ESTIMATE_RETURN_VALUE,
  LEGACY_GAS_ESTIMATE_RETURN_VALUE,
  configure,
} from './test-utils';
import { useMaxPriorityFeePerGasInput } from './useMaxPriorityFeePerGasInput';

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

const renderUseMaxPriorityFeePerGasInputHook = (props) => {
  return renderHook(() =>
    useMaxPriorityFeePerGasInput({
      gasLimit: '21000',
      estimateToUse: 'medium',
      supportsEIP1559: true,
      transaction: {
        userFeeLevel: 'custom',
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
    configure();
  });

  it('returns maxPriorityFeePerGas values from transaction if transaction.userFeeLevel is custom', () => {
    const { result } = renderUseMaxPriorityFeePerGasInputHook();
    expect(result.current.maxPriorityFeePerGas).toBe(0.00002052);
  });

  it('does not returns maxPriorityFeePerGas values from transaction if transaction.userFeeLevel is not custom', () => {
    const { result } = renderUseMaxPriorityFeePerGasInputHook({
      estimateToUse: 'high',
      transaction: {
        userFeeLevel: 'high',
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
        userFeeLevel: 'medium',
        txParams: {},
      },
    });
    expect(result.current.maxPriorityFeePerGas).toBe(
      FEE_MARKET_ESTIMATE_RETURN_VALUE.gasFeeEstimates.medium
        .suggestedMaxPriorityFeePerGas,
    );
  });

  it('returns 0 if supportsEIP1559 is false', () => {
    const { result } = renderUseMaxPriorityFeePerGasInputHook({
      supportsEIP1559: false,
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
});
