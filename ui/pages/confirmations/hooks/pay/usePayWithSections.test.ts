import { renderHook } from '@testing-library/react';
import type { PayWithSectionConfig } from '../../components/modals/pay-with-modal/pay-with-modal.types';
import { usePayWithCryptoSection } from './sections/usePayWithCryptoSection';
import { usePayWithMoneyAccountSection } from './sections/usePayWithMoneyAccountSection';
import { usePayWithSections } from './usePayWithSections';

jest.mock('./sections/usePayWithCryptoSection', () => ({
  usePayWithCryptoSection: jest.fn(),
}));
jest.mock('./sections/usePayWithMoneyAccountSection', () => ({
  usePayWithMoneyAccountSection: jest.fn(),
}));

describe('usePayWithSections', () => {
  const usePayWithCryptoSectionMock = jest.mocked(usePayWithCryptoSection);
  const usePayWithMoneyAccountSectionMock = jest.mocked(
    usePayWithMoneyAccountSection,
  );
  const onClose = jest.fn();
  const onOtherAssetsPress = jest.fn();

  const moneySection = {
    id: 'money-account',
    title: '',
    rows: [],
  } as PayWithSectionConfig;

  const cryptoSection = {
    id: 'crypto',
    title: 'Crypto',
    rows: [],
  } as PayWithSectionConfig;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns both sections when both hooks provide configs', () => {
    usePayWithMoneyAccountSectionMock.mockReturnValue(moneySection);
    usePayWithCryptoSectionMock.mockReturnValue(cryptoSection);

    const { result } = renderHook(() =>
      usePayWithSections({ onClose, onOtherAssetsPress }),
    );

    expect(usePayWithMoneyAccountSectionMock).toHaveBeenCalledWith({ onClose });
    expect(usePayWithCryptoSectionMock).toHaveBeenCalledWith({
      onClose,
      onOtherAssetsPress,
    });
    expect(result.current.sections).toStrictEqual([
      moneySection,
      cryptoSection,
    ]);
  });

  it('filters out null sections', () => {
    usePayWithMoneyAccountSectionMock.mockReturnValue(null);
    usePayWithCryptoSectionMock.mockReturnValue(cryptoSection);

    const { result } = renderHook(() =>
      usePayWithSections({ onClose, onOtherAssetsPress }),
    );

    expect(result.current.sections).toStrictEqual([cryptoSection]);
  });
});
