import { NameType } from '@metamask/name-controller';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { getCurrentChainId, getRemoteTokenList } from '../selectors';
import { getNftContractsByAddressByChain } from '../selectors/nft';
import {
  EXPERIENCES_TYPE,
  FIRST_PARTY_CONTRACT_NAMES,
} from '../../shared/constants/first-party-contracts';
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
  const erc20TokenNames = useERC20TokenNames(requests);
  const watchedNFTNames = useWatchedNFTNames(requests);
  const nfts = useNFTs(requests);

  return requests.map((_request, index) => {
    const nameEntry = nameEntries[index];
    const firstPartyContractName = firstPartyContractNames[index];
    const erc20TokenName = erc20TokenNames[index];
    const watchedNftName = watchedNFTNames[index];
    const nft = nfts[index];

    const name =
      nameEntry?.name ||
      firstPartyContractName ||
      nft?.name ||
      erc20TokenName ||
      watchedNftName ||
      null;

    const hasPetname = Boolean(nameEntry?.name);

    return {
      name,
      hasPetname,
      contractDisplayName: erc20TokenName,
      image: nft?.image,
    };
  });
}

export function useDisplayName(
  request: UseDisplayNameRequest,
): UseDisplayNameResponse {
  return useDisplayNames([request])[0];
}

function useERC20TokenNames(
  nameRequests: UseDisplayNameRequest[],
): (string | undefined)[] {
  const remoteTokenList = useSelector(getRemoteTokenList);

  // TODO: Remove once `TokenListController` provides token data on multiple chains simultaneously.
  const globalChainId = useSelector(getCurrentChainId);

  return nameRequests.map(
    ({ preferContractSymbol, type, value, variation }) => {
      if (type !== NameType.ETHEREUM_ADDRESS || variation !== globalChainId) {
        return undefined;
      }

      const contractAddress = value.toLowerCase();
      const { symbol, name } = remoteTokenList[contractAddress] ?? {};

      return preferContractSymbol && symbol ? symbol : name;
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
