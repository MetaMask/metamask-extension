import { renderHook } from '@testing-library/react-hooks';
import { UserFeeLevel } from '@metamask/transaction-controller';

import { useTransactionMetadataRequest } from '../useTransactionMetadataRequest';
import { useFeeCalculations } from '../../components/confirm/info/hooks/useFeeCalculations';
import { useDappSuggestedGasFeeOption } from './useDappSuggestedGasFeeOption';

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../useTransactionMetadataRequest', () => ({
  useTransactionMetadataRequest: jest.fn(),
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

const mockUseTransactionMetadataRequest = jest.mocked(
  useTransactionMetadataRequest,
);
const mockUseFeeCalculations = jest.mocked(useFeeCalculations);

describe('useDappSuggestedGasFeeOption', () => {
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

  it('returns empty array when origin is metamask', () => {
    mockUseTransactionMetadataRequest.mockReturnValue({
      id: '1',
      origin: 'metamask',
      userFeeLevel: 'medium',
      dappSuggestedGasFees: {
        maxFeePerGas: '0x1',
        maxPriorityFeePerGas: '0x1',
      },
    } as unknown as ReturnType<typeof useTransactionMetadataRequest>);

    const { result } = renderHook(() =>
      useDappSuggestedGasFeeOption({
        handleCloseModals: mockHandleCloseModals,
      }),
    );

    expect(result.current).toEqual([]);
  });

  it('returns empty array when dappSuggestedGasFees is not present', () => {
    mockUseTransactionMetadataRequest.mockReturnValue({
      id: '1',
      origin: 'https://example.com',
      userFeeLevel: 'medium',
      dappSuggestedGasFees: undefined,
    } as unknown as ReturnType<typeof useTransactionMetadataRequest>);

    const { result } = renderHook(() =>
      useDappSuggestedGasFeeOption({
        handleCloseModals: mockHandleCloseModals,
      }),
    );

    expect(result.current).toEqual([]);
  });

  it('returns dapp suggested option when origin is external and dappSuggestedGasFees exists', () => {
    mockUseTransactionMetadataRequest.mockReturnValue({
      id: '1',
      origin: 'https://example.com',
      userFeeLevel: UserFeeLevel.DAPP_SUGGESTED,
      gasLimitNoBuffer: '0x5208',
      dappSuggestedGasFees: {
        maxFeePerGas: '0x2540be400',
        maxPriorityFeePerGas: '0x3b9aca00',
      },
    } as unknown as ReturnType<typeof useTransactionMetadataRequest>);

    const { result } = renderHook(() =>
      useDappSuggestedGasFeeOption({
        handleCloseModals: mockHandleCloseModals,
      }),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].key).toBe('site_suggested');
    expect(result.current[0].name).toBe('dappSuggested');
    expect(result.current[0].isSelected).toBe(true);
  });
});
