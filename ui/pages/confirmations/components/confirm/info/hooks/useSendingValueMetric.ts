import { TransactionMeta } from '@metamask/transaction-controller';
import { useEffect } from 'react';
import { useTransactionEventFragment } from '../../../../hooks/useTransactionEventFragment';

export type UseSendingValueMetricProps = {
  transactionMeta: TransactionMeta;
  fiatValue: number | undefined | '';
};

export const useSendingValueMetric = ({
  transactionMeta,
  fiatValue,
}: UseSendingValueMetricProps) => {
  const { updateTransactionEventFragment } = useTransactionEventFragment();

  const transactionId = transactionMeta.id;
  const properties = { sending_value: fiatValue };
  const sensitiveProperties = {};
  const params = { properties, sensitiveProperties };

  useEffect(() => {
    if (fiatValue !== undefined && fiatValue !== '') {
      updateTransactionEventFragment(params, transactionId);
    }
  }, [updateTransactionEventFragment, transactionId, JSON.stringify(params)]);
};
