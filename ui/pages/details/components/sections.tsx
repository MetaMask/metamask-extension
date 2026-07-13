import React from 'react';
import type {
  ActivityListItem,
  TokenAmount,
} from '../../../../shared/lib/activity/types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { NetworkName } from '../../../components/app/transaction/network-name';
import { TransactionStatus } from '../../../components/app/transaction/transaction-status';
import { AccountName } from '../../../components/app/transaction/account-name';
import { TransactionId } from '../../../components/app/transaction/transaction-id';
import { isValidTransactionHash } from '../../../../shared/lib/transactions.utils';
import { Row, Section } from './shared';
import { TokenRow } from './token-row';

export function TokensSection({
  tokens,
  showBadge,
}: {
  tokens: { label?: string; token?: TokenAmount }[];
  showBadge?: boolean;
}) {
  const visibleTokens = tokens.flatMap(({ label, token }) =>
    token ? [{ label, token }] : [],
  );

  if (!visibleTokens.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 pb-4">
      {visibleTokens.map(({ label, token }) => (
        <div key={token?.assetId}>
          {label && <p className="text-alternative mb-1">{label}</p>}
          <TokenRow token={token} showNetworkBadge={showBadge} />
        </div>
      ))}
    </div>
  );
}

export function MetadataSection({
  item,
  addressRows,
}: {
  item: ActivityListItem;
  addressRows?: { from?: string; to?: string };
}) {
  const t = useI18nContext();
  const { formatDateTime } = useFormatters();
  const accountAddress = item.data.from;
  const showAddressRows = Boolean(addressRows?.from && addressRows?.to);
  const txId =
    item.hash &&
    (!item.chainId.startsWith('eip155:') || isValidTransactionHash(item.hash))
      ? item.hash
      : undefined;

  return (
    <Section>
      <Row
        label={t('status')}
        value={<TransactionStatus status={item.status} />}
      />

      <Row label={t('date')} value={formatDateTime(item.timestamp)} />

      {showAddressRows ? (
        <>
          <Row
            label={t('from')}
            value={<AccountName address={addressRows?.from} />}
          />
          <Row
            label={t('to')}
            value={<AccountName address={addressRows?.to} />}
          />
        </>
      ) : (
        <Row
          label={t('account')}
          value={<AccountName address={accountAddress} />}
        />
      )}

      <Row
        label={t('network')}
        value={<NetworkName chainId={item.chainId} />}
      />

      <Row
        label={t('transactionIdLabel')}
        value={txId ? <TransactionId value={txId} /> : null}
      />
    </Section>
  );
}
