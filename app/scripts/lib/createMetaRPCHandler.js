import { rpcErrors, serializeError } from '@metamask/rpc-errors';
import { trace, TraceName } from '../../../shared/lib/trace';
import { isStreamWritable } from './stream-utils';

/**
 * Extract trace context appended by submitRequestToBackground from RPC params.
 * Returns the clean params (without trace context) and the trace context if present.
 *
 * @param {Array} params - RPC call parameters.
 * @returns {{ cleanParams: Array, traceContext: object | undefined }}
 */
function extractTraceContext(params) {
  if (!Array.isArray(params) || params.length === 0) {
    return { cleanParams: params ?? [], traceContext: undefined };
  }

  const lastParam = params[params.length - 1];
  if (
    lastParam &&
    typeof lastParam === 'object' &&
    lastParam._traceContext &&
    typeof lastParam._traceContext === 'object'
  ) {
    return {
      cleanParams: params.slice(0, -1),
      traceContext: lastParam._traceContext,
    };
  }

  return { cleanParams: params, traceContext: undefined };
}

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

    let result;
    let error;
    try {
      if (traceContext) {
        result = await trace(
          {
            name: `${TraceName.BackgroundRpc}: ${data.method}`,
            parentContext: traceContext,
            op: 'rpc.handler',
            data: { method: data.method },
          },
          () => api[data.method](...cleanParams),
        );
      } else {
        result = await api[data.method](...cleanParams);
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
