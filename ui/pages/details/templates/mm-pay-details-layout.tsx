import React, { type ReactNode } from 'react';
import { Text } from '@metamask/design-system-react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Status } from '../../../../shared/lib/activity/types';
import { ActivityAvatar } from '../../../components/app/activity-list-item-avatar';
import { TransactionStatus } from '../../../components/app/transaction/transaction-status';
import { useFormatters } from '../../../hooks/useFormatters';
import { useI18nContext } from '../../../hooks/useI18nContext';
// eslint-disable-next-line import-x/no-restricted-paths
import { TransactionDetailsProvider } from '../../confirmations/components/activity/transaction-details-context';
// eslint-disable-next-line import-x/no-restricted-paths
import { TransactionDetailsSummary } from '../../confirmations/components/activity/transaction-details-summary';
import { Footer, Row, Section } from '../components/shared';

type MmPayFeeFields = {
  bridgeFeeFiat?: string;
  networkFeeFiat?: string;
  totalFiat?: string;
};

type MmPayDetailsLayoutProps = {
  avatarTokens: (string | undefined)[];
  /**
   * When true, always render the fee section (even if fee values are empty),
   * matching the existing perps details behavior.
   */
  feeSectionAlwaysVisible?: boolean;
  footer: ReactNode;
  formatFiat: (value?: string) => string | null;
  heroAmount: ReactNode;
  heroTextColor?: 'text-default' | 'text-success-default';
  item: {
    hash?: string;
    status: Status;
    timestamp: number;
  };
  metamaskPay?: MmPayFeeFields | null;
  transactionMeta?: TransactionMeta;
};

/**
 * Shared MM Pay activity-details layout used by perps and money-account
 * templates: fiat hero, status/date, fee breakdown, and transaction summary.
 *
 * @param props - Layout props.
 * @param props.avatarTokens
 * @param props.feeSectionAlwaysVisible
 * @param props.footer
 * @param props.formatFiat
 * @param props.heroAmount
 * @param props.heroTextColor
 * @param props.item
 * @param props.metamaskPay
 * @param props.transactionMeta
 * @returns The shared details scaffold.
 */
export function MmPayDetailsLayout({
  avatarTokens,
  feeSectionAlwaysVisible = false,
  footer,
  formatFiat,
  heroAmount,
  heroTextColor = 'text-success-default',
  item,
  metamaskPay,
  transactionMeta,
}: Readonly<MmPayDetailsLayoutProps>) {
  const t = useI18nContext();
  const { formatDateTime } = useFormatters();
  const { bridgeFeeFiat, networkFeeFiat, totalFiat } = metamaskPay || {};
  const hasFees = Boolean(bridgeFeeFiat || networkFeeFiat || totalFiat);
  const showFees = feeSectionAlwaysVisible || hasFees;

  return (
    <div className="flex grow flex-col">
      <div className="divide-y divide-border-muted">
        <div
          className="flex items-center gap-2 pb-4"
          data-testid="transaction-details-hero"
        >
          <ActivityAvatar tokens={avatarTokens} />
          <Text variant="heading-lg" color={heroTextColor}>
            {heroAmount}
          </Text>
        </div>

        <Section>
          <Row
            label={t('status')}
            value={<TransactionStatus status={item.status} hash={item.hash} />}
          />

          <Row label={t('date')} value={formatDateTime(item.timestamp)} />
        </Section>

        {showFees ? (
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

      <Footer>{footer}</Footer>
    </div>
  );
}
