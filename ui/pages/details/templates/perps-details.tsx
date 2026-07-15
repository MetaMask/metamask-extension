import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import type {
  ActivityListItem,
  TokenAmount,
} from '../../../../shared/lib/activity/types';
import { toAssetId } from '../../../../shared/lib/asset-utils';
import { AccountName } from '../../../components/app/transaction/account-name';
import { NetworkName } from '../../../components/app/transaction/network-name';
import { TransactionStatus } from '../../../components/app/transaction/transaction-status';
import { selectLocalTransactionsByHash } from '../../../selectors/activity';
import {
  ARBITRUM_USDC,
  PERPS_CURRENCY,
  // eslint-disable-next-line import-x/no-restricted-paths
} from '../../confirmations/constants/perps';
import { BlockExplorerButton } from '../components/block-explorer-button';
import { Footer, Row, Section } from '../components/shared';
import { TokensSection } from '../components/sections';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { useDestinationToken } from './helpers';

const ARBITRUM_USDC_ASSET_ID = toAssetId(
  ARBITRUM_USDC.address,
  toEvmCaipChainId(ARBITRUM_USDC.chainId),
);

function useTransactionMeta(hash: string | undefined) {
  const localTransactions = useSelector(selectLocalTransactionsByHash);
  return localTransactions.get(hash || '')?.initialTransaction;
}

export function PerpsDetails({
  item,
}: {
  item: Extract<ActivityListItem, { type: 'perpsAddFunds' | 'perpsWithdraw' }>;
}) {
  const t = useI18nContext();
  const { formatDateTime, formatCurrencyWithMinThreshold } = useFormatters();
  const transactionMeta = useTransactionMeta(item.hash);
  const { metamaskPay } = transactionMeta || {};
  const { totalFiat, networkFeeFiat, bridgeFeeFiat } = metamaskPay || {};

  const withdrewToken = useMemo((): TokenAmount | undefined => {
    if (!totalFiat) {
      return undefined;
    }

    const amount =
      Number(totalFiat) -
      Number(bridgeFeeFiat ?? 0) -
      Number(networkFeeFiat ?? 0);

    return {
      assetId: ARBITRUM_USDC_ASSET_ID,
      amount: String(amount),
      decimals: ARBITRUM_USDC.decimals,
      symbol: ARBITRUM_USDC.symbol,
      direction: 'out',
    };
  }, [totalFiat, bridgeFeeFiat, networkFeeFiat]);
  const receivedToken = useDestinationToken(metamaskPay);

  const formattedTransactionFee = formatCurrencyWithMinThreshold(
    Number(networkFeeFiat ?? 0) + Number(bridgeFeeFiat ?? 0),
    PERPS_CURRENCY,
  );

  const chainId =
    metamaskPay?.isPostQuote && metamaskPay.chainId
      ? toEvmCaipChainId(metamaskPay.chainId)
      : item.chainId;

  const blockExplorerHash = item.hash === '0x0' ? undefined : item.hash;

  return (
    <div className="flex grow flex-col">
      <div className="divide-y divide-border-muted">
        <TokensSection
          tokens={[
            { label: t('youWithdrew'), token: withdrewToken },
            { label: t('youReceived'), token: receivedToken },
          ]}
          showBadge
        />

        <Section>
          <Row
            label={t('status')}
            value={<TransactionStatus status={item.status} />}
          />
          <Row label={t('date')} value={formatDateTime(item.timestamp)} />
          <Row
            label={t('account')}
            value={<AccountName address={item.data.from} />}
          />
          <Row label={t('network')} value={<NetworkName chainId={chainId} />} />
        </Section>

        {formattedTransactionFee ? (
          <Section>
            <Row
              label={t('transactionFee')}
              testId="transaction-base-fee"
              value={formattedTransactionFee}
            />
          </Section>
        ) : null}
      </div>

      <Footer>
        <BlockExplorerButton chainId={chainId} txHash={blockExplorerHash} />
      </Footer>
    </div>
  );
}
