import { GatorPermissionsMap } from '@metamask/gator-permissions-controller';
import { Hex, Json } from '@metamask/utils';
import {
  encodeDisabledDelegationsCheck,
  decodeDisabledDelegationsResult,
} from '../../../shared/lib/delegation/delegation';
import { submitRequestToBackground } from '../background-connection';

export const fetchAndUpdateGatorPermissions = async (
  params?: Json,
): Promise<GatorPermissionsMap> => {
  return await submitRequestToBackground(
    'fetchAndUpdateGatorPermissions',
    params ? [params] : [],
  );
};

export const addPendingRevocation = async (
  txId: string,
  permissionContext: Hex,
): Promise<void> => {
  return await submitRequestToBackground('addPendingRevocation', [
    txId,
    permissionContext,
  ]);
};

export const submitRevocation = async (
  permissionContext: Hex,
): Promise<void> => {
  return await submitRequestToBackground('submitRevocation', [
    { permissionContext },
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
export const isDelegationDisabled = async (
  delegationManagerAddress: Hex,
  delegationHash: Hex,
  networkClientId: string,
): Promise<boolean> => {
  // Encode the call to disabledDelegations(bytes32)
  const callData = encodeDisabledDelegationsCheck({ delegationHash });

  // Make eth_call request through the network controller
  const result = await submitRequestToBackground<Hex>('callRpc', [
    'eth_call',
    [
      {
        to: delegationManagerAddress,
        data: callData,
      },
      'latest',
    ],
    networkClientId,
  ]);

  // Decode the result
  const isDisabled = decodeDisabledDelegationsResult(result);

  return isDisabled;
};
