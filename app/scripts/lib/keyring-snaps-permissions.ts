import {
  SubjectType,
  SubjectMetadataController,
} from '@metamask/permission-controller';
import { KeyringRpcMethod } from '@metamask/keyring-api';

/**
 * List of keyring methods MetaMask can call.
 */
const METAMASK_ALLOWED_METHODS: string[] = [
  KeyringRpcMethod.ListAccounts,
  KeyringRpcMethod.GetAccount,
  KeyringRpcMethod.FilterAccountChains,
  KeyringRpcMethod.DeleteAccount,
  KeyringRpcMethod.ListRequests,
  KeyringRpcMethod.GetRequest,
  KeyringRpcMethod.SubmitRequest,
  KeyringRpcMethod.RejectRequest,
];

/**
 * List of keyring methods a dapp can call.
 */
const WEBSITE_ALLOWED_METHODS: string[] = [
  KeyringRpcMethod.ListAccounts,
  KeyringRpcMethod.GetAccount,
  KeyringRpcMethod.CreateAccount,
  KeyringRpcMethod.FilterAccountChains,
  KeyringRpcMethod.UpdateAccount,
  KeyringRpcMethod.DeleteAccount,
  KeyringRpcMethod.ExportAccount,
  KeyringRpcMethod.ListRequests,
  KeyringRpcMethod.GetRequest,
  KeyringRpcMethod.ApproveRequest,
  KeyringRpcMethod.RejectRequest,
];

/**
 * List of allowed protocols. On Flask, HTTP is also allowed for testing.
 */
const ALLOWED_PROTOCOLS: string[] = [
  'https:',
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  'http:',
  ///: END:ONLY_INCLUDE_IF
];

/**
 * Checks if the protocol of the origin is allowed.
 *
 * @param origin - The origin to check.
 * @returns `true` if the protocol of the origin is allowed, `false` otherwise.
 */
export function isProtocolAllowed(origin: string): boolean {
  try {
    const url = new URL(origin);
    return ALLOWED_PROTOCOLS.includes(url.protocol);
  } catch (error) {
    return false;
  }
}

/**
 * Builds a function that returns the list of keyring methods an origin can
 * call.
 *
 * @param controller - Reference to the `SubjectMetadataController`.
 * @returns A function that returns the list of keyring methods an origin can
 * call.
 */
export function keyringSnapPermissionsBuilder(
  controller: SubjectMetadataController,
): (origin: string) => string[] {
  return (origin: string) => {
    if (origin === 'metamask') {
      return METAMASK_ALLOWED_METHODS;
    }

    const originMetadata = controller.getSubjectMetadata(origin);
    if (originMetadata?.subjectType === SubjectType.Website) {
      return isProtocolAllowed(origin) ? WEBSITE_ALLOWED_METHODS : [];
    }

    return [];
  };
}
