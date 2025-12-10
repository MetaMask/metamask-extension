import { renderHook } from '@testing-library/react-hooks';
import {
  GasFeeEstimateType,
  GasFeeEstimateLevel,
} from '@metamask/transaction-controller';

import { useGasFeeEstimates } from '../../../../hooks/useGasFeeEstimates';
import { useConfirmContext } from '../../context/confirm';
import { useFeeCalculations } from '../../components/confirm/info/hooks/useFeeCalculations';
import { useGasFeeEstimateLevelOptions } from './useGasFeeEstimateLevelOptions';

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));

jest.mock('../../../../hooks/useGasFeeEstimates', () => ({
  useGasFeeEstimates: jest.fn(),
}));

jest.mock('../../components/confirm/info/hooks/useFeeCalculations', () => ({
  useFeeCalculations: jest.fn(),
}));

jest.mock('../transactions/useTransactionNativeTicker', () => ({
  useTransactionNativeTicker: () => 'ETH',
}));

jest.mock('../../../../store/actions', () => ({
  updateTransactionGasFees: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
}));

const mockUseConfirmContext = jest.mocked(useConfirmContext);
const mockUseGasFeeEstimates = jest.mocked(useGasFeeEstimates);
const mockUseFeeCalculations = jest.mocked(useFeeCalculations);

describe('useGasFeeEstimateLevelOptions', () => {
  const mockHandleCloseModals = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseFeeCalculations.mockReturnValue({
      calculateGasEstimate: jest.fn().mockReturnValue({
        currentCurrencyFee: '$1.00',
        preciseNativeCurrencyFee: '0.001',
      }),
    } as unknown as ReturnType<typeof useFeeCalculations>);
  });

  it('returns empty array when gas fee estimate type is GasPrice', () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        id: '1',
        networkClientId: 'mainnet',
        userFeeLevel: 'medium',
        gasFeeEstimates: {
          type: GasFeeEstimateType.GasPrice,
        },
      },
    } as unknown as ReturnType<typeof useConfirmContext>);

    mockUseGasFeeEstimates.mockReturnValue({
      gasFeeEstimates: {},
    } as ReturnType<typeof useGasFeeEstimates>);

    const { result } = renderHook(() =>
      useGasFeeEstimateLevelOptions({
        handleCloseModals: mockHandleCloseModals,
      }),
    );

    expect(result.current).toEqual([]);
  });

  it('returns options for low/medium/high when gas fee estimate type is FeeMarket', () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        id: '1',
        networkClientId: 'mainnet',
        userFeeLevel: 'medium',
        gasLimitNoBuffer: '0x5208',
        gasFeeEstimates: {
          type: GasFeeEstimateType.FeeMarket,
          [GasFeeEstimateLevel.Low]: {
            maxFeePerGas: '0x1',
            maxPriorityFeePerGas: '0x1',
          },
          [GasFeeEstimateLevel.Medium]: {
            maxFeePerGas: '0x2',
            maxPriorityFeePerGas: '0x2',
          },
          [GasFeeEstimateLevel.High]: {
            maxFeePerGas: '0x3',
            maxPriorityFeePerGas: '0x3',
          },
        },
      },
    } as unknown as ReturnType<typeof useConfirmContext>);

    mockUseGasFeeEstimates.mockReturnValue({
      gasFeeEstimates: {
        [GasFeeEstimateLevel.Low]: {
          minWaitTimeEstimate: 15000,
          maxWaitTimeEstimate: 30000,
        },
        [GasFeeEstimateLevel.Medium]: {
          minWaitTimeEstimate: 10000,
          maxWaitTimeEstimate: 20000,
        },
        [GasFeeEstimateLevel.High]: {
          minWaitTimeEstimate: 5000,
          maxWaitTimeEstimate: 10000,
        },
      },
    } as unknown as ReturnType<typeof useGasFeeEstimates>);

    const { result } = renderHook(() =>
      useGasFeeEstimateLevelOptions({
        handleCloseModals: mockHandleCloseModals,
      }),
    );

    expect(result.current).toHaveLength(3);
    expect(result.current[0].key).toBe(GasFeeEstimateLevel.Low);
    expect(result.current[1].key).toBe(GasFeeEstimateLevel.Medium);
    expect(result.current[2].key).toBe(GasFeeEstimateLevel.High);
    expect(result.current[1].isSelected).toBe(true);
  });
});
