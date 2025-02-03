import { NameType } from '@metamask/name-controller';
import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import {
  EXPERIENCES_TYPE,
  FIRST_PARTY_CONTRACT_NAMES,
} from '../../shared/constants/first-party-contracts';
import { toChecksumHexAddress } from '../../shared/modules/hexstring-utils';
import { getDomainResolutions } from '../ducks/domains';
import { selectERC20TokensByChain } from '../selectors';
import { getNftContractsByAddressByChain } from '../selectors/nft';
import { useNames } from './useName';
import { useNftCollectionsMetadata } from './useNftCollectionsMetadata';

export type UseDisplayNameRequest = {
  preferContractSymbol?: boolean;
  type: NameType;
  value: string;
  variation: string;
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
  const nameEntries = useNames(requests);
  const firstPartyContractNames = useFirstPartyContractNames(requests);

  const erc20Tokens = useERC20Tokens(requests);
  const watchedNFTNames = useWatchedNFTNames(requests);
  const nfts = useNFTs(requests);
  const ens = useDomainResolutions(requests);

  return requests.map((_request, index) => {
    const nameEntry = nameEntries[index];
    const firstPartyContractName = firstPartyContractNames[index];
    const erc20Token = erc20Tokens[index];
    const watchedNftName = watchedNFTNames[index];
    const nft = nfts[index];
    const ensName = ens[index];

    const name =
      nameEntry?.name ||
      firstPartyContractName ||
      nft?.name ||
      erc20Token?.name ||
      watchedNftName ||
      ensName ||
      null;

    const image = nft?.image || erc20Token?.image;

    const hasPetname = Boolean(nameEntry?.name);

    return {
      name,
      hasPetname,
      contractDisplayName: erc20Token?.name,
      image,
    };
  });
}

export function useDisplayName(
  request: UseDisplayNameRequest,
): UseDisplayNameResponse {
  return useDisplayNames([request])[0];
}

function useERC20Tokens(
  nameRequests: UseDisplayNameRequest[],
): ({ name?: string; image?: string } | undefined)[] {
  const erc20TokensByChain = useSelector(selectERC20TokensByChain);

  return nameRequests.map(
    ({ preferContractSymbol, type, value, variation }) => {
      if (type !== NameType.ETHEREUM_ADDRESS) {
        return undefined;
      }

      const contractAddress = value.toLowerCase();

      const {
        iconUrl: image,
        name: tokenName,
        symbol,
      } = erc20TokensByChain?.[variation]?.data?.[contractAddress] ?? {};

      const name = preferContractSymbol && symbol ? symbol : tokenName;

      return { name, image };
    },
  );
}

function useWatchedNFTNames(
  nameRequests: UseDisplayNameRequest[],
): (string | undefined)[] {
  const watchedNftNamesByAddressByChain = useSelector(
    getNftContractsByAddressByChain,
  );

  return nameRequests.map(({ type, value, variation }) => {
    if (type !== NameType.ETHEREUM_ADDRESS) {
      return undefined;
    }

    const contractAddress = value.toLowerCase();
    const watchedNftNamesByAddress = watchedNftNamesByAddressByChain[variation];

    return watchedNftNamesByAddress?.[contractAddress]?.name;
  });
}

function useNFTs(
  nameRequests: UseDisplayNameRequest[],
): ({ name?: string; image?: string } | undefined)[] {
  const requests = nameRequests
    .filter(({ type }) => type === NameType.ETHEREUM_ADDRESS)
    .map(({ value, variation }) => ({
      chainId: variation,
      contractAddress: value,
    }));

  const nftCollectionsByAddressByChain = useNftCollectionsMetadata(requests);

  return nameRequests.map(
    ({ type, value: contractAddress, variation: chainId }) => {
      if (type !== NameType.ETHEREUM_ADDRESS) {
        return undefined;
      }

      const nftCollectionProperties =
        nftCollectionsByAddressByChain[chainId]?.[
          contractAddress.toLowerCase()
        ];

      const isSpam = nftCollectionProperties?.isSpam !== false;

      if (!nftCollectionProperties || isSpam) {
        return undefined;
      }

      const { name, image } = nftCollectionProperties;

      return { name, image };
    },
  );
}

function useDomainResolutions(nameRequests: UseDisplayNameRequest[]) {
  const domainResolutions = useSelector(getDomainResolutions);

  return nameRequests.map(({ type, value }) => {
    if (type !== NameType.ETHEREUM_ADDRESS) {
      return undefined;
    }

    const matchedResolution = domainResolutions?.find(
      (resolution: {
        addressBookEntryName: string;
        domainName: string;
        protocol: string;
        resolvedAddress: string;
        resolvingSnap: string;
      }) =>
        toChecksumHexAddress(resolution.resolvedAddress) ===
        toChecksumHexAddress(value),
    );

    const ensName = matchedResolution?.domainName;

    return ensName;
  });
}

function useFirstPartyContractNames(nameRequests: UseDisplayNameRequest[]) {
  return nameRequests.map(({ type, value, variation }) => {
    if (type !== NameType.ETHEREUM_ADDRESS) {
      return undefined;
    }

    const normalizedContractAddress = value.toLowerCase();

    const contractNames = Object.keys(
      FIRST_PARTY_CONTRACT_NAMES,
    ) as EXPERIENCES_TYPE[];

    return contractNames.find((contractName) => {
      const currentContractAddress =
        FIRST_PARTY_CONTRACT_NAMES[contractName]?.[variation as Hex];

      return (
        currentContractAddress?.toLowerCase() === normalizedContractAddress
      );
    });
  });
}
