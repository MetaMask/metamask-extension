import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
} from '@metamask/design-system-react';
import { TransactionStatus as TransactionMetaStatus } from '@metamask/transaction-controller';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { BRIDGE_CHAINID_COMMON_TOKEN_PAIR } from '../../../../shared/constants/bridge';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { ActivityAvatar } from '../../../components/app/activity-list-item-avatar';
import { selectLocalTransactionsByHash } from '../../../selectors/activity';
// eslint-disable-next-line import-x/no-restricted-paths
import { TransactionDetailsProvider } from '../../confirmations/components/activity/transaction-details-context';
import { TransactionDetailsSummary } from '../../confirmations/components/activity/transaction-details-summary/transaction-details-summary';
import { PERPS_CURRENCY } from '../../confirmations/constants/perps';
import { Footer, Row, Section } from '../components/shared';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { TransactionStatus } from '../../../components/app/transaction/transaction-status';
import { useFormatters } from '../../../hooks/useFormatters';

const HYPE_USDC =
  BRIDGE_CHAINID_COMMON_TOKEN_PAIR[toEvmCaipChainId(CHAIN_IDS.HYPE)];

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

export function PerpsDepositDetails({ item }: Props) {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { formatDateTime, formatCurrencyWithMinThreshold } = useFormatters();
  const transactionMeta = useTransactionMeta(item.hash);

  if (!transactionMeta) {
    return null;
  }

  const { metamaskPay } = transactionMeta;
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
        {formattedTargetFiat && HYPE_USDC?.assetId ? (
          <div
            className="flex items-center gap-2 pb-4"
            data-testid="transaction-details-hero"
          >
            <ActivityAvatar tokens={[HYPE_USDC.assetId]} />
            <Text variant="heading-lg" color="text-success-default">
              +{formattedTargetFiat}
            </Text>
          </div>
        ) : null}

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
              label={t('bridgeFee')}
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

        <TransactionDetailsProvider transactionMeta={transactionMeta}>
          <Section>
            <TransactionDetailsSummary />
          </Section>
        </TransactionDetailsProvider>
      </div>

      <Footer>
        {transactionMeta.status === TransactionMetaStatus.confirmed && (
          <Button
            className="w-full"
            size={ButtonSize.Lg}
            variant={ButtonVariant.Primary}
            onClick={() => navigate({ pathname: '/', search: 'tab=perps' })}
          >
            {t('perpsFundAgain')}
          </Button>
        )}
      </Footer>
    </div>
  );
}
