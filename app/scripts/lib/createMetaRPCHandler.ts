import { rpcErrors, serializeError } from '@metamask/rpc-errors';
import type {
  Json,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import type { TaggedApiMethod } from '../messenger-client-init/utils';
import {
  continueTraceContext,
  extractTraceMetadata,
  trace,
} from '../../../shared/lib/trace';
import {
  shouldSampleRootWrapper,
  shouldSampleWrappers,
} from '../../../shared/lib/wrapper-sampling';
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
    const { cleanParams, traceMetadata } = extractTraceMetadata(data.params);

    let result: unknown;
    let error: unknown;
    try {
      if (!traceMetadata) {
        const callHandler = () =>
          Array.isArray(cleanParams)
            ? handler.call(api, ...cleanParams)
            : handler.call(api, cleanParams);
        // No UI trace context: a sampled dispatch roots its own trace, so
        // concurrent handlers get independent trace ids.
        result = shouldSampleRootWrapper()
          ? await trace(
              {
                name: controller
                  ? `Background RPC: ${controller}.${data.method}`
                  : `Background RPC: ${data.method}`,
                op: 'rpc.handler',
                root: true,
                data: {
                  method: data.method,
                  ...(controller && { controller }),
                },
              },
              callHandler,
            )
          : await callHandler();
      } else if (shouldSampleWrappers(traceMetadata.context._traceId)) {
        // Wrapper sub-sample passes: emit the `rpc.handler` span and
        // propagate trace context for nested spans.
        result = await trace(
          {
            name: controller
              ? `Background RPC: ${controller}.${data.method}`
              : traceMetadata.spanName,
            parentContext: traceMetadata.context,
            op: 'rpc.handler',
            data: {
              method: data.method,
              ...(controller && { controller }),
              ...(traceMetadata.messengerAction && {
                action: traceMetadata.messengerAction,
              }),
            },
          },
          () => handler.call(api, ...cleanParams),
        );
      } else {
        // Sub-sample rejects: skip the `rpc.handler` span but still propagate
        // context so nested spans (http.client, core-package trace() callers)
        // attach to the UI trace instead of orphaning.
        result = await continueTraceContext(traceMetadata.context, () =>
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
