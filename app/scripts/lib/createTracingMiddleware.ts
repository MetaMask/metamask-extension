// Request and repsones are currently untyped.
/* eslint-disable @typescript-eslint/no-explicit-any */

import { MESSAGE_TYPE } from '../../../shared/constants/app';
import { trace, TraceName } from '../../../shared/lib/trace';

const METHOD_TYPE_TO_TRACE_NAME: Record<string, TraceName> = {
  [MESSAGE_TYPE.ETH_SEND_TRANSACTION]: TraceName.Transaction,
  [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA]: TraceName.Signature,
  [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V1]: TraceName.Signature,
  [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3]: TraceName.Signature,
  [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4]: TraceName.Signature,
  [MESSAGE_TYPE.PERSONAL_SIGN]: TraceName.Signature,
};

const METHOD_TYPE_TO_TAGS: Record<string, Record<string, string>> = {
  [MESSAGE_TYPE.ETH_SEND_TRANSACTION]: { source: 'dapp' },
};

export default function createTracingMiddleware() {
  return async function tracingMiddleware(
    req: any,
    _res: any,
    next: () => void,
  ) {
    const { id, method } = req;

    const traceName = METHOD_TYPE_TO_TRACE_NAME[method];

    if (traceName) {
      req.traceContext = await trace({
        name: traceName,
        id,
        tags: METHOD_TYPE_TO_TAGS[method],
      });

      await trace({
        name: TraceName.Middleware,
        id,
        parentContext: req.traceContext,
      });
    }

    next();
  };
}
