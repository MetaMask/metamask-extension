import React from 'react';
import type {
  ActivityListItem,
  FiatAmount,
  TokenAmount,
} from '../../../../shared/lib/activity/types';
import { formatUnits } from '../../../../shared/lib/unit';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { TokenFiatValue } from '../../../components/app/transaction/token-fiat-value';
// eslint-disable-next-line import-x/no-restricted-paths
import { PERPS_CURRENCY } from '../../confirmations/constants/perps';
import { Row } from './shared';

const maximumFractionDigits = 8;

function getFiatValue(fiat?: FiatAmount) {
  return typeof fiat?.amount === 'string' ? Number(fiat.amount) : undefined;
}

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

export function PerpsFiatRows({
  item,
}: {
  item: Extract<ActivityListItem, { type: 'perpsAddFunds' | 'perpsWithdraw' }>;
}) {
  const t = useI18nContext();
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const { fiat, networkFee } = item.data;
  const amount = getFiatValue(fiat);
  const networkFeeAmount = getFiatValue(networkFee);
  const signedAmount =
    item.type === 'perpsWithdraw' && typeof amount === 'number'
      ? -amount
      : amount;

  const formatFiat = (value: number, currency?: string) =>
    formatCurrencyWithMinThreshold(value, currency ?? PERPS_CURRENCY);

  return (
    <>
      {typeof networkFeeAmount === 'number' &&
      Number.isFinite(networkFeeAmount) ? (
        <Row
          label={t('networkFee')}
          testId="transaction-base-fee"
          value={formatFiat(networkFeeAmount, networkFee?.currency)}
        />
      ) : null}
      {typeof signedAmount === 'number' && Number.isFinite(signedAmount) ? (
        <Row
          label={t('totalAmount')}
          testId="transaction-breakdown-value-amount"
          value={formatFiat(signedAmount, fiat?.currency)}
        />
      ) : null}
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
