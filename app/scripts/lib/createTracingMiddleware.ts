// Request and repsones are currently untyped.
/* eslint-disable @typescript-eslint/no-explicit-any */

import { MESSAGE_TYPE } from '../../../shared/constants/app';
import { trace, TraceName } from '../../../shared/lib/trace';

export default function createTracingMiddleware() {
  return async function tracingMiddleware(
    req: any,
    _res: any,
    next: () => void,
  ) {
    const { id, method } = req;

    if (method === MESSAGE_TYPE.ETH_SEND_TRANSACTION) {
      req.traceContext = await trace({
        name: TraceName.Transaction,
        id,
        tags: { source: 'dapp' },
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
