import React from 'react';
import type {
  ActivityListItem,
  TokenAmount,
} from '../../../../shared/lib/activity/types';
import { formatUnits } from '../../../../shared/lib/unit';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { TokenFiatValue } from '../../../components/app/transaction/token-fiat-value';
import { Row } from './shared';

const maximumFractionDigits = 8;

export function FeesRows({ item }: { item: ActivityListItem }) {
  const t = useI18nContext();
  const { formatToken } = useFormatters();
  const visibleFees =
    'fees' in item.data
      ? (item.data.fees?.filter((fee) => fee.amount) ?? [])
      : [];

  if (!visibleFees.length) {
    return null;
  }

  return (
    <>
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
    </>
  );
}

export function TotalAmountRow({ token }: { token: TokenAmount | undefined }) {
  const t = useI18nContext();

  if (!token?.amount) {
    return null;
  }

  return (
    <Row
      label={t('totalAmount')}
      testId="transaction-breakdown-value-amount"
      value={<TokenFiatValue token={token} />}
    />
  );
}
