import { useMemo } from 'react';
import { NameType } from '@metamask/name-controller';
import { useSelector } from 'react-redux';
import { getRemoteTokens } from '../selectors';
import { getNftContractsByAddressOnCurrentChain } from '../selectors/nft';
import { useNames } from './useName';
import { useFirstPartyContractNames } from './useFirstPartyContractName';
import { useNftCollectionsMetadata } from './useNftCollectionsMetadata';

export type UseDisplayNameRequest = {
  value: string;
  preferContractSymbol?: boolean;
  type: NameType;
};

export type UseDisplayNameResponse = {
  name: string | null;
  hasPetname: boolean;
  contractDisplayName?: string;
  image?: string;
};

export function useDisplayNames(
  requests: UseDisplayNameRequest[],
): UseDisplayNameResponse[] {
  const nameRequests = useMemo(
    () => requests.map(({ value, type }) => ({ value, type })),
    [requests],
  );

  const nameEntries = useNames(nameRequests);
  const firstPartyContractNames = useFirstPartyContractNames(nameRequests);
  const nftCollections = useNftCollectionsMetadata(nameRequests);
  const values = requests.map(({ value }) => value);

  const contractInfo = useSelector((state) =>
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getRemoteTokens as any)(state, values),
  );

  const watchedNftNames = useSelector(getNftContractsByAddressOnCurrentChain);

  return requests.map(({ value, preferContractSymbol }, index) => {
    const nameEntry = nameEntries[index];
    const firstPartyContractName = firstPartyContractNames[index];
    const singleContractInfo = contractInfo[index];
    const watchedNftName = watchedNftNames[value.toLowerCase()]?.name;
    const nftCollectionProperties = nftCollections[value.toLowerCase()];

    let nftCollectionName;
    let nftCollectionImage;

    if (nftCollectionProperties?.isSpam === false) {
      nftCollectionName = nftCollectionProperties?.name;
      nftCollectionImage = nftCollectionProperties?.image;
    }

    const contractDisplayName =
      preferContractSymbol && singleContractInfo?.symbol
        ? singleContractInfo.symbol
        : singleContractInfo?.name;

    const name =
      nameEntry?.name ||
      firstPartyContractName ||
      nftCollectionName ||
      contractDisplayName ||
      watchedNftName ||
      null;

    const hasPetname = Boolean(nameEntry?.name);

    return {
      name,
      hasPetname,
      contractDisplayName,
      image: nftCollectionImage,
    };
  });
}

/**
 * Attempts to resolve the name for the given parameters.
 *
 * @param value - The address or contract address to resolve.
 * @param type - The type of value, e.g. NameType.ETHEREUM_ADDRESS.
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
  return useDisplayNames([{ preferContractSymbol, type, value }])[0];
}
