import React from 'react';
import type {
  ActivityFee,
  ActivityListItem,
  Status,
  TokenAmount,
} from '../../../../shared/lib/activity/types';
import { formatUnits } from '../../../../shared/lib/unit';
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

function getFeeLabel(fee: ActivityFee, t: ReturnType<typeof useI18nContext>) {
  if (fee.type === 'base') {
    return t('networkFee');
  }

  if (fee.type === 'priority') {
    return t('priorityFee');
  }

  return fee.type;
}

function getFeeValue(
  fee: ActivityFee,
  formatTokenAmount: ReturnType<typeof useFormatters>['formatTokenAmount'],
) {
  if (!fee.amount) {
    return '-';
  }

  let amount = fee.amount;

  try {
    amount = formatUnits(BigInt(fee.amount), fee.decimals ?? 0);
  } catch {
    amount = fee.amount;
  }

  return formatTokenAmount(amount as `${number}`, fee.symbol ?? '');
}

export function AmountsSection({ fees }: { fees?: ActivityFee[] }) {
  const t = useI18nContext();
  const { formatTokenAmount } = useFormatters();
  const visibleFees = fees?.filter((fee) => fee.amount) ?? [];

  if (!visibleFees.length) {
    return null;
  }

  return (
    <Section>
      {visibleFees.map((fee, index) => (
        <Row
          key={`${fee.type}-${fee.assetId ?? fee.symbol ?? index}`}
          label={getFeeLabel(fee, t)}
          value={getFeeValue(fee, formatTokenAmount)}
        />
      ))}
    </Section>
  );
}
