import { NameType } from '@metamask/name-controller';
import { useSelector } from 'react-redux';
import { getMemoizedMetadataContractName } from '../selectors';
import { getNftContractsByAddressOnCurrentChain } from '../selectors/nft';
import { useName } from './useName';
import { useFirstPartyContractName } from './useFirstPartyContractName';

/**
 * Attempts to resolve the name for the given parameters.
 *
 * @param value
 * @param type
 * @returns An object with two properties:
 * - `name` {string|null} - The display name, if it can be resolved, otherwise null.
 * - `hasPetname` {boolean} - True if there is a petname for the given address.
 */
export function useDisplayName(
  value: string,
  type: NameType,
): { name: string | null; hasPetname: boolean } {
  const nameEntry = useName(value, type);

  const firstPartyContractName = useFirstPartyContractName(value, type);

  const contractName = useSelector((state) =>
    (getMemoizedMetadataContractName as any)(state, value),
  );

  const watchedNftName = useSelector(getNftContractsByAddressOnCurrentChain)[
    value.toLowerCase()
  ]?.name;

  const name =
    nameEntry?.name ||
    firstPartyContractName ||
    contractName ||
    watchedNftName ||
    null;

  const hasPetname = Boolean(nameEntry?.name);

  return {
    name,
    hasPetname,
  };
}
