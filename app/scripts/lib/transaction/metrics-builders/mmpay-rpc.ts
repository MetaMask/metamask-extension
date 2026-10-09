/* eslint-disable @typescript-eslint/naming-convention */
import { isMmPayRpcTransaction } from '../../mmpay-rpc';
import type { TransactionMetricsBuilder } from './types';

export const getMmPayRpcMetricsProperties: TransactionMetricsBuilder = ({
  transactionMeta,
}) => {
  if (!isMmPayRpcTransaction(transactionMeta)) {
    return { properties: {}, sensitiveProperties: {} };
  }

  return {
    properties: {
      mm_pay_rpc: true,
      mm_pay_rpc_origin: transactionMeta.origin,
    },
    sensitiveProperties: {},
  };
};
