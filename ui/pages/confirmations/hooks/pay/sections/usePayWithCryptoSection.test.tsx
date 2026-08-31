import React from 'react';
import { renderHook, act } from '@testing-library/react';
import {
  PaymentOverride,
  type TransactionPaymentToken,
} from '@metamask/transaction-pay-controller';
import { useSelector } from 'react-redux';
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionPayToken } from '../useTransactionPayToken';
import { useClearPaymentOverride } from '../useClearPaymentOverride';
import {
  PAY_WITH_CRYPTO_OTHER_ASSETS_ROW_TEST_ID,
  PAY_WITH_CRYPTO_SECTION_TEST_ID,
  PAY_WITH_CRYPTO_SELECTED_TOKEN_ROW_TEST_ID,
  usePayWithCryptoSection,
} from './usePayWithCryptoSection';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));
jest.mock('../../../context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));
jest.mock('../useTransactionPayToken', () => ({
  useTransactionPayToken: jest.fn(),
}));
jest.mock('../useClearPaymentOverride', () => ({
  useClearPaymentOverride: jest.fn(),
}));
jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => {
    const messages: Record<string, string> = {
      available: 'available',
      payWithCrypto: 'Crypto',
      payWithOtherAssets: 'Other assets',
      payWithOtherAssetsDescription: 'Select from your tokens',
    };
    return messages[key] ?? key;
  },
}));
jest.mock('../../../../../hooks/useFiatFormatter', () => ({
  useFiatFormatter: () => (value: number) => `$${value.toFixed(2)}`,
}));
jest.mock('../../../components/token-icon', () => ({
  TokenIcon: () => <span data-testid="token-icon" />,
}));

const PAY_TOKEN = {
  address: '0x1111111111111111111111111111111111111111',
  chainId: '0x1',
  symbol: 'USDC',
  balanceUsd: '12.5',
  balanceFiat: '$12.50',
  balanceHuman: '12.5',
  balanceRaw: '12500000',
  decimals: 6,
} as TransactionPaymentToken;

describe('usePayWithCryptoSection', () => {
  const useSelectorMock = jest.mocked(useSelector);
  const useConfirmContextMock = jest.mocked(useConfirmContext);
  const useTransactionPayTokenMock = jest.mocked(useTransactionPayToken);
  const useClearPaymentOverrideMock = jest.mocked(useClearPaymentOverride);
  const onClose = jest.fn();
  const onOtherAssetsPress = jest.fn();
  const setPayToken = jest.fn();
  const clearOverride = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    useConfirmContextMock.mockReturnValue({
      currentConfirmation: { id: 'tx-1' },
    } as ReturnType<typeof useConfirmContext>);
    useSelectorMock.mockReturnValue(undefined);
    useClearPaymentOverrideMock.mockReturnValue(clearOverride);
    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN,
      setPayToken,
      isNative: false,
    });
  });

  it('returns a crypto section with selected token and other assets rows', () => {
    const { result } = renderHook(() =>
      usePayWithCryptoSection({ onClose, onOtherAssetsPress }),
    );

    expect(result.current).toMatchObject({
      id: 'crypto',
      title: 'Crypto',
      testId: PAY_WITH_CRYPTO_SECTION_TEST_ID,
      rows: [
        expect.objectContaining({
          title: 'USDC',
          subtitle: '$12.50 available',
          isSelected: true,
          trailingElement: 'checkmark',
          testId: PAY_WITH_CRYPTO_SELECTED_TOKEN_ROW_TEST_ID,
        }),
        expect.objectContaining({
          title: 'Other assets',
          subtitle: 'Select from your tokens',
          trailingElement: 'chevron',
          testId: PAY_WITH_CRYPTO_OTHER_ASSETS_ROW_TEST_ID,
        }),
      ],
    });
  });

  it('omits the selected token row when payToken is missing', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: undefined,
      setPayToken,
      isNative: false,
    });

    const { result } = renderHook(() =>
      usePayWithCryptoSection({ onClose, onOtherAssetsPress }),
    );

    expect(result.current?.rows).toHaveLength(1);
    expect(result.current?.rows[0].testId).toBe(
      PAY_WITH_CRYPTO_OTHER_ASSETS_ROW_TEST_ID,
    );
  });

  it('marks the selected token unselected when Money account is active', () => {
    useSelectorMock.mockReturnValue(PaymentOverride.MoneyAccount);

    const { result } = renderHook(() =>
      usePayWithCryptoSection({ onClose, onOtherAssetsPress }),
    );

    expect(result.current?.rows[0].isSelected).toBe(false);
    expect(result.current?.rows[0].trailingElement).toBe('none');
  });

  it('closes without clearing override when selected token is already active', () => {
    const { result } = renderHook(() =>
      usePayWithCryptoSection({ onClose, onOtherAssetsPress }),
    );

    act(() => {
      result.current?.rows[0].onPress?.();
    });

    expect(clearOverride).not.toHaveBeenCalled();
    expect(setPayToken).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('clears override and reselects pay token when Money account is active', () => {
    useSelectorMock.mockReturnValue(PaymentOverride.MoneyAccount);

    const { result } = renderHook(() =>
      usePayWithCryptoSection({ onClose, onOtherAssetsPress }),
    );

    act(() => {
      result.current?.rows[0].onPress?.();
    });

    expect(clearOverride).toHaveBeenCalled();
    expect(setPayToken).toHaveBeenCalledWith({
      address: PAY_TOKEN.address,
      chainId: PAY_TOKEN.chainId,
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('opens other assets without clearing override', () => {
    useSelectorMock.mockReturnValue(PaymentOverride.MoneyAccount);

    const { result } = renderHook(() =>
      usePayWithCryptoSection({ onClose, onOtherAssetsPress }),
    );

    act(() => {
      result.current?.rows[1].onPress?.();
    });

    expect(clearOverride).not.toHaveBeenCalled();
    expect(onOtherAssetsPress).toHaveBeenCalled();
  });
});
