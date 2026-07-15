import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import type {
  ActivityListItem,
  TokenAmount,
} from '../../../../shared/lib/activity/types';
import { toAssetId } from '../../../../shared/lib/asset-utils';
import { isValidTransactionHash } from '../../../../shared/lib/transactions.utils';
import { AccountName } from '../../../components/app/transaction/account-name';
import { NetworkName } from '../../../components/app/transaction/network-name';
import { TransactionId } from '../../../components/app/transaction/transaction-id';
import { TransactionStatus } from '../../../components/app/transaction/transaction-status';
import { selectPerpsWithdrawMetamaskPayByHash } from '../../../selectors/metamask-pay';
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

export function PerpsDetails({
  item,
}: {
  item: Extract<ActivityListItem, { type: 'perpsAddFunds' | 'perpsWithdraw' }>;
}) {
  const t = useI18nContext();
  const { formatDateTime, formatCurrencyWithMinThreshold } = useFormatters();
  const metamaskPayByHash = useSelector(selectPerpsWithdrawMetamaskPayByHash);
  const metamaskPay = metamaskPayByHash.get(item.hash?.toLowerCase() || '');
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

  const payFeeAmount = Number(networkFeeFiat ?? 0) + Number(bridgeFeeFiat ?? 0);
  const formattedTransactionFee =
    payFeeAmount > 0
      ? formatCurrencyWithMinThreshold(payFeeAmount, PERPS_CURRENCY)
      : undefined;

  const { chainId } = item;
  const detailsHash = item.hash && item.hash !== '0x0' ? item.hash : undefined;
  const txId =
    detailsHash &&
    (!chainId.startsWith('eip155:') || isValidTransactionHash(detailsHash))
      ? detailsHash
      : undefined;

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
          <Row
            label={t('transactionIdLabel')}
            value={txId ? <TransactionId value={txId} /> : null}
          />
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
        <BlockExplorerButton chainId={chainId} txHash={detailsHash} />
      </Footer>
    </div>
  );
}
