import { ethErrors } from 'eth-rpc-errors';
import { createAsyncMiddleware } from 'json-rpc-engine';

export function createGetPlumeSignatureMiddleware({
  processGetPlumeSignature,
}) {
  return createAsyncMiddleware(async (req, res, next) => {
    if (!processGetPlumeSignature) {
      throw ethErrors.rpc.methodNotSupported();
    }
    const { method, params } = req;
    if (method !== 'eth_getPlumeSignature') {
      next();
      return;
    }
    const [data, from] = params;
    res.result = await processGetPlumeSignature({ data, from }, req);
    // TODO: Insert Plume logic here
  });
}
