import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { PaymentOverride } from '@metamask/transaction-pay-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  selectPaymentOverrideByTransactionId,
  type TransactionPayState,
} from '../../../../../selectors/transactionPayController';
import { selectIsMoneyAccountTransactionEnabled } from '../../../selectors/feature-flags';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { applyMoneyAccountOverride } from '../../../utils/transaction-pay';
import type { PayWithSectionConfig } from '../../../components/modals/pay-with-modal/pay-with-modal.types';

export const PAY_WITH_MONEY_ACCOUNT_SECTION_TEST_ID =
  'pay-with-section-money-account';
export const PAY_WITH_MONEY_ACCOUNT_ROW_TEST_ID = 'pay-with-money-account-row';

/** Temporary placeholder until Money account balance wiring lands. */
export const MONEY_ACCOUNT_DUMMY_BALANCE_FIAT = '$7.05';

type UsePayWithMoneyAccountSectionArgs = {
  onClose: () => void;
};

export function usePayWithMoneyAccountSection({
  onClose,
}: UsePayWithMoneyAccountSectionArgs): PayWithSectionConfig | null {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';
  const transactionType = currentConfirmation?.type;

  const isEnabled = useSelector((state) =>
    selectIsMoneyAccountTransactionEnabled(state, transactionType),
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
    applyMoneyAccountOverride(transactionId, undefined, currentConfirmation);
    onClose();
  }, [currentConfirmation, onClose, transactionId]);

  return useMemo(() => {
    if (!isEnabled) {
      return null;
    }

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
          subtitle: `${MONEY_ACCOUNT_DUMMY_BALANCE_FIAT} ${t('available')}`,
          isSelected: isMoneyAccountSelected,
          trailingElement: isMoneyAccountSelected ? 'checkmark' : 'none',
          onPress: handlePress,
          testId: PAY_WITH_MONEY_ACCOUNT_ROW_TEST_ID,
        },
      ],
    };
  }, [handlePress, isEnabled, isMoneyAccountSelected, t]);
}
