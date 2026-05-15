import { rpcErrors, serializeError } from '@metamask/rpc-errors';
import type {
  Json,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import type { TaggedApiMethod } from '../messenger-client-init/utils';
import { extractTraceContext as extractRpcTraceContext } from '../../../shared/lib/trace';
import { extractTraceContext } from '../../../shared/lib/with-trace-context-decorators';
import { isStreamWritable, type StreamLike } from './stream-utils';

type MetaRpcApi = Record<string, TaggedApiMethod>;

type RpcStream = StreamLike & {
  write: (data: PendingJsonRpcResponse) => void;
};

class RpcDispatcher {
  api: MetaRpcApi;

  constructor(api: MetaRpcApi) {
    this.api = api;
  }

  @extractTraceContext({
    extract: (data: JsonRpcRequest) => {
      const { cleanParams, traceContext } = extractRpcTraceContext(data.params);
      return {
        cleanInput: {
          ...data,
          params: cleanParams as JsonRpcRequest['params'],
        },
        context: traceContext,
      };
    },
    getSpanRequest(this: RpcDispatcher, data: JsonRpcRequest) {
      const handler = this.api[data.method];
      const controller = handler._controllerName;
      const name: `Background RPC: ${string}` = controller
        ? `Background RPC: ${controller}.${data.method}`
        : `Background RPC: ${data.method}`;
      return {
        name,
        op: 'rpc.handler',
        data: {
          method: data.method,
          ...(controller && { controller }),
        },
      };
    },
  })
  async dispatch(data: JsonRpcRequest): Promise<unknown> {
    const handler = this.api[data.method];
    if (Array.isArray(data.params)) {
      return handler.call(this.api, ...data.params);
    }
    return handler.call(this.api, data.params);
  }
}

const createMetaRPCHandler = (api: MetaRpcApi, outStream: RpcStream) => {
  const dispatcher = new RpcDispatcher(api);
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

    let result: unknown;
    let error: unknown;
    try {
      result = await dispatcher.dispatch(data);
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
