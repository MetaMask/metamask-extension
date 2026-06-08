import React from 'react';
import type {
  ActivityListItem,
  Status,
  TokenAmount,
} from '../../../../shared/lib/activity/types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { AccountName } from '../components/account-name';
import { NetworkName } from '../components/network-name';
import { Row, Section } from '../components/shared';
import { TokenAmountRow } from '../components/token-amount-row';

function getStatusValue(status: Status) {
  if (status === 'success') {
    return <span className="text-success-default">Confirmed</span>;
  }

  return status;
}

export function TokensSection({
  tokens,
}: {
  tokens: { label: string; token?: TokenAmount }[];
}) {
  const visibleTokens = tokens.flatMap(({ label, token }) =>
    token ? [{ label, token }] : [],
  );

  if (!visibleTokens.length) {
    return null;
  }

  return (
    <Section>
      {visibleTokens.map(({ label, token }) => (
        <div key={label}>
          <p className="text-alternative">{label}</p>
          <TokenAmountRow token={token} />
        </div>
      ))}
    </Section>
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
  const showAddressRows = Boolean(addressRows?.from || addressRows?.to);

  return (
    <Section>
      <Row label={t('status')} value={getStatusValue(item.status)} />
      <Row label={t('date')} value={formatDateTime(item.timestamp)} />
      {showAddressRows ? (
        <>
          <Row
            label={t('from')}
            value={
              addressRows?.from ? (
                <AccountName address={addressRows.from} />
              ) : undefined
            }
          />
          <Row
            label={t('to')}
            value={
              addressRows?.to ? (
                <AccountName address={addressRows.to} />
              ) : undefined
            }
          />
        </>
      ) : (
        <Row
          label={t('account')}
          value={
            accountAddress ? (
              <AccountName address={accountAddress} />
            ) : undefined
          }
        />
      )}
      <Row
        label={t('network')}
        value={<NetworkName chainId={item.chainId} />}
      />
    </Section>
  );
}
