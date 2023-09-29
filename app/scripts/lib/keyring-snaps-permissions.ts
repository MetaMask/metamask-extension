import {
  SubjectType,
  SubjectMetadataController,
} from '@metamask/subject-metadata-controller';
import { KeyringRpcMethod } from '@metamask/keyring-api';

/**
 * List of keyring methods MetaMask can call.
 */
const metamaskAllowedMethods: string[] = [
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
const dappAllowedMethods: string[] = [
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
      return metamaskAllowedMethods;
    }

    const originMetadata = controller.getSubjectMetadata(origin);
    if (originMetadata?.subjectType === SubjectType.Website) {
      return dappAllowedMethods;
    }

    return [];
  };
}
