import { rpcErrors, serializeError } from '@metamask/rpc-errors';
import type {
  Json,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import type { TaggedApiMethod } from '../messenger-client-init/utils';
import {
  continueTraceContext,
  extractTrace,
  trace as createTrace,
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

    const handler = api[data.method];

    if (!handler) {
      outStream.write({
        jsonrpc: '2.0',
        error: rpcErrors.methodNotFound({
          message: `${data.method} not found`,
        }),
        id: data.id,
      });
      return;
    }

    const controller = handler._controllerName;
    const { cleanParams, trace } = extractTrace(data.params);

    let result: unknown;
    let error: unknown;
    try {
      if (!trace) {
        if (Array.isArray(cleanParams)) {
          result = await handler.call(api, ...cleanParams);
        } else {
          result = await handler.call(api, cleanParams);
        }
      } else if (shouldSampleWrappers(trace.context._traceId)) {
        // Wrapper sub-sample passes: emit the `rpc.handler` span and
        // propagate trace context for nested spans.
        result = await createTrace(
          {
            name: controller
              ? `Background RPC: ${controller}.${data.method}`
              : trace.spanName,
            parentContext: trace.context,
            op: 'rpc.handler',
            data: {
              method: data.method,
              ...(controller && { controller }),
              ...(trace.messengerAction && { action: trace.messengerAction }),
            },
          },
          () => handler.call(api, ...cleanParams),
        );
      } else {
        // Wrapper sub-sample rejects: skip the `rpc.handler` span but still
        // propagate trace context so nested auto-instrumented and core-package
        // spans (e.g. `http.client`, `assets-controller` `trace()` callers)
        // attach to the originating UI trace instead of becoming orphans.
        result = await continueTraceContext(trace.context, () =>
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
