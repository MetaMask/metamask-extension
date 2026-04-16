import { getSmartTransactionMetricsProperties } from '../../../../../shared/lib/metametrics';
import type { TransactionMetricsBuilder } from './types';

export const getSmartTransactionProperties: TransactionMetricsBuilder = ({
  transactionMeta,
  transactionMetricsRequest,
}) => {
  return {
    properties: {
      ...getSmartTransactionMetricsProperties(
        transactionMetricsRequest,
        transactionMeta,
      ),
    },
    sensitiveProperties: {},
  };
};
