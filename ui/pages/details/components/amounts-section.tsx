import React from 'react';
import { CaipAssetType } from '@metamask/utils';
import type {
  ActivityFee,
  ActivityListItem,
  FiatAmount,
  TokenAmount,
} from '../../../../shared/lib/activity/types';
import { GAS_FEE_SPONSORED } from '../../../../shared/lib/activity/fees';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { SuccessPill } from '../../../components/component-library';
import { TokenFiatValue } from '../../../components/app/transaction/token-fiat-value';
import { TokenLabel } from '../../../components/app/transaction/token-label';
// eslint-disable-next-line import-x/no-restricted-paths
import { PERPS_CURRENCY } from '../../confirmations/constants/perps';
import { Row } from './shared';

function getFiatValue(fiat?: FiatAmount) {
  return typeof fiat?.amount === 'string' ? Number(fiat.amount) : undefined;
}

function feeToToken(fee: ActivityFee): TokenAmount {
  return {
    amount: fee.amount,
    decimals: fee.decimals,
    symbol: fee.symbol,
    assetId: fee.assetId,
    direction: 'out',
  };
}

export function FeesRows({ item }: { item: ActivityListItem }) {
  const t = useI18nContext();
  const visibleFees =
    'fees' in item.data
      ? (item.data.fees?.filter(
          (fee) => fee.amount || fee.type === GAS_FEE_SPONSORED,
        ) ?? [])
      : [];

  if (!visibleFees.length) {
    return null;
  }

  return (
    <>
      {visibleFees.map((fee, index) => {
        const { assetId, symbol, type } = fee;
        let label = type;
        let value = (
          <div className="flex items-center justify-end gap-2">
            <TokenFiatValue token={feeToToken(fee)} />
            <TokenLabel assetId={assetId as CaipAssetType} symbol={symbol} />
          </div>
        );

        if (type === 'base') {
          label = t('networkFee');
        } else if (type === 'priority') {
          label = t('priorityFee');
        } else if (type === GAS_FEE_SPONSORED) {
          label = t('networkFee');
          value = <SuccessPill label={t('paidByMetaMask')} />;
        }

        return (
          <Row
            key={`${type}-${assetId ?? symbol ?? index}`}
            label={label}
            testId={
              type === 'base' || type === GAS_FEE_SPONSORED
                ? 'transaction-base-fee'
                : undefined
            }
            value={value}
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
