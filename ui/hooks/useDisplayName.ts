import { NameType } from '@metamask/name-controller';
import { useSelector } from 'react-redux';
import { getMemoizedMetadataContracts } from '../selectors';
import { getNftContractsByAddressOnCurrentChain } from '../selectors/nft';
import { useNames } from './useName';
import { useFirstPartyContractNames } from './useFirstPartyContractName';

export type UseDisplayNameRequest = {
  value: string;
  type: NameType;
  preferContractSymbol?: boolean;
};

export type UseDisplayNameResponse = {
  name: string | null;
  hasPetname: boolean;
  contractDisplayName?: string;
};

export function useDisplayNames(
  requests: UseDisplayNameRequest[],
): UseDisplayNameResponse[] {
  const nameRequests = requests.map(({ value, type }) => ({
    value,
    type,
  }));

  const nameEntries = useNames(nameRequests);
  const firstPartyContractNames = useFirstPartyContractNames(nameRequests);
  const values = requests.map(({ value }) => value);

  const contractInfo = useSelector((state) =>
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getMemoizedMetadataContracts as any)(state, values, true),
  );

  const watchedNftNames = useSelector(getNftContractsByAddressOnCurrentChain);

  return requests.map(({ value, preferContractSymbol }, index) => {
    const nameEntry = nameEntries[index];
    const firstPartyContractName = firstPartyContractNames[index];
    const singleContractInfo = contractInfo[index];
    const watchedNftName = watchedNftNames[value.toLowerCase()]?.name;

    const contractDisplayName =
      preferContractSymbol && singleContractInfo?.symbol
        ? singleContractInfo.symbol
        : singleContractInfo?.name;

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
      contractDisplayName,
    };
  });
}

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
): UseDisplayNameResponse {
  return useDisplayNames([{ value, type, preferContractSymbol }])[0];
}
