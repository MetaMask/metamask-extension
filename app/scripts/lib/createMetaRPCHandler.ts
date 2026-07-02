import { rpcErrors, serializeError } from '@metamask/rpc-errors';
import type {
  Json,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import type { TaggedApiMethod } from '../messenger-client-init/utils';
import {
  continueTraceContext,
  extractTraceContext,
  trace,
} from '../../../shared/lib/trace';
import { shouldSampleWrappers } from '../../../shared/lib/wrapper-sampling';
import { isStreamWritable, type StreamLike } from './stream-utils';

type MetaRpcApi = Record<string, TaggedApiMethod>;

type RpcStream = StreamLike & {
  write: (data: PendingJsonRpcResponse) => void;
};

const createMetaRPCHandler = (api: MetaRpcApi, outStream: RpcStream) => {
  return async (data: JsonRpcRequest) => {
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
    const spanName: `Background RPC: ${string}` = controller
      ? `Background RPC: ${controller}.${data.method}`
      : `Background RPC: ${data.method}`;

    let result: unknown;
    let error: unknown;
    try {
      if (!traceContext) {
        // No upstream UI trace context — root this op in its own trace so it
        // peels off the long-lived SW pageload root instead of accumulating
        // into the keepalive mega-trace. `root: true` forces a fresh root even
        // with another RPC handler concurrently in flight, so overlapping ops
        // get independent trace ids.
        result = await trace(
          {
            name: spanName,
            op: 'rpc.handler',
            root: true,
            data: { method: data.method, ...(controller && { controller }) },
          },
          () => {
            if (Array.isArray(cleanParams)) {
              return handler.call(api, ...cleanParams);
            }
            return handler.call(api, cleanParams);
          },
        );
      } else if (shouldSampleWrappers(traceContext._traceId)) {
        // Wrapper sub-sample passes: emit the `rpc.handler` span and
        // propagate trace context for nested spans.
        result = await trace(
          {
            name: spanName,
            parentContext: traceContext,
            op: 'rpc.handler',
            data: { method: data.method, ...(controller && { controller }) },
          },
          () => handler.call(api, ...cleanParams),
        );
      } else {
        // Sub-sample rejects: skip the `rpc.handler` span but still propagate
        // context so nested spans (http.client, core-package trace() callers)
        // attach to the UI trace instead of orphaning.
        result = await continueTraceContext(traceContext, () =>
          handler.call(api, ...cleanParams),
        );
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
        result: result as Json,
        id: data.id,
      });
    }
  };
};

export default createMetaRPCHandler;
