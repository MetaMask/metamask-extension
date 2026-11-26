import { SubjectType } from '@metamask/permission-controller';
import { Json, JsonRpcRequest, PendingJsonRpcResponse } from '@metamask/utils';
import {
  recordConnectedDappRpc,
  recordDappRpc,
  recordExternalExtensionRpc,
  recordSnapRpc,
} from '../../../shared/lib/telemetry/last-activity';

const recordBySubjectType: Partial<Record<SubjectType, () => void>> = {
  [SubjectType.Website]: recordDappRpc,
  [SubjectType.Snap]: recordSnapRpc,
  [SubjectType.Extension]: recordExternalExtensionRpc,
};

export type ExternalRpcActivityOptions = {
  /**
   * Whether this website origin already has account access.
   * Checked on each request so a connection granted mid-session starts counting.
   * Only consulted for {@link SubjectType.Website}.
   */
  isConnected?: () => boolean;
};

/**
 * Returns a middleware that records a JSON-RPC request for state-write
 * telemetry. The recorder depends on the connection's subject type.
 * `SubjectType.Internal` is ignored.
 *
 * Website requests also update the connected-dapp signal when `isConnected`
 * returns true.
 *
 * @param subjectType - The type of the sender subject.
 * @param options - Optional connection context.
 * @param options.isConnected - Whether the website origin already has account
 * access.
 * @returns The middleware function.
 */
export default function createExternalRpcActivityMiddleware(
  subjectType: SubjectType,
  { isConnected }: ExternalRpcActivityOptions = {},
) {
  const record = recordBySubjectType[subjectType];
  return function externalRpcActivityMiddleware(
    _req: JsonRpcRequest,
    _res: PendingJsonRpcResponse<Json>,
    next: () => void,
  ) {
    record?.();
    if (subjectType === SubjectType.Website && isConnected) {
      try {
        if (isConnected()) {
          recordConnectedDappRpc();
        }
      } catch {
        // A permission lookup failure must not drop the request.
      }
    }
    next();
  };
}
