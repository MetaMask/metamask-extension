import React from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
} from '@metamask/design-system-react';
import { TransactionStatus as TransactionMetaStatus } from '@metamask/transaction-controller';
import type { MoneyAccountActivityItem } from '../../../../shared/lib/activity/types';
import { ActivityAvatar } from '../../../components/app/activity-list-item-avatar';
import { TransactionStatus } from '../../../components/app/transaction/transaction-status';
import { useLocalTransactionMeta } from '../../../hooks/activity/useLocalTransactionMeta';
import { useMoneyAccountDeposit } from '../../../hooks/money/useMoneyAccountDeposit';
import { useMoneyAccountInfo } from '../../../hooks/money/useMoneyAccountInfo';
import { useFormatters } from '../../../hooks/useFormatters';
import { useI18nContext } from '../../../hooks/useI18nContext';
// eslint-disable-next-line import-x/no-restricted-paths
import { TransactionDetailsProvider } from '../../confirmations/components/activity/transaction-details-context';
// eslint-disable-next-line import-x/no-restricted-paths
import { TransactionDetailsSummary } from '../../confirmations/components/activity/transaction-details-summary';
import { BlockExplorerButton } from '../components/block-explorer-button';
import { Footer, Row, Section } from '../components/shared';

// mUSD is pegged 1:1 to USD, so money-account details show USD like perps.
const MONEY_ACCOUNT_FIAT_CURRENCY = 'usd';

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
  const { formatDateTime, formatCurrencyWithMinThreshold } = useFormatters();
  const { hasMoneyAccount } = useMoneyAccountInfo();
  const { initiateDeposit, isLoading: isDepositLoading } =
    useMoneyAccountDeposit();
  const transactionMeta = useLocalTransactionMeta(item.hash);
  const { metamaskPay } = transactionMeta ?? {};
  const { networkFeeFiat, bridgeFeeFiat, totalFiat } = metamaskPay || {};

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
  const hasFees = Boolean(networkFeeFiat || bridgeFeeFiat || totalFiat);

  return (
    <div className="flex grow flex-col">
      <div className="divide-y divide-border-muted">
        <div
          className="flex items-center gap-2 pb-4"
          data-testid="transaction-details-hero"
        >
          <ActivityAvatar tokens={[item.data.token?.assetId]} />
          <Text
            variant="heading-lg"
            color={isDeposit ? 'text-success-default' : 'text-default'}
          >
            {signedAmount}
          </Text>
        </div>

        <Section>
          <Row
            label={t('status')}
            value={<TransactionStatus status={item.status} hash={item.hash} />}
          />

          <Row label={t('date')} value={formatDateTime(item.timestamp)} />
        </Section>

        {hasFees ? (
          <Section>
            <Row
              label={t('networkFee')}
              testId="transaction-base-fee"
              value={formatFiat(networkFeeFiat)}
            />
            {bridgeFeeFiat ? (
              <Row
                label={t('providerFee')}
                testId="transaction-bridge-fee"
                value={formatFiat(bridgeFeeFiat)}
              />
            ) : null}
            <Row
              label={t('total')}
              testId="transaction-breakdown-value-amount"
              value={formatFiat(totalFiat)}
            />
          </Section>
        ) : null}

        {transactionMeta ? (
          <Section>
            <TransactionDetailsProvider transactionMeta={transactionMeta}>
              <TransactionDetailsSummary />
            </TransactionDetailsProvider>
          </Section>
        ) : null}
      </div>

      <Footer>
        {isDeposit &&
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
        )}
      </Footer>
    </div>
  );
}
