import type {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
  MethodHandler,
} from '@metamask/json-rpc-engine';
import type { JsonRpcRequest, PendingJsonRpcResponse } from '@metamask/utils';
import type {
  PermissionSubjectMetadata,
  SubjectType,
} from '@metamask/permission-controller';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';

export type SubjectMetadataToAdd = PermissionSubjectMetadata & {
  name?: string | null;
  subjectType?: SubjectType | null;
  extensionId?: string | null;
  iconUrl?: string | null;
};

type SendMetadataConstraint = MethodHandler<
  never,
  never,
  SubjectMetadataToAdd,
  true
>;

export const sendMetadataHandler = {
  implementation: sendMetadataImplementation,
} satisfies SendMetadataConstraint;

const sendMetadataHandlers = {
  [MESSAGE_TYPE.SEND_METADATA]: sendMetadataHandler,
};

export default sendMetadataHandlers;

/**
 * @param _req - The JSON-RPC request object.
 * @param res - The JSON-RPC response object.
 * @param _next - The json-rpc-engine 'next' callback.
 * @param end - The json-rpc-engine 'end' callback.
 */
function sendMetadataImplementation(
  _req: JsonRpcRequest<SubjectMetadataToAdd>,
  res: PendingJsonRpcResponse<true>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
): void {
  // This handler is no longer in-use and simply remains as a no-op for backwards compatibility.
  res.result = true;
  return end();
}
