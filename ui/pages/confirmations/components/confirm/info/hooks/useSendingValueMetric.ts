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
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const properties = { sending_value: fiatValue };
  const sensitiveProperties = {};
  const params = { properties, sensitiveProperties };

  useEffect(() => {
    if (fiatValue !== undefined && fiatValue !== '') {
      // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      updateTransactionEventFragment(params, transactionId);
    }
  }, [updateTransactionEventFragment, transactionId, JSON.stringify(params)]);
};
