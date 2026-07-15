import React from 'react';
import { useSelector } from 'react-redux';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
} from '@metamask/design-system-react';
import { TransactionStatus as TransactionMetaStatus } from '@metamask/transaction-controller';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { ActivityAvatar } from '../../../components/app/activity-list-item-avatar';
import { usePerpsDepositConfirmation } from '../../../components/app/perps/hooks/usePerpsDepositConfirmation';
import { selectLocalTransactionsByHash } from '../../../selectors/activity';
// eslint-disable-next-line import-x/no-restricted-paths
import { TransactionDetailsProvider } from '../../confirmations/components/activity/transaction-details-context';
// eslint-disable-next-line import-x/no-restricted-paths
import { TransactionDetailsSummary } from '../../confirmations/components/activity/transaction-details-summary';
import {
  ARBITRUM_USDC,
  PERPS_CURRENCY,
  // eslint-disable-next-line import-x/no-restricted-paths
} from '../../confirmations/constants/perps';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { TransactionStatus } from '../../../components/app/transaction/transaction-status';
import { useFormatters } from '../../../hooks/useFormatters';
import { Footer, Row, Section } from '../components/shared';

const PERPS_USDC_ASSET_ID = `${toEvmCaipChainId(CHAIN_IDS.ARBITRUM)}/erc20:${ARBITRUM_USDC.address}`;

type Props = {
  item: Extract<
    ActivityListItem,
    { type: 'perpsAddFunds' } | { type: 'perpsWithdraw' }
  >;
};

function useTransactionMeta(hash: string | undefined) {
  const localTransactions = useSelector(selectLocalTransactionsByHash);
  return localTransactions.get(hash || '')?.initialTransaction;
}

export function PerpsDepositDetails({ item }: Readonly<Props>) {
  const t = useI18nContext();
  const { trigger: triggerDeposit } = usePerpsDepositConfirmation();
  const { formatDateTime, formatCurrencyWithMinThreshold } = useFormatters();
  const transactionMeta = useTransactionMeta(item.hash);
  const { metamaskPay } = transactionMeta ?? {};
  const { targetFiat, networkFeeFiat, bridgeFeeFiat, totalFiat } =
    metamaskPay || {};

  const formatFiat = (value?: string) =>
    value
      ? formatCurrencyWithMinThreshold(Number(value), PERPS_CURRENCY)
      : null;

  const formattedTargetFiat = formatFiat(targetFiat);

  return (
    <div className="flex grow flex-col">
      <div className="divide-y divide-border-muted">
        <div
          className="flex items-center gap-2 pb-4"
          data-testid="transaction-details-hero"
        >
          <ActivityAvatar tokens={[PERPS_USDC_ASSET_ID]} />
          <Text variant="heading-lg" color="text-success-default">
            {formattedTargetFiat ? `+${formattedTargetFiat}` : null}
          </Text>
        </div>

        <Section>
          <Row
            label={t('status')}
            value={<TransactionStatus status={item.status} />}
          />

          <Row label={t('date')} value={formatDateTime(item.timestamp)} />
        </Section>

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

        {transactionMeta ? (
          <Section>
            <TransactionDetailsProvider transactionMeta={transactionMeta}>
              <TransactionDetailsSummary />
            </TransactionDetailsProvider>
          </Section>
        ) : null}
      </div>

      <Footer>
        {transactionMeta?.status === TransactionMetaStatus.confirmed && (
          <Button
            className="w-full"
            size={ButtonSize.Lg}
            variant={ButtonVariant.Primary}
            onClick={() => triggerDeposit()}
          >
            {t('perpsFundAgain')}
          </Button>
        )}
      </Footer>
    </div>
  );
}
