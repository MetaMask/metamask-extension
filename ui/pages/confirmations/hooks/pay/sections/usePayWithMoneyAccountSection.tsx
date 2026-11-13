import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { PaymentOverride } from '@metamask/transaction-pay-controller';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import {
  selectPaymentOverrideByTransactionId,
  type TransactionPayState,
} from '../../../../../selectors/transactionPayController';
import { hasTransactionType } from '../../../../../../shared/lib/transactions.utils';
import { getConfirmationTransactionType } from '../../../utils/confirm';
import { selectIsMoneyAccountTransactionEnabled } from '../../../selectors/feature-flags';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useMoneyAccountWithdrawableFiat } from '../../../../../hooks/money/useMoneyAccountWithdrawableFiat';
import { useMoneyVaultApy } from '../../../../../hooks/money/useMoneyVaultApy';
import { selectPrimaryMoneyAccount } from '../../../../../selectors/money-account';
import { useConfirmContext } from '../../../context/confirm';
import { NoDepositFeeTag } from '../../../components/UI/no-fee-tag';
import { ApyTag } from '../../../components/UI/apy-tag';
import { applyMoneyAccountOverride } from '../../../utils/transaction-pay';
import type {
  PayWithRowTagRenderer,
  PayWithSectionConfig,
} from '../../../components/modals/pay-with-modal/pay-with-modal.types';

export const PAY_WITH_MONEY_ACCOUNT_SECTION_TEST_ID =
  'pay-with-section-money-account';
export const PAY_WITH_MONEY_ACCOUNT_ROW_TEST_ID = 'pay-with-money-account-row';
export const PAY_WITH_MONEY_ACCOUNT_APY_TAG_TEST_ID = `${PAY_WITH_MONEY_ACCOUNT_ROW_TEST_ID}-apy-tag`;

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
  const { withdrawableFiatFormatted } = useMoneyAccountWithdrawableFiat(
    Boolean(isEnabled && primaryMoneyAccount),
  );

  // Perps withdraw pays into the Money Account, so the vault rate is what the
  // user earns on the funds they receive. Every other flow spends from the
  // account, where that rate is not a property of the payment.
  const isPerpsWithdraw = hasTransactionType(currentConfirmation, [
    TransactionType.perpsWithdraw,
  ]);
  const { apyPercentFormatted } = useMoneyVaultApy({
    enabled: isPerpsWithdraw,
  });

  const paymentOverride = useSelector((state: TransactionPayState) =>
    selectPaymentOverrideByTransactionId(state, transactionId),
  );
  const isMoneyAccountSelected =
    paymentOverride === PaymentOverride.MoneyAccount;
  const showNoDepositFeeTag = hasTransactionType(currentConfirmation, [
    TransactionType.perpsDeposit,
    TransactionType.perpsDepositAndOrder,
  ]);

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

    const tagRenderers: PayWithRowTagRenderer[] = [];
    if (isPerpsWithdraw && apyPercentFormatted) {
      tagRenderers.push(() => (
        <ApyTag
          apyPercentFormatted={apyPercentFormatted}
          testId={PAY_WITH_MONEY_ACCOUNT_APY_TAG_TEST_ID}
        />
      ));
    }
    if (showNoDepositFeeTag) {
      tagRenderers.push(() => (
        <NoDepositFeeTag
          testId={`${PAY_WITH_MONEY_ACCOUNT_ROW_TEST_ID}-no-fee-tag`}
        />
      ));
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
          subtitle,
          isSelected: isMoneyAccountSelected,
          ...(tagRenderers.length > 0 ? { tagRenderers } : {}),
          trailingElement: isMoneyAccountSelected ? 'checkmark' : 'none',
          onPress: handlePress,
          testId: PAY_WITH_MONEY_ACCOUNT_ROW_TEST_ID,
        },
      ],
    };
  }, [
    apyPercentFormatted,
    handlePress,
    isEnabled,
    isMoneyAccountSelected,
    isPerpsWithdraw,
    primaryMoneyAccount,
    showNoDepositFeeTag,
    t,
    withdrawableFiatFormatted,
  ]);
}
