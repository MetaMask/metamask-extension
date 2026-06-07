import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { formatUnits } from '../../../../shared/lib/unit';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { Row, Section } from './shared';

const maximumFractionDigits = 8;

export function AmountsSection({ item }: { item: ActivityListItem }) {
  const t = useI18nContext();
  const { formatToken } = useFormatters();
  const visibleFees =
    'fees' in item.data
      ? (item.data.fees?.filter((fee) => fee.amount) ?? [])
      : [];
  const token =
    item.type === 'send' || item.type === 'receive'
      ? item.data.token
      : 'sourceToken' in item.data
        ? item.data.sourceToken
        : undefined;
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
        let label = fee.type;
        let amount = fee.amount;

        if (fee.type === 'base') {
          label = t('networkFee');
        } else if (fee.type === 'priority') {
          label = t('priorityFee');
        }

        try {
          amount = formatUnits(BigInt(fee.amount ?? 0), fee.decimals ?? 0);
        } catch {
          amount = fee.amount;
        }
        return (
          <Row
            key={`${fee.type}-${fee.assetId ?? fee.symbol ?? index}`}
            label={label}
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
