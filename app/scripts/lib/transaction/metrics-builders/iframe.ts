import { getIframeProperties } from '../../getIframeProperties';
import type { TransactionMetricsBuilder } from './types';

// Reads iframe context recorded at dapp request time (via
// `transactionMetricsRequest.getTransactionFrameContext`). Returns no
// properties for transactions without recorded context (non-dapp txs, or
// dapp requests that did not originate from an iframe).
export const getIframeMetricsProperties: TransactionMetricsBuilder = ({
  transactionMeta,
  transactionMetricsRequest,
}) => {
  const frameContext = transactionMetricsRequest.getTransactionFrameContext(
    transactionMeta.id,
  );

  if (!frameContext) {
    return { properties: {}, sensitiveProperties: {} };
  }

  return {
    properties: getIframeProperties({
      frameId: frameContext.frameId,
      origin: transactionMeta.origin ?? '',
      mainFrameOrigin: frameContext.mainFrameOrigin,
    }),
    sensitiveProperties: {},
  };
};
