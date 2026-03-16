/* eslint-disable @typescript-eslint/naming-convention */
import { TransactionStatus } from '@metamask/transaction-controller';
import { extractRpcDomain } from '../../util';
import type { TransactionMetricsBuilder } from './types';

export const getRPCMetricsProperties: TransactionMetricsBuilder = ({
  transactionMeta,
  transactionMetricsRequest,
}) => {
  if (
    transactionMeta.status !== TransactionStatus.submitted &&
    transactionMeta.status !== TransactionStatus.confirmed
  ) {
    return {
      properties: {},
      sensitiveProperties: {},
    };
  }

  const rpcUrl = transactionMetricsRequest.getNetworkRpcUrl(
    transactionMeta.chainId,
  );
  const domain = extractRpcDomain(rpcUrl);

  return {
    properties: {
      rpc_domain: domain,
    },
    sensitiveProperties: {},
  };
};
