import React from 'react';
import type {
  ActivityListItem,
  TokenAmount,
} from '../../../../shared/lib/activity/types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { NetworkName } from '../../../components/app/transaction/network-name';
import { Row, Section } from '../components/shared';
import { TokenAmountRow } from '../components/token-amount-row';
import { TransactionStatusLabel } from '../../../components/app/transaction/transaction-status-label';
import { AccountName } from '../../../components/app/transaction/account-name';

export function TokensSection({
  tokens,
}: {
  tokens: { label?: string; token?: TokenAmount }[];
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
          <TokenAmountRow token={token} />
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

  return (
    <Section>
      <Row
        label={t('status')}
        value={<TransactionStatusLabel status={item.status} />}
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
    </Section>
  );
}
