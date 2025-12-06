import { GatorPermissionsMap } from '@metamask/gator-permissions-controller';
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

export const submitDirectRevocation = async ({
  permissionContext,
}: {
  permissionContext: Hex;
}): Promise<void> => {
  await submitRequestToBackground('submitDirectRevocation', [
    {
      permissionContext,
    },
  ]);
};

export const submitRevocation = async ({
  permissionContext,
}: {
  permissionContext: Hex;
}): Promise<void> => {
  await submitRequestToBackground('submitRevocation', [{ permissionContext }]);
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
