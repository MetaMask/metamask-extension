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
  let token;

  if (item.type === 'send' || item.type === 'receive') {
    token = item.data.token;
  } else if ('sourceToken' in item.data) {
    token = item.data.sourceToken;
  }

  let tokenValue;

  if (token?.amount) {
    const { amount: tokenAmount, decimals, symbol } = token;
    let amount = tokenAmount;

    try {
      amount = formatUnits(BigInt(tokenAmount), decimals ?? 0);
    } catch {
      amount = tokenAmount;
    }

    tokenValue = symbol
      ? formatToken(amount as `${number}`, symbol, {
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
        const { amount: feeAmount, assetId, decimals, symbol, type } = fee;
        let label = type;
        let amount = feeAmount;

        if (type === 'base') {
          label = t('networkFee');
        } else if (type === 'priority') {
          label = t('priorityFee');
        }

        try {
          amount = formatUnits(BigInt(feeAmount ?? 0), decimals ?? 0);
        } catch {
          amount = feeAmount;
        }
        return (
          <Row
            key={`${type}-${assetId ?? symbol ?? index}`}
            label={label}
            value={
              symbol
                ? formatToken(amount as `${number}`, symbol, {
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
