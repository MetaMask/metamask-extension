import React, { useMemo } from 'react';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type {
  ActivityListItem,
  TokenAmount,
} from '../../../../shared/lib/activity/types';
import { parseValueTransfers } from '../../../../shared/lib/activity/adapters/helpers';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { useApiTransaction } from '../../../hooks/activity/useApiTransaction';
import { useLocalTransactionMeta } from '../../../hooks/activity/useLocalTransactionMeta';
import { Footer, Row, Section } from '../components/shared';
import { ConvertAgainButton } from '../components/convert-again-button';
import { MetadataSection, TokensSection } from '../components/sections';
// eslint-disable-next-line import-x/no-restricted-paths
import { TransactionDetailsProvider } from '../../confirmations/components/activity/transaction-details-context';
// eslint-disable-next-line import-x/no-restricted-paths
import { TransactionDetailsSummary } from '../../confirmations/components/activity/transaction-details-summary';

// Fiat currency for `metamaskPay` is always USD
const metamaskPayCurrency = 'usd';

function useSentToken(
  baseToken: TokenAmount | undefined,
  transactionMeta: TransactionMeta | undefined,
) {
  const { sourceHash, chainId } = transactionMeta?.metamaskPay ?? {};
  const sourceChainId = chainId ? toEvmCaipChainId(chainId) : undefined;
  const userAddress = transactionMeta?.txParams?.from?.toLowerCase();

  const sourceTransaction = useApiTransaction({
    chainId: sourceChainId,
    txHash: sourceHash,
  });

  return useMemo(() => {
    if (!baseToken) {
      return baseToken;
    }
    const { sentTransfer } = parseValueTransfers(
      sourceTransaction?.valueTransfers,
      userAddress ?? '',
    );
    return sentTransfer?.amount
      ? { ...baseToken, amount: sentTransfer.amount }
      : baseToken;
  }, [baseToken, sourceTransaction, userAddress]);
}

type Props = {
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
};

export function ConvertDetails({ item }: Props) {
  const t = useI18nContext();
  const { formatCurrencyWithMinThreshold: format } = useFormatters();
  const transactionMeta = useLocalTransactionMeta(item.hash);
  const { networkFeeFiat, totalFiat } = transactionMeta?.metamaskPay ?? {};
  const sentToken = useSentToken(item.data.sourceToken, transactionMeta);

  const formatFiat = (value?: string) =>
    value ? format(Number(value), metamaskPayCurrency) : null;

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
