import React from 'react';
import type {
  ActivityListItem,
  Status,
  TokenAmount,
} from '../../../../shared/lib/activity/types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { NetworkName } from './network-name';
import { Row, Section } from './shared';
import { TokenAmountRow } from './token-amount-row';

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

export function MetadataSection({ item }: { item: ActivityListItem }) {
  const t = useI18nContext();
  const { formatDateTime } = useFormatters();

  return (
    <Section>
      <Row label={t('status')} value={getStatusValue(item.status)} />
      <Row label={t('date')} value={formatDateTime(item.timestamp)} />

      {/* todo: this part is dynamic */}

      <Row
        label={t('network')}
        value={<NetworkName chainId={item.chainId} />}
      />
    </Section>
  );
}
