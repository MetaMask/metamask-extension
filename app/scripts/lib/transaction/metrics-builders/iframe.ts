import { TransactionMetaMetricsEvent } from '../../../../../shared/constants/transaction';
import { getIframeProperties } from '../../getIframeProperties';
import {
  consumeDappRequestFrameContext,
  getDappRequestFrameContext,
} from '../dapp-request-frame-context';
import type { TransactionMetricsBuilder } from './types';

type TransactionMetaWithFrameContext = {
  frameId?: number;
  frameOrigin?: string;
  mainFrameOrigin?: string;
  origin?: string;
  requestId?: string;
  actionId?: string;
};

export const getIframeMetricsProperties: TransactionMetricsBuilder = ({
  eventName,
  transactionMeta,
}) => {
  const { frameId, frameOrigin, mainFrameOrigin, origin, requestId, actionId } =
    transactionMeta as TransactionMetaWithFrameContext;
  const frameContextRequestId = requestId ?? actionId;
  const frameContext =
    eventName === TransactionMetaMetricsEvent.added
      ? consumeDappRequestFrameContext(frameContextRequestId)
      : getDappRequestFrameContext(frameContextRequestId);

  return {
    properties: getIframeProperties({
      frameId: frameId ?? frameContext?.frameId,
      origin: frameOrigin ?? frameContext?.frameOrigin ?? origin ?? '',
      mainFrameOrigin: mainFrameOrigin ?? frameContext?.mainFrameOrigin,
    }),
    sensitiveProperties: {},
  };
};
