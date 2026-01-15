import { TransactionMeta } from '@metamask/transaction-controller';
import { useEffect } from 'react';
import { useSyncEqualityCheck } from '../../../../../../hooks/useSyncEqualityCheck';
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
  const hasValidFiatValue = fiatValue !== undefined && fiatValue !== '';

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const properties = { sending_value: hasValidFiatValue ? fiatValue : 0 };
  const sensitiveProperties = {};
  const params = { properties, sensitiveProperties };

  const stableParams = useSyncEqualityCheck(params);

  useEffect(() => {
    if (hasValidFiatValue) {
      updateTransactionEventFragment(stableParams, transactionId);
    }
  }, [
    updateTransactionEventFragment,
    transactionId,
    stableParams,
    hasValidFiatValue,
  ]);
};
