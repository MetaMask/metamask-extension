import type { Hex } from '@metamask/utils';
import type { UnsignedDelegation } from '../../../shared/lib/delegation';
import { submitRequestToBackground } from '../background-connection';

export const signDelegation = async ({
  delegation,
  chainId,
}: {
  delegation: UnsignedDelegation;
  chainId: Hex;
}): Promise<Hex> => {
  // Type assertion: This action returns a string, but we want a Hex.
  // TODO: Ideally we should either update `signDelegation` to guarantee a Hex,
  // or relax the return type of _this_ action function to `string`.
  return (await submitRequestToBackground(
    'DelegationController:signDelegation',
    [{ delegation, chainId }],
  )) as Hex;
};
