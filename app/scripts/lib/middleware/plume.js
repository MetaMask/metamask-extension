import { createAsyncMiddleware } from 'json-rpc-engine';

export function createGetPlumeSignatureMiddleware({ getPlumeSignature }) {
  return createAsyncMiddleware(async (req, res, next) => {
    const { method, params } = req;
    if (method !== 'eth_getPlumeSignature') {
      next();
      return;
    }
    res.result = `plume result ${params.data}`;
    // TODO: Insert Plume logic here
  });
}
