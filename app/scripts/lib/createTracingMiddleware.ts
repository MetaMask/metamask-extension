// Request and responses are currently untyped.

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
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req: any,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _res: any,
    next: () => void,
  ) {
    const { id, method } = req;

    const traceName = METHOD_TYPE_TO_TRACE_NAME[method];

    if (traceName) {
      // A provider request carries no trace context, so the transaction or
      // signature it starts begins its own trace instead of joining whichever
      // trace the service worker's current scope holds.
      req.traceContext = await trace({
        name: traceName,
        id,
        tags: METHOD_TYPE_TO_TAGS[method],
        root: true,
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
