import { rpcErrors } from '@metamask/rpc-errors';
import {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import type { PendingJsonRpcResponse } from '@metamask/utils';
import { isObject } from '@metamask/utils';
import {
  PermissionSubjectMetadata,
  SubjectType,
} from '@metamask/permission-controller';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import {
  HandlerWrapper,
  HandlerRequestType as SendMetadataHandlerRequest,
} from './types';

export type SubjectMetadataToAdd = PermissionSubjectMetadata & {
  name?: string | null;
  subjectType?: SubjectType | null;
  extensionId?: string | null;
  iconUrl?: string | null;
};

export type AddSubjectMetadata = (metadata: SubjectMetadataToAdd) => void;

type SendMetadataConstraint<
  Params extends SubjectMetadataToAdd = SubjectMetadataToAdd,
> = {
  implementation: (
    req: SendMetadataHandlerRequest<Params>,
    res: PendingJsonRpcResponse<true>,
    _next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback
  ) => void;
} & HandlerWrapper;

const sendMetadata = {
  methodNames: [MESSAGE_TYPE.SEND_METADATA],
  implementation: sendMetadataHandler,
} satisfies SendMetadataConstraint;
export default sendMetadata;

/**
 * @param req - The JSON-RPC request object.
 * @param res - The JSON-RPC response object.
 * @param _next - The json-rpc-engine 'next' callback.
 * @param end - The json-rpc-engine 'end' callback.
 * @param options
 * @param options.addSubjectMetadata - A function that records subject
 * metadata, bound to the requesting origin.
 * @param options.subjectType - The type of the requesting origin / subject.
 */
function sendMetadataHandler<
  Params extends SubjectMetadataToAdd = SubjectMetadataToAdd,
>(
  req: SendMetadataHandlerRequest<Params>,
  res: PendingJsonRpcResponse<true>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
): void {
  const { origin, params } = req;
  if (!isObject(params)) {
    return end(rpcErrors.invalidParams({ data: params }));
  }

  // This handler is no longer in-use and simply remains as a no-op for backwards compatibility.
  res.result = true;
  return end();
}
