import {
  GatorPermissionsMap,
  RevocationMetadata,
} from '@metamask/gator-permissions-controller';
import { Hex } from '@metamask/utils';
import { submitRequestToBackground } from '../background-connection';

export type FetchAndUpdateGatorPermissionsParams = {
  isRevoked?: boolean;
};

export const fetchAndUpdateGatorPermissions = async (
  params?: FetchAndUpdateGatorPermissionsParams,
): Promise<GatorPermissionsMap> => {
  return await submitRequestToBackground(
    'fetchAndUpdateGatorPermissions',
    params ? [params] : [],
  );
};

/**
 * Adds a pending revocation for a delegation that requires an on-chain transaction.
 * This method is used for revocations that come with a transaction that has to be
 * confirmed before marking the permission as revoked.
 *
 * @param params - The parameters for pending revocation.
 * @param params.txId - The transaction ID associated with the revocation.
 * @param params.permissionContext - The permission context to revoke.
 */
export const addPendingRevocation = async ({
  txId,
  permissionContext,
}: {
  txId: string;
  permissionContext: Hex;
}): Promise<void> => {
  await submitRequestToBackground('addPendingRevocation', [
    {
      txId,
      permissionContext,
    },
  ]);
};

/**
 * Submits a revocation for a delegation that is already disabled on-chain.
 * This method is used when a delegation has already been disabled and does not
 * require an on-chain transaction to revoke the permission.
 *
 * @param params - The parameters for direct revocation.
 * @param params.permissionContext - The permission context to revoke.
 * @param params.revocationMetadata - The metadata for the revocation.
 */
export const submitDirectRevocation = async ({
  permissionContext,
}: {
  permissionContext: Hex;
  revocationMetadata: RevocationMetadata;
}): Promise<void> => {
  await submitRequestToBackground('submitDirectRevocation', [
    {
      permissionContext,
      revocationMetadata,
    },
  ]);
};

/**
 * Checks if a delegation is already disabled on-chain by querying the
 * delegation manager contract's disabledDelegations mapping.
 *
 * @param delegationManagerAddress - The delegation manager contract address.
 * @param delegationHash - The hash of the delegation to check.
 * @param networkClientId - The network client ID to use for the query.
 * @returns True if the delegation is disabled, false otherwise.
 */
export const checkDelegationDisabled = async (
  delegationManagerAddress: Hex,
  delegationHash: Hex,
  networkClientId: string,
): Promise<boolean> => {
  return await submitRequestToBackground<boolean>('checkDelegationDisabled', [
    delegationManagerAddress,
    delegationHash,
    networkClientId,
  ]);
};
