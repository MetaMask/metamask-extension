import { renderHook } from '@testing-library/react-hooks';
import {
  GasFeeEstimateLevel,
  TransactionEnvelopeType,
  UserFeeLevel,
} from '@metamask/transaction-controller';

import { GasModalType } from '../../constants/gas';
import { useConfirmContext } from '../../context/confirm';
import { useFeeCalculations } from '../../components/confirm/info/hooks/useFeeCalculations';
import { useTransactionGasLimit } from './useTransactionGasLimit';
import { useAdvancedGasFeeOption } from './useAdvancedGasFeeOption';

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));

jest.mock('../../components/confirm/info/hooks/useFeeCalculations', () => ({
  useFeeCalculations: jest.fn(),
}));

jest.mock('./useTransactionGasLimit', () => ({
  useTransactionGasLimit: jest.fn(),
}));

jest.mock('../transactions/useTransactionNativeTicker', () => ({
  useTransactionNativeTicker: () => 'ETH',
}));

const mockUseConfirmContext = jest.mocked(useConfirmContext);
const mockUseFeeCalculations = jest.mocked(useFeeCalculations);
const mockUseTransactionGasLimit = jest.mocked(useTransactionGasLimit);

describe('useAdvancedGasFeeOption', () => {
  const mockSetActiveModal = jest.fn();
  const mockCalculateGasEstimate = jest.fn().mockReturnValue({
    currentCurrencyFee: '$1.00',
    preciseNativeCurrencyFee: '0.001',
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockCalculateGasEstimate.mockClear();
    mockUseFeeCalculations.mockReturnValue({
      calculateGasEstimate: mockCalculateGasEstimate,
    } as unknown as ReturnType<typeof useFeeCalculations>);

    mockUseTransactionGasLimit.mockReturnValue({
      gasLimit: '0x5208',
      quotedGasLimit: undefined,
    });
  });

  it('returns advanced option with isSelected false when userFeeLevel is a standard level', () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        id: '1',
        userFeeLevel: GasFeeEstimateLevel.Medium,
        gasFeeEstimates: {},
        txParams: {
          type: TransactionEnvelopeType.feeMarket,
          gas: '0x5208',
          maxFeePerGas: '0x2540be400',
          maxPriorityFeePerGas: '0x3b9aca00',
        },
      },
    } as unknown as ReturnType<typeof useConfirmContext>);

    const { result } = renderHook(() =>
      useAdvancedGasFeeOption({ setActiveModal: mockSetActiveModal }),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].key).toBe('advanced');
    expect(result.current[0].name).toBe('advanced');
    expect(result.current[0].isSelected).toBe(false);
  });

  it('returns advanced option with isSelected true when userFeeLevel is custom', () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        id: '1',
        userFeeLevel: UserFeeLevel.CUSTOM,
        gasLimitNoBuffer: '0x5208',
        gasFeeEstimates: {},
        txParams: {
          type: TransactionEnvelopeType.feeMarket,
          gas: '0x5208',
          maxFeePerGas: '0x2540be400',
          maxPriorityFeePerGas: '0x3b9aca00',
        },
      },
    } as unknown as ReturnType<typeof useConfirmContext>);

    const { result } = renderHook(() =>
      useAdvancedGasFeeOption({ setActiveModal: mockSetActiveModal }),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].key).toBe('advanced');
    expect(result.current[0].isSelected).toBe(true);
    expect(result.current[0].value).toBe('0.001 ETH');
  });

  it('calls setActiveModal with AdvancedEIP1559Modal for feeMarket transactions', () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        id: '1',
        userFeeLevel: GasFeeEstimateLevel.Medium,
        gasFeeEstimates: {},
        txParams: {
          type: TransactionEnvelopeType.feeMarket,
          gas: '0x5208',
          maxFeePerGas: '0x2540be400',
          maxPriorityFeePerGas: '0x3b9aca00',
        },
      },
    } as unknown as ReturnType<typeof useConfirmContext>);

    const { result } = renderHook(() =>
      useAdvancedGasFeeOption({ setActiveModal: mockSetActiveModal }),
    );

    result.current[0].onSelect();

    expect(mockSetActiveModal).toHaveBeenCalledWith(
      GasModalType.AdvancedEIP1559Modal,
    );
  });

  it('calls setActiveModal with AdvancedGasPriceModal for legacy transactions', () => {
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        id: '1',
        userFeeLevel: GasFeeEstimateLevel.Medium,
        gasFeeEstimates: {},
        txParams: {
          type: TransactionEnvelopeType.legacy,
          gas: '0x5208',
          gasPrice: '0x2540be400',
        },
      },
    } as unknown as ReturnType<typeof useConfirmContext>);

    const { result } = renderHook(() =>
      useAdvancedGasFeeOption({ setActiveModal: mockSetActiveModal }),
    );

    result.current[0].onSelect();

    expect(mockSetActiveModal).toHaveBeenCalledWith(
      GasModalType.AdvancedGasPriceModal,
    );
  });

  it('passes the gas limit from useTransactionGasLimit to calculateGasEstimate and tooltip', () => {
    mockUseTransactionGasLimit.mockReturnValue({
      gasLimit: '0x1fbd0',
      quotedGasLimit: undefined,
    });

    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: {
        id: '1',
        userFeeLevel: UserFeeLevel.CUSTOM,
        gasFeeEstimates: {},
        gasLimitNoBuffer: '0x5208',
        containerTypes: ['EnforcedSimulations'],
        txParams: {
          type: TransactionEnvelopeType.feeMarket,
          gas: '0x1fbd0',
          maxFeePerGas: '0x2540be400',
          maxPriorityFeePerGas: '0x3b9aca00',
        },
      },
    } as unknown as ReturnType<typeof useConfirmContext>);

    const { result } = renderHook(() =>
      useAdvancedGasFeeOption({ setActiveModal: mockSetActiveModal }),
    );

    expect(mockCalculateGasEstimate).toHaveBeenCalledWith(
      expect.objectContaining({ gas: '0x1fbd0' }),
    );
    expect(result.current[0].tooltipProps?.gasLimit).toBe(0x1fbd0);
  });
});
