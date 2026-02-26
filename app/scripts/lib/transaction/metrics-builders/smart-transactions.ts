import { getSmartTransactionMetricsProperties } from '../../../../../shared/modules/metametrics';
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
