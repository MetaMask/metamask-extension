import React from 'react';
import { CaipAssetType } from '@metamask/utils';
import type {
  ActivityFee,
  ActivityListItem,
  TokenAmount,
} from '../../../../shared/lib/activity/types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useIsGasFeeSponsored } from '../../../hooks/activity/useIsGasFeeSponsored';
import { SuccessPill } from '../../../components/component-library';
import { TokenFiatValue } from '../../../components/app/transaction/token-fiat-value';
import { TokenLabel } from '../../../components/app/transaction/token-label';
import { Row } from './shared';

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
  const isGasFeeSponsored = useIsGasFeeSponsored(item.hash);

  const amountFees =
    'fees' in item.data
      ? (item.data.fees?.filter((fee) => Boolean(fee.amount)) ?? [])
      : [];
  const hasBaseFee = amountFees.some((fee) => fee.type === 'base');
  const visibleFees =
    isGasFeeSponsored && !hasBaseFee
      ? [{ type: 'base' }, ...amountFees]
      : amountFees;

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
          if (isGasFeeSponsored) {
            value = <SuccessPill label={t('paidByMetaMask')} />;
          }
        } else if (type === 'priority') {
          label = t('priorityFee');
        }

        return (
          <Row
            key={`${type}-${assetId ?? symbol ?? index}`}
            label={label}
            testId={type === 'base' ? 'transaction-base-fee' : undefined}
            value={value}
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
