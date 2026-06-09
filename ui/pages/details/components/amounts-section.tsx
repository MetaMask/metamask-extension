import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { formatUnits } from '../../../../shared/lib/unit';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { TokenFiatValue } from '../../../components/app/transaction/token-fiat-value';
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

  if (!visibleFees.length && !token?.amount) {
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
            testId={type === 'base' ? 'transaction-base-fee' : undefined}
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
      {token?.amount ? (
        <Row label={t('amount')} value={<TokenFiatValue token={token} />} />
      ) : null}
    </Section>
  );
}
