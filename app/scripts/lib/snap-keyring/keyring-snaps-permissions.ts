import {
  SubjectType,
  SubjectMetadataController,
} from '@metamask/permission-controller';
import { KeyringRpcMethod } from '@metamask/keyring-api';

/**
 * The origins of the Portfolio dapp.
 */
const PORTFOLIO_ORIGINS: string[] = [
  'http://localhost:3000',
  'https://portfolio.metamask.io',
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  'https://dev.portfolio.metamask.io',
  'https://stage.portfolio.metamask.io',
  'https://ramps-dev.portfolio.metamask.io',
  'https://portfolio-builds.metafi-dev.codefi.network',
  ///: END:ONLY_INCLUDE_IF
];

/**
 * List of keyring methods MetaMask can call.
 */
const METAMASK_ALLOWED_METHODS: string[] = [
  KeyringRpcMethod.ListAccounts,
  KeyringRpcMethod.GetAccount,
  KeyringRpcMethod.CreateAccount,
  KeyringRpcMethod.GetAccountBalances,
  KeyringRpcMethod.FilterAccountChains,
  KeyringRpcMethod.UpdateAccount,
  KeyringRpcMethod.DeleteAccount,
  KeyringRpcMethod.ExportAccount,
  KeyringRpcMethod.ListRequests,
  KeyringRpcMethod.GetRequest,
  KeyringRpcMethod.SubmitRequest,
  KeyringRpcMethod.ApproveRequest,
  KeyringRpcMethod.RejectRequest,
];

/**
 * List of keyring methods a dapp can call.
 * !NOTE: DO NOT INCLUDE `KeyringRpcMethod.SubmitRequest` IN THIS LIST.
 */
const WEBSITE_ALLOWED_METHODS: string[] = [
  KeyringRpcMethod.ListAccounts,
  KeyringRpcMethod.GetAccount,
  KeyringRpcMethod.CreateAccount,
  KeyringRpcMethod.GetAccountBalances,
  KeyringRpcMethod.FilterAccountChains,
  KeyringRpcMethod.UpdateAccount,
  KeyringRpcMethod.DeleteAccount,
  KeyringRpcMethod.ExportAccount,
  KeyringRpcMethod.ListRequests,
  KeyringRpcMethod.GetRequest,
  KeyringRpcMethod.SubmitRequest,
  KeyringRpcMethod.ApproveRequest,
  KeyringRpcMethod.RejectRequest,
];

/**
 * List of keyring methods that Portfolio can call.
 */
const PORTFOLIO_ALLOWED_METHODS: string[] = [
  KeyringRpcMethod.ListAccounts,
  KeyringRpcMethod.GetAccount,
  KeyringRpcMethod.CreateAccount,
  KeyringRpcMethod.GetAccountBalances,
  KeyringRpcMethod.FilterAccountChains,
  KeyringRpcMethod.UpdateAccount,
  KeyringRpcMethod.DeleteAccount,
  KeyringRpcMethod.ExportAccount,
  KeyringRpcMethod.ListRequests,
  KeyringRpcMethod.GetRequest,
  KeyringRpcMethod.SubmitRequest,
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
 * @param origin - The origin itself.
 * @returns A function that returns the list of keyring methods an origin can
 * call.
 */
export function keyringSnapPermissionsBuilder(
  controller: SubjectMetadataController,
  origin: string,
): () => string[] {
  return () => {
    if (origin === 'metamask') {
      return METAMASK_ALLOWED_METHODS;
    }

    if (PORTFOLIO_ORIGINS.includes(origin)) {
      return PORTFOLIO_ALLOWED_METHODS;
    }

    const originMetadata = controller.getSubjectMetadata(origin);
    if (originMetadata?.subjectType === SubjectType.Website) {
      return isProtocolAllowed(origin) ? WEBSITE_ALLOWED_METHODS : [];
    }

    return [];
  };
}
