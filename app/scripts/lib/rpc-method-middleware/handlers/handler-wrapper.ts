import type {
  JsonRpcEngineNextCallback,
  JsonRpcEngineEndCallback,
} from '@metamask/json-rpc-engine';
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcParams,
  Json,
} from '@metamask/utils';

export type HandlerWrapperType<
  Params extends JsonRpcParams = JsonRpcParams,
  Result extends Json = Json,
> = {
  methodNames: [string];
  implementation: (
    _req: JsonRpcRequest<Params>,
    res: JsonRpcResponse<Result>,
    _next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
    options: Record<string, () => void>,
  ) => Promise<void>;
  hookNames: Record<string, boolean>;
};
