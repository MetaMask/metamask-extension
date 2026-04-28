import {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
  MethodHandler,
} from '@metamask/json-rpc-engine';
import type { PendingJsonRpcResponse } from '@metamask/utils';
import {
  PermissionSubjectMetadata,
  SubjectType,
} from '@metamask/permission-controller';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import { HandlerRequestType as SendMetadataHandlerRequest } from './types';

export type SubjectMetadataToAdd = PermissionSubjectMetadata & {
  name?: string | null;
  subjectType?: SubjectType | null;
  extensionId?: string | null;
  iconUrl?: string | null;
};

export type SendMetadataHooks = {};

type SendMetadataConstraint = MethodHandler<SendMetadataHooks>;

const sendMetadata = {
  methodNames: [MESSAGE_TYPE.SEND_METADATA],
  implementation:
    sendMetadataHandler as unknown as SendMetadataConstraint['implementation'],
  hookNames: {},
} satisfies SendMetadataConstraint;

const sendMetadataHandlers = {
  [MESSAGE_TYPE.SEND_METADATA]: sendMetadata,
};

export default sendMetadataHandlers;

/**
 * @param _req - The JSON-RPC request object.
 * @param res - The JSON-RPC response object.
 * @param _next - The json-rpc-engine 'next' callback.
 * @param end - The json-rpc-engine 'end' callback.
 */
function sendMetadataHandler<
  Params extends SubjectMetadataToAdd = SubjectMetadataToAdd,
>(
  _req: SendMetadataHandlerRequest<Params>,
  res: PendingJsonRpcResponse<true>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
): void {
  // This handler is no longer in-use and simply remains as a no-op for backwards compatibility.
  res.result = true;
  return end();
}
