import { renderHook } from '@testing-library/react-hooks';
import {
  GasFeeEstimateType,
  TransactionEnvelopeType,
} from '@metamask/transaction-controller';

import { useGasFeeEstimates } from '../../../../hooks/useGasFeeEstimates';
import { useConfirmContext } from '../../context/confirm';
import { useFeeCalculations } from '../../components/confirm/info/hooks/useFeeCalculations';
import { useGasPriceEstimateOption } from './useGasPriceEstimateOption';

const MOCK_GAS_PRICE = '0x2540be400';

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

describe('useGasPriceEstimateOption', () => {
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

  it('returns empty array when gas fee estimate type is not GasPrice', () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        id: '1',
        networkClientId: 'mainnet',
        userFeeLevel: 'medium',
        gasFeeEstimates: {
          type: GasFeeEstimateType.FeeMarket,
        },
        txParams: {
          type: TransactionEnvelopeType.feeMarket,
        },
      },
    } as unknown as ReturnType<typeof useConfirmContext>);

    mockUseGasFeeEstimates.mockReturnValue({
      gasFeeEstimates: {},
    } as ReturnType<typeof useGasFeeEstimates>);

    const { result } = renderHook(() =>
      useGasPriceEstimateOption({ handleCloseModals: mockHandleCloseModals }),
    );

    expect(result.current).toEqual([]);
  });

  it('returns gas price option when gas fee estimate type is GasPrice', () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        id: '1',
        networkClientId: 'mainnet',
        userFeeLevel: 'medium',
        gasLimitNoBuffer: '0x5208',
        gasFeeEstimates: {
          type: GasFeeEstimateType.GasPrice,
          gasPrice: MOCK_GAS_PRICE,
        },
        txParams: {
          type: TransactionEnvelopeType.legacy,
        },
      },
    } as unknown as ReturnType<typeof useConfirmContext>);

    mockUseGasFeeEstimates.mockReturnValue({
      gasFeeEstimates: { gasPrice: '10' },
    } as unknown as ReturnType<typeof useGasFeeEstimates>);

    const { result } = renderHook(() =>
      useGasPriceEstimateOption({ handleCloseModals: mockHandleCloseModals }),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].key).toBe('gasPrice');
    expect(result.current[0].name).toBe('networkSuggested');
    expect(result.current[0].isSelected).toBe(true);
  });
});
