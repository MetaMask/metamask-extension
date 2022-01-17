import { useCallback, useContext } from 'react';

import { useGasFeeContext } from '../contexts/gasFee';
import { MetaMetricsContext } from '../contexts/metametrics';

export const useTransactionMetrics = () => {
  const { transaction } = useGasFeeContext();
  const metricsEvent = useContext(MetaMetricsContext);

  const captureTransactionMetrics = useCallback(
    ({ action, name, variables }) => {
      if (!transaction) {
        return;
      }
      const { origin, type } = transaction;
      metricsEvent({
        eventOpts: {
          category: 'Transactions',
          action,
          name,
        },
        customVariables: {
          origin,
          transaction_type: type,
          source: origin === 'metamask' ? 'user' : 'dapp',
          ...variables,
        },
      });
    },
    [metricsEvent, transaction],
  );

  const captureTransactionMetricsForEIP1559V2 = useCallback(
    ({ action, name, variables }) => {
      captureTransactionMetrics({
        action,
        name,
        variables: { ...variables, EIP_1559_V2: true },
      });
    },
    [captureTransactionMetrics],
  );

  return {
    captureTransactionMetrics,
    captureTransactionMetricsForEIP1559V2,
  };
};
