import { getIframeProperties } from '../../getIframeProperties';
import type { TransactionMetricsBuilder } from './types';

type TransactionMetaWithFrameContext = {
  frameId?: number;
  mainFrameOrigin?: string;
  origin?: string;
};

export const getIframeMetricsProperties: TransactionMetricsBuilder = ({
  transactionMeta,
}) => {
  const { frameId, mainFrameOrigin, origin } =
    transactionMeta as TransactionMetaWithFrameContext;

  return {
    properties: getIframeProperties({
      frameId,
      origin: origin ?? '',
      mainFrameOrigin,
    }),
    sensitiveProperties: {},
  };
};
