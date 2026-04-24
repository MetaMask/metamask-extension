import type {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import type { PendingJsonRpcResponse } from '@metamask/utils';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import type { HandlerRequestType, HandlerWrapper } from './types';

export type HandleGetStateLogsRequest = (origin: string) => Promise<string>;

type GetStateLogsConstraint = {
  implementation: (
    req: HandlerRequestType,
    res: PendingJsonRpcResponse<string>,
    _next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
    { handleGetStateLogsRequest }: Record<string, HandleGetStateLogsRequest>,
  ) => Promise<void>;
} & HandlerWrapper;

const getStateLogs = {
  methodNames: [MESSAGE_TYPE.GET_STATE_LOGS],
  implementation: getStateLogsHandler,
  hookNames: {
    handleGetStateLogsRequest: true,
  },
} satisfies GetStateLogsConstraint;

export default getStateLogs;

async function getStateLogsHandler(
  req: HandlerRequestType,
  res: PendingJsonRpcResponse<string>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  { handleGetStateLogsRequest }: Record<string, HandleGetStateLogsRequest>,
): Promise<void> {
  res.result = await handleGetStateLogsRequest(req.origin);
  return end();
}
