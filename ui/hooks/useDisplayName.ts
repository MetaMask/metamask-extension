import { NameType } from '@metamask/name-controller';
import { useSelector } from 'react-redux';
import { getMemoizedMetadataContract } from '../selectors';
import { getNftContractsByAddressOnCurrentChain } from '../selectors/nft';
import { useName } from './useName';
import { useFirstPartyContractName } from './useFirstPartyContractName';

/**
 * Attempts to resolve the name for the given parameters.
 *
 * @param value
 * @param type
 * @param preferContractSymbol - Applies to recognized contracts when no petname is saved:
 * If true the contract symbol (e.g. WBTC) will be used instead of the contract name.
 * @returns An object with two properties:
 * - `name` {string|null} - The display name, if it can be resolved, otherwise null.
 * - `hasPetname` {boolean} - True if there is a petname for the given address.
 */
export function useDisplayName(
  value: string,
  type: NameType,
  preferContractSymbol: boolean = false,
): { name: string | null; hasPetname: boolean } {
  const nameEntry = useName(value, type);

  const firstPartyContractName = useFirstPartyContractName(value, type);

  const contracInfo = useSelector((state) =>
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getMemoizedMetadataContract as any)(state, value),
  );

  const contractDisplayName =
    preferContractSymbol && contractInfo?.symbol
      ? contractInfo.symbol
      : contractInfo?.name;

  const watchedNftName = useSelector(getNftContractsByAddressOnCurrentChain)[
    value.toLowerCase()
  ]?.name;

  const name =
    nameEntry?.name ||
    firstPartyContractName ||
    contractDisplayName ||
    watchedNftName ||
    null;

  const hasPetname = Boolean(nameEntry?.name);

  return {
    name,
    hasPetname,
  };
}
