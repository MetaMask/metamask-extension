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
  ///: BEGIN:ONLY_INCLUDE_IN(build-flask)
  'http:',
  ///: END:ONLY_INCLUDE_IN
];

/**
 * List of local domains.
 */
const LOCAL_DOMAINS: string[] = ['localhost', '127.0.0.1'];

/**
 * Checks if the value is a boolean and returns its value.
 *
 * @param value - Value to check.
 * @returns `true` if the value is a boolean and `true`, `false` otherwise.
 */
function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' && value;
}

/**
 * Checks if the protocol of the origin is allowed.
 *
 * @param origin - The origin to check.
 * @returns `true` if the protocol of the origin is allowed, `false` otherwise.
 */
export function isProtocolAllowed(origin: string): boolean {
  try {
    const url: URL = new URL(origin);

    // For testing, allow local domains regardless of the protocol.
    if (
      asBoolean(process.env.ALLOW_LOCAL_SNAPS) &&
      LOCAL_DOMAINS.includes(url.hostname)
    ) {
      return true;
    }

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
