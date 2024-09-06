// Request and repsones are currently untyped.
/* eslint-disable @typescript-eslint/no-explicit-any */

import { MESSAGE_TYPE } from '../../../shared/constants/app';
import { trace, TraceName } from '../../../shared/lib/trace';

async function handleTracing(
  req: any,
  id: any,
  traceName: TraceName,
  tags?: Record<string, string>,
) {
  req.traceContext = await trace({
    name: traceName,
    id,
    tags,
  });

  await trace({
    name: TraceName.Middleware,
    id,
    parentContext: req.traceContext,
  });
}

export default function createTracingMiddleware() {
  return async function tracingMiddleware(
    req: any,
    _res: any,
    next: () => void,
  ) {
    const { id, method } = req;

    if (method === MESSAGE_TYPE.ETH_SEND_TRANSACTION) {
      await handleTracing(req, id, TraceName.Transaction, { source: 'dapp' });
    }

    if (method === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA) {
      await handleTracing(req, id, TraceName.Signature);
    }

    next();
  };
}
