import React, { isValidElement } from 'react';
import { renderHook, act } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';
import { PaymentOverride } from '@metamask/transaction-pay-controller';
import { useSelector } from 'react-redux';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { useConfirmContext } from '../../../context/confirm';
import { useMoneyAccountWithdrawableFiat } from '../../../../../hooks/money/useMoneyAccountWithdrawableFiat';
import { useMoneyVaultApy } from '../../../../../hooks/money/useMoneyVaultApy';
import { applyMoneyAccountOverride } from '../../../utils/transaction-pay';
import { ApyTag } from '../../../components/UI/apy-tag';
import {
  PAY_WITH_MONEY_ACCOUNT_APY_TAG_TEST_ID,
  PAY_WITH_MONEY_ACCOUNT_ROW_TEST_ID,
  usePayWithMoneyAccountSection,
} from './usePayWithMoneyAccountSection';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));
jest.mock('../../../context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));
jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => {
    const copy: Record<string, string> = {
      payWithMoneyAccount: 'Money account',
      available: 'available',
      noDepositFee: 'No deposit fee',
    };
    return copy[key] ?? key;
  },
}));
jest.mock('../../../../../hooks/money/useMoneyAccountWithdrawableFiat', () => ({
  useMoneyAccountWithdrawableFiat: jest.fn(),
}));
jest.mock('../../../../../hooks/money/useMoneyVaultApy', () => ({
  useMoneyVaultApy: jest.fn(),
}));
jest.mock('../../../utils/transaction-pay', () => ({
  applyMoneyAccountOverride: jest.fn(),
}));

const MONEY_ACCOUNT_ADDRESS = '0xc4ff9e84b5754570812d891ade0bad3952bb5946';

function mockVaultApy(apyPercent?: number) {
  jest.mocked(useMoneyVaultApy).mockReturnValue({
    apyDecimal: apyPercent === undefined ? undefined : apyPercent / 100,
    apyPercent,
    apyPercentFormatted:
      apyPercent === undefined ? undefined : `${apyPercent}%`,
    vaultApyQuery: {
      isError: false,
      isLoading: false,
    },
  } as ReturnType<typeof useMoneyVaultApy>);
}

function mockSelectors({
  primaryMoneyAccount = { address: MONEY_ACCOUNT_ADDRESS },
  isEnabled = true,
  paymentOverride = undefined as PaymentOverride | undefined,
}: {
  primaryMoneyAccount?: { address: string } | null;
  isEnabled?: boolean;
  paymentOverride?: PaymentOverride | undefined;
} = {}) {
  let callIndex = 0;
  const sequence = [primaryMoneyAccount, isEnabled, paymentOverride];
  jest.mocked(useSelector).mockImplementation(() => {
    const value = sequence[callIndex % sequence.length];
    callIndex += 1;
    return value;
  });
}

describe('usePayWithMoneyAccountSection', () => {
  const useConfirmContextMock = jest.mocked(useConfirmContext);
  const useCachedBalanceMock = jest.mocked(useMoneyAccountWithdrawableFiat);
  const applyMoneyAccountOverrideMock = jest.mocked(applyMoneyAccountOverride);
  const onClose = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {
        id: 'tx-1',
        type: TransactionType.perpsDeposit,
      },
    } as ReturnType<typeof useConfirmContext>);
    useCachedBalanceMock.mockReturnValue({
      isLoading: false,
      withdrawableFiatRaw: undefined,
      withdrawableFiatFormatted: '$12.34',
    });
    mockVaultApy();
    mockSelectors();
  });

  it('returns null when money account transactions are disabled', () => {
    mockSelectors({ isEnabled: false });

    const { result } = renderHook(() =>
      usePayWithMoneyAccountSection({ onClose }),
    );

    expect(result.current).toBeNull();
  });

  it('returns null when there is no money account', () => {
    mockSelectors({ primaryMoneyAccount: null });

    const { result } = renderHook(() =>
      usePayWithMoneyAccountSection({ onClose }),
    );

    expect(result.current).toBeNull();
  });

  it('returns a money account section when enabled', () => {
    const { result } = renderHook(() =>
      usePayWithMoneyAccountSection({ onClose }),
    );

    expect(result.current).toMatchObject({
      id: 'money-account',
      rows: [
        expect.objectContaining({
          title: 'Money account',
          subtitle: '$12.34 available',
          testId: PAY_WITH_MONEY_ACCOUNT_ROW_TEST_ID,
          isSelected: false,
        }),
      ],
    });
  });

  it('returns a money account section for perpsWithdraw when enabled', () => {
    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {
        id: 'tx-withdraw-1',
        type: TransactionType.perpsWithdraw,
      },
    } as ReturnType<typeof useConfirmContext>);

    const { result } = renderHook(() =>
      usePayWithMoneyAccountSection({ onClose }),
    );

    expect(result.current).toMatchObject({
      id: 'money-account',
      rows: [
        expect.objectContaining({
          title: 'Money account',
          testId: PAY_WITH_MONEY_ACCOUNT_ROW_TEST_ID,
        }),
      ],
    });
  });

  it('applies the money account override and closes on press', () => {
    const { result } = renderHook(() =>
      usePayWithMoneyAccountSection({ onClose }),
    );

    act(() => {
      result.current?.rows[0].onPress?.();
    });

    expect(applyMoneyAccountOverrideMock).toHaveBeenCalledWith(
      'tx-1',
      MONEY_ACCOUNT_ADDRESS,
      expect.objectContaining({
        id: 'tx-1',
        type: TransactionType.perpsDeposit,
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('marks the row selected when paymentOverride is MoneyAccount', () => {
    mockSelectors({ paymentOverride: PaymentOverride.MoneyAccount });

    const { result } = renderHook(() =>
      usePayWithMoneyAccountSection({ onClose }),
    );

    expect(result.current?.rows[0].isSelected).toBe(true);
    expect(result.current?.rows[0].trailingElement).toBe('checkmark');
  });

  describe('no deposit fee tag', () => {
    [
      TransactionType.perpsDeposit,
      TransactionType.perpsDepositAndOrder,
    ].forEach((txType) => {
      it(`renders the no deposit fee tag on the money account row for ${txType}`, () => {
        useConfirmContextMock.mockReturnValue({
          currentConfirmation: {
            id: 'tx-1',
            type: txType,
          },
        } as ReturnType<typeof useConfirmContext>);
        mockSelectors();

        const { result } = renderHook(() =>
          usePayWithMoneyAccountSection({ onClose }),
        );
        const tag = result.current?.rows[0].tagRenderers?.[0]?.();
        const { getByTestId, getByText } = renderWithProvider(
          <>{tag}</>,
          configureStore(mockState),
        );

        expect(
          getByTestId(`${PAY_WITH_MONEY_ACCOUNT_ROW_TEST_ID}-no-fee-tag`),
        ).toBeInTheDocument();
        expect(getByText(messages.noDepositFee.message)).toBeInTheDocument();
      });
    });

    [TransactionType.predictDeposit, TransactionType.perpsWithdraw].forEach(
      (txType) => {
        it(`omits the tag for ${txType}`, () => {
          useConfirmContextMock.mockReturnValue({
            currentConfirmation: {
              id: 'tx-1',
              type: txType,
            },
          } as ReturnType<typeof useConfirmContext>);
          mockSelectors();

          const { result } = renderHook(() =>
            usePayWithMoneyAccountSection({ onClose }),
          );

          expect(result.current?.rows[0].tagRenderers).toBeUndefined();
        });
      },
    );
  });

  describe('APY tag', () => {
    it('skips the vault APY request outside perps withdraw', () => {
      renderHook(() => usePayWithMoneyAccountSection({ onClose }));

      expect(useMoneyVaultApy).toHaveBeenCalledWith({ enabled: false });
    });

    it('shows the vault APY tag on perps withdraw when the rate is known', () => {
      useConfirmContextMock.mockReturnValue({
        currentConfirmation: {
          id: 'tx-withdraw-1',
          type: TransactionType.perpsWithdraw,
        },
      } as ReturnType<typeof useConfirmContext>);
      mockVaultApy(4.2);

      const { result } = renderHook(() =>
        usePayWithMoneyAccountSection({ onClose }),
      );

      expect(useMoneyVaultApy).toHaveBeenCalledWith({ enabled: true });
      const tag = result.current?.rows[0].tagRenderers?.[0]?.();
      expect(isValidElement(tag) ? tag.type : undefined).toBe(ApyTag);
      expect(isValidElement(tag) ? tag.props : undefined).toStrictEqual({
        apyPercentFormatted: '4.2%',
        testId: PAY_WITH_MONEY_ACCOUNT_APY_TAG_TEST_ID,
      });
    });

    it('hides the APY tag on perps withdraw when the rate is unknown', () => {
      useConfirmContextMock.mockReturnValue({
        currentConfirmation: {
          id: 'tx-withdraw-1',
          type: TransactionType.perpsWithdraw,
        },
      } as ReturnType<typeof useConfirmContext>);

      const { result } = renderHook(() =>
        usePayWithMoneyAccountSection({ onClose }),
      );

      expect(result.current?.rows[0].tagRenderers).toBeUndefined();
    });

    [
      TransactionType.perpsDeposit,
      TransactionType.perpsDepositAndOrder,
      TransactionType.moneyAccountDeposit,
      TransactionType.moneyAccountWithdraw,
    ].forEach((txType) => {
      it(`hides the APY tag for ${txType} even when a rate is known`, () => {
        useConfirmContextMock.mockReturnValue({
          currentConfirmation: {
            id: 'tx-1',
            type: txType,
          },
        } as ReturnType<typeof useConfirmContext>);
        mockVaultApy(4.2);

        const { result } = renderHook(() =>
          usePayWithMoneyAccountSection({ onClose }),
        );

        expect(useMoneyVaultApy).toHaveBeenCalledWith({ enabled: false });
        const tags =
          result.current?.rows[0].tagRenderers?.map((render) => render()) ?? [];
        expect(
          tags.some((tag) => isValidElement(tag) && tag.type === ApyTag),
        ).toBe(false);
      });
    });
  });
});
