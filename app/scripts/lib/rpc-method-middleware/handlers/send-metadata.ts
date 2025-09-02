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

type SendMetadataOptions = {
  addSubjectMetadata: AddSubjectMetadata;
  subjectType: SubjectType;
};

type SendMetadataConstraint<
  Params extends SubjectMetadataToAdd = SubjectMetadataToAdd,
> = {
  implementation: (
    req: SendMetadataHandlerRequest<Params>,
    res: PendingJsonRpcResponse<true>,
    _next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
    { addSubjectMetadata, subjectType }: SendMetadataOptions,
  ) => void;
} & HandlerWrapper;
/**
 * This internal method is used by our external provider to send metadata about
 * permission subjects so that we can e.g. display a proper name and icon in
 * our UI.
 */
const sendMetadata = {
  methodNames: [MESSAGE_TYPE.SEND_METADATA],
  implementation: sendMetadataHandler,
  hookNames: {
    addSubjectMetadata: true,
    subjectType: true,
  },
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
  { addSubjectMetadata, subjectType }: SendMetadataOptions,
): void {
  const { origin, params } = req;
  if (isObject(params)) {
    const { icon = null, name = null, ...remainingParams } = params;

    addSubjectMetadata({
      ...remainingParams,
      iconUrl: icon,
      name,
      subjectType,
      origin,
    });
  } else {
    return end(rpcErrors.invalidParams({ data: params }));
  }

  res.result = true;
  return end();
}
