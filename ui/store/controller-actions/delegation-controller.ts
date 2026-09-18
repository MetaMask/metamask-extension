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
  return await submitRequestToBackground('signDelegation', [
    { delegation, chainId },
  ]);
};
