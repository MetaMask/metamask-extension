import { rpcErrors, serializeError } from '@metamask/rpc-errors';
import { extractTraceContext, trace } from '../../../shared/lib/trace';
import { isStreamWritable } from './stream-utils';

const createMetaRPCHandler = (api, outStream) => {
  return async (data) => {
    if (!isStreamWritable(outStream)) {
      return;
    }
    if (!api[data.method]) {
      outStream.write({
        jsonrpc: '2.0',
        error: rpcErrors.methodNotFound({
          message: `${data.method} not found`,
        }),
        id: data.id,
      });
      return;
    }

    const { cleanParams, traceContext } = extractTraceContext(data.params);
    const handler = api[data.method];
    const controller = handler._controllerName;
    const spanName = controller
      ? `Background RPC: ${controller}.${data.method}`
      : `Background RPC: ${data.method}`;

    let result;
    let error;
    try {
      if (traceContext) {
        result = await trace(
          {
            name: spanName,
            parentContext: traceContext,
            op: 'rpc.handler',
            data: { method: data.method, ...(controller && { controller }) },
          },
          () => handler(...cleanParams),
        );
      } else {
        result = await handler(...cleanParams);
      }
    } catch (err) {
      error = err;
    }

    if (!isStreamWritable(outStream)) {
      if (error) {
        console.error(error);
      }
      return;
    }

    if (error) {
      outStream.write({
        jsonrpc: '2.0',
        error: serializeError(error, { shouldIncludeStack: true }),
        id: data.id,
      });
    } else {
      outStream.write({
        jsonrpc: '2.0',
        result,
        id: data.id,
      });
    }
  };
};

export default createMetaRPCHandler;
