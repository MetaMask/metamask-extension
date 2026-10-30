import { SubjectType } from '@metamask/permission-controller';
import { Json, JsonRpcRequest, PendingJsonRpcResponse } from '@metamask/utils';
import {
  recordDappRpc,
  recordExternalExtensionRpc,
  recordSnapRpc,
} from '../../../shared/lib/telemetry/last-activity';

const recordBySubjectType: Partial<Record<SubjectType, () => void>> = {
  [SubjectType.Website]: recordDappRpc,
  [SubjectType.Snap]: recordSnapRpc,
  [SubjectType.Extension]: recordExternalExtensionRpc,
};

/**
 * Returns a middleware that records a JSON-RPC request for state-write
 * telemetry. The recorder depends on the connection's subject type.
 * `SubjectType.Internal` is ignored.
 *
 * @param subjectType - The type of the sender subject.
 * @returns The middleware function.
 */
export default function createExternalRpcActivityMiddleware(
  subjectType: SubjectType,
) {
  const record = recordBySubjectType[subjectType];
  return function externalRpcActivityMiddleware(
    _req: JsonRpcRequest,
    _res: PendingJsonRpcResponse<Json>,
    next: () => void,
  ) {
    record?.();
    next();
  };
}
