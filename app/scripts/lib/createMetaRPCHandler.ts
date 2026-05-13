import { rpcErrors, serializeError } from '@metamask/rpc-errors';
import type {
  Json,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import type { TaggedApiMethod } from '../messenger-client-init/utils';
import { extractTraceContext } from '../../../shared/lib/trace';
import { withTraceContextHandler } from '../../../shared/lib/with-trace-context';
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

    const handler = api[data.method];
    const controller = handler._controllerName;
    const spanName: `Background RPC: ${string}` = controller
      ? `Background RPC: ${controller}.${data.method}`
      : `Background RPC: ${data.method}`;

    let result: unknown;
    let error: unknown;
    try {
      result = await tracedHandler({ handler, api, data, spanName })(
        data.params,
      );
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

function tracedHandler({
  handler,
  api,
  data,
  spanName,
}: {
  handler: TaggedApiMethod;
  api: MetaRpcApi;
  data: JsonRpcRequest;
  spanName: `Background RPC: ${string}`;
}) {
  return withTraceContextHandler<
    [JsonRpcRequest['params']],
    unknown[],
    unknown
  >({
    handler: (...cleanArgs) => handler.call(api, ...cleanArgs),
    extract: ([rawParams]) => {
      const { cleanParams, traceContext } = extractTraceContext(rawParams);
      const cleanArgs = Array.isArray(cleanParams)
        ? cleanParams
        : [cleanParams];
      return { cleanArgs, context: traceContext };
    },
    getSpanRequest: () => ({
      name: spanName,
      op: 'rpc.handler',
      data: {
        method: data.method,
        ...(handler._controllerName && { controller: handler._controllerName }),
      },
    }),
  });
}

export default createMetaRPCHandler;
