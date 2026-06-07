import React from 'react';
import type {
  ActivityFee,
  ActivityListItem,
} from '../../../../shared/lib/activity/types';
import { formatUnits } from '../../../../shared/lib/unit';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { Row, Section } from './shared';

const maximumFractionDigits = 8;

function getFeeLabel(fee: ActivityFee, t: ReturnType<typeof useI18nContext>) {
  if (fee.type === 'base') {
    return t('networkFee');
  }

  if (fee.type === 'priority') {
    return t('priorityFee');
  }

  return fee.type;
}

export function AmountsSection({ item }: { item: ActivityListItem }) {
  const t = useI18nContext();
  const { formatToken } = useFormatters();

  if (item.type !== 'send' && item.type !== 'receive') {
    return null;
  }

  const visibleFees = item.data.fees?.filter((fee) => fee.amount) ?? [];
  const token = item.data.token;
  let tokenValue;

  if (token?.amount) {
    let amount = token.amount;

    try {
      amount = formatUnits(BigInt(token.amount), token.decimals ?? 0);
    } catch {
      amount = token.amount;
    }

    tokenValue = token.symbol
      ? formatToken(amount as `${number}`, token.symbol, {
          maximumFractionDigits,
        })
      : amount;
  }

  if (!visibleFees.length && !tokenValue) {
    return null;
  }

  return (
    <Section>
      {visibleFees.map((fee, index) => {
        let amount = fee.amount;

        try {
          amount = formatUnits(BigInt(fee.amount ?? 0), fee.decimals ?? 0);
        } catch {
          amount = fee.amount;
        }
        return (
          <Row
            key={`${fee.type}-${fee.assetId ?? fee.symbol ?? index}`}
            label={getFeeLabel(fee, t)}
            value={
              fee.symbol
                ? formatToken(amount as `${number}`, fee.symbol, {
                    maximumFractionDigits,
                  })
                : amount
            }
          />
        );
      })}
      {tokenValue ? <Row label={t('amount')} value={tokenValue} /> : null}
    </Section>
  );
}
