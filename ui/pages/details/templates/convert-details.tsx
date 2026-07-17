import React, { useMemo } from 'react';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import type {
  ActivityListItem,
  TokenAmount,
} from '../../../../shared/lib/activity/types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { useTransactionMeta } from '../../../hooks/activity/useTransactionMeta';
import { useTransactionQuery } from '../../../hooks/activity/useTransactionQuery';
import { Footer, PAY_FIAT_CURRENCY, Row, Section } from '../components/shared';
import { ConvertAgainButton } from '../components/convert-again-button';
import { MetadataSection, TokensSection } from '../components/sections';
// eslint-disable-next-line import-x/no-restricted-paths
import { TransactionDetailsProvider } from '../../confirmations/components/activity/transaction-details-context';
// eslint-disable-next-line import-x/no-restricted-paths
import { TransactionDetailsSummary } from '../../confirmations/components/activity/transaction-details-summary';

function useSentToken(
  baseToken: TokenAmount | undefined,
  transactionMeta: ReturnType<typeof useTransactionMeta>,
): TokenAmount | undefined {
  const { sourceHash, tokenAddress, chainId } =
    transactionMeta?.metamaskPay ?? {};
  const sourceChainId = chainId ? toEvmCaipChainId(chainId) : undefined;
  const userAddress = transactionMeta?.txParams?.from?.toLowerCase();

  const { data: sourceTransaction } = useTransactionQuery({
    chainId: sourceChainId,
    txHash: sourceHash,
    enabled: Boolean(sourceHash && sourceChainId),
  });

  return useMemo(() => {
    if (!baseToken) {
      return baseToken;
    }
    const transfers = sourceTransaction?.valueTransfers ?? [];
    const payToken = tokenAddress?.toLowerCase();
    const sentTransfer =
      transfers.find(
        (transfer) =>
          transfer.contractAddress.toLowerCase() === payToken &&
          transfer.from.toLowerCase() === userAddress,
      ) ??
      transfers.find(
        (transfer) => transfer.contractAddress.toLowerCase() === payToken,
      );
    return sentTransfer?.amount
      ? { ...baseToken, amount: sentTransfer.amount }
      : baseToken;
  }, [baseToken, sourceTransaction, tokenAddress, userAddress]);
}

export function ConvertDetails({
  item,
}: {
  // The swap/convert/lending/wrap family share a single ActivityData member
  // with a union discriminant, so it can't be narrowed to `type: 'convert'`
  // alone; the template-loader routes only convert items here at runtime.
  item: Extract<
    ActivityListItem,
    {
      type:
        | 'swap'
        | 'bridge'
        | 'convert'
        | 'lendingDeposit'
        | 'lendingWithdrawal'
        | 'wrap'
        | 'unwrap';
    }
  >;
}) {
  const t = useI18nContext();
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const transactionMeta = useTransactionMeta(item.hash);
  const { networkFeeFiat, totalFiat } = transactionMeta?.metamaskPay ?? {};
  const sentToken = useSentToken(item.data.sourceToken, transactionMeta);

  const formatFiat = (value?: string) =>
    value
      ? formatCurrencyWithMinThreshold(Number(value), PAY_FIAT_CURRENCY)
      : null;

  if (!transactionMeta) {
    return null;
  }

  return (
    <div className="flex grow flex-col">
      <div className="divide-y divide-border-muted">
        <TokensSection
          tokens={[
            { label: t('youSent'), token: sentToken },
            { label: t('youReceived'), token: item.data.destinationToken },
          ]}
        />

        <MetadataSection item={item} />

        <Section>
          <Row
            label={t('networkFee')}
            testId="transaction-base-fee"
            value={formatFiat(networkFeeFiat)}
          />
          <Row
            label={t('total')}
            testId="transaction-breakdown-value-amount"
            value={formatFiat(totalFiat)}
          />
        </Section>

        <Section>
          <TransactionDetailsProvider transactionMeta={transactionMeta}>
            <TransactionDetailsSummary />
          </TransactionDetailsProvider>
        </Section>
      </div>

      <Footer>
        <ConvertAgainButton sourceToken={item.data.sourceToken} />
      </Footer>
    </div>
  );
}
