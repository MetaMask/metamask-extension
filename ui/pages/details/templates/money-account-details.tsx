import React from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import { TransactionStatus as TransactionMetaStatus } from '@metamask/transaction-controller';
import type { MoneyAccountActivityItem } from '../../../../shared/lib/activity/types';
import { MONEY_ACCOUNT_FIAT_CURRENCY } from '../../../../shared/lib/money/constants';
import { useLocalTransactionMeta } from '../../../hooks/activity/useLocalTransactionMeta';
import { useMoneyAccountDeposit } from '../../../hooks/money/useMoneyAccountDeposit';
import { useMoneyAccountInfo } from '../../../hooks/money/useMoneyAccountInfo';
import { useFormatters } from '../../../hooks/useFormatters';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { BlockExplorerButton } from '../components/block-explorer-button';
import { MmPayDetailsLayout } from './mm-pay-details-layout';

type Props = {
  item: MoneyAccountActivityItem;
};

/**
 * Details for money-account deposits and withdrawals, laid out like the
 * other MM Pay details (perps): fiat hero, status and date, MM Pay fee
 * breakdown, and the per-transaction summary.
 *
 * @param props - Component props.
 * @param props.item - The money-account activity item to render.
 */
export function MoneyAccountDetails({ item }: Readonly<Props>) {
  const t = useI18nContext();
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const { hasMoneyAccount } = useMoneyAccountInfo();
  const { initiateDeposit, isLoading: isDepositLoading } =
    useMoneyAccountDeposit();
  const transactionMeta = useLocalTransactionMeta(item.hash);
  const { metamaskPay } = transactionMeta ?? {};
  const { bridgeFeeFiat, networkFeeFiat, totalFiat } = metamaskPay || {};

  const isDeposit = item.type === 'moneyAccountDeposit';

  const formatFiat = (value?: string) =>
    value
      ? formatCurrencyWithMinThreshold(
          Number(value),
          MONEY_ACCOUNT_FIAT_CURRENCY,
        )
      : null;

  const formattedAmount = formatFiat(item.data.fiat?.amount);
  const amountSign = isDeposit ? '+' : '-';
  const signedAmount = formattedAmount
    ? `${amountSign}${formattedAmount}`
    : null;

  return (
    <MmPayDetailsLayout
      avatarTokens={[item.data.token?.assetId]}
      footer={
        isDeposit &&
        hasMoneyAccount &&
        transactionMeta?.status === TransactionMetaStatus.confirmed ? (
          <Button
            className="w-full"
            size={ButtonSize.Lg}
            variant={ButtonVariant.Primary}
            isLoading={isDepositLoading}
            onClick={() => initiateDeposit()}
          >
            {t('addFunds')}
          </Button>
        ) : (
          <BlockExplorerButton chainId={item.chainId} txHash={item.hash} />
        )
      }
      formatFiat={formatFiat}
      heroAmount={signedAmount}
      heroTextColor={isDeposit ? 'text-success-default' : 'text-default'}
      item={item}
      metamaskPay={{ bridgeFeeFiat, networkFeeFiat, totalFiat }}
      transactionMeta={transactionMeta}
    />
  );
}
