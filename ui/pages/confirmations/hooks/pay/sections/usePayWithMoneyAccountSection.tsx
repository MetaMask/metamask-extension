import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { PaymentOverride } from '@metamask/transaction-pay-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  selectPaymentOverrideByTransactionId,
  type TransactionPayState,
} from '../../../../../selectors/transactionPayController';
import { getConfirmationTransactionType } from '../../../utils/confirm';
import { selectIsMoneyAccountTransactionEnabled } from '../../../selectors/feature-flags';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useCachedMoneyAccountWithdrawableFiat } from '../../../../../hooks/money/useCachedMoneyAccountWithdrawableFiat';
import { selectPrimaryMoneyAccount } from '../../../../../selectors/money-account';
import { useConfirmContext } from '../../../context/confirm';
import { applyMoneyAccountOverride } from '../../../utils/transaction-pay';
import type { PayWithSectionConfig } from '../../../components/modals/pay-with-modal/pay-with-modal.types';

export const PAY_WITH_MONEY_ACCOUNT_SECTION_TEST_ID =
  'pay-with-section-money-account';
export const PAY_WITH_MONEY_ACCOUNT_ROW_TEST_ID = 'pay-with-money-account-row';

type UsePayWithMoneyAccountSectionArgs = {
  onClose: () => void;
};

export function usePayWithMoneyAccountSection({
  onClose,
}: UsePayWithMoneyAccountSectionArgs): PayWithSectionConfig | null {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';
  const transactionType = getConfirmationTransactionType(currentConfirmation);
  const primaryMoneyAccount = useSelector(selectPrimaryMoneyAccount);

  const isEnabled = useSelector((state) =>
    selectIsMoneyAccountTransactionEnabled(state, transactionType),
  );
  const { withdrawableFiatFormatted } = useCachedMoneyAccountWithdrawableFiat(
    Boolean(isEnabled && primaryMoneyAccount),
  );

  const paymentOverride = useSelector((state: TransactionPayState) =>
    selectPaymentOverrideByTransactionId(state, transactionId),
  );
  const isMoneyAccountSelected =
    paymentOverride === PaymentOverride.MoneyAccount;

  const handlePress = useCallback(() => {
    if (!transactionId) {
      return;
    }
    applyMoneyAccountOverride(
      transactionId,
      primaryMoneyAccount?.address,
      currentConfirmation,
    );
    onClose();
  }, [
    currentConfirmation,
    onClose,
    primaryMoneyAccount?.address,
    transactionId,
  ]);

  return useMemo(() => {
    if (!isEnabled || !primaryMoneyAccount) {
      return null;
    }

    const subtitle = withdrawableFiatFormatted
      ? `${withdrawableFiatFormatted} ${t('available')}`
      : undefined;

    return {
      id: 'money-account',
      title: '',
      testId: PAY_WITH_MONEY_ACCOUNT_SECTION_TEST_ID,
      rows: [
        {
          id: 'money-account-musd',
          icon: (
            <img
              src="./images/money.png"
              alt=""
              width={24}
              height={24}
              data-testid={`${PAY_WITH_MONEY_ACCOUNT_ROW_TEST_ID}-icon`}
            />
          ),
          title: t('payWithMoneyAccount'),
          subtitle,
          isSelected: isMoneyAccountSelected,
          trailingElement: isMoneyAccountSelected ? 'checkmark' : 'none',
          onPress: handlePress,
          testId: PAY_WITH_MONEY_ACCOUNT_ROW_TEST_ID,
        },
      ],
    };
  }, [
    handlePress,
    isEnabled,
    isMoneyAccountSelected,
    primaryMoneyAccount,
    t,
    withdrawableFiatFormatted,
  ]);
}
