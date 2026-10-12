/* eslint-disable @typescript-eslint/naming-convention */
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import { PAY_TYPES } from './metamask-pay';
import type { TransactionMetricsBuilder } from './types';

/**
 * Adds `mm_pay_rpc` and `mm_pay_rpc_origin` to `wallet_mmPay` transactions.
 *
 * @param request - The metrics builder request.
 * @param request.transactionMeta - The transaction.
 * @returns The metrics properties.
 */
export const getMmPayRpcMetricsProperties: TransactionMetricsBuilder = ({
  transactionMeta,
}) => {
  // In-wallet Pay flows are always added with `isInternal: true`, so a
  // non-internal Pay transaction can only come from wallet_mmPay.
  const isMmPayRpc =
    !transactionMeta.isInternal &&
    hasTransactionType(transactionMeta, PAY_TYPES);

  if (!isMmPayRpc) {
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
