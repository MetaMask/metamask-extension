// Request and repsones are currently untyped.
/* eslint-disable @typescript-eslint/no-explicit-any */

import { MESSAGE_TYPE } from '../../../shared/constants/app';
import { trace } from '../../../shared/lib/trace';

export default function createTracingMiddleware() {
  return async function tracingMiddleware(
    req: any,
    _res: any,
    next: () => void,
  ) {
    const { id, method } = req;

    if (method === MESSAGE_TYPE.ETH_SEND_TRANSACTION) {
      req.traceContext = await trace({
        name: 'Transaction',
        id,
        tags: { source: 'dapp' },
      });

      await trace({ name: 'Middleware', id, parentContext: req.traceContext });
    }

    next();
  };
}
