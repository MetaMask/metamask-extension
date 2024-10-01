import { Nft, NftContract } from '@metamask/assets-controllers';
import { createSelector } from 'reselect';
import { getMemoizedCurrentChainId } from './selectors';

type NftState = {
  metamask: {
    allNftContracts: {
      [account: string]: {
        [chainId: string]: NftContract[];
      };
    };
    allNfts: {
      [account: string]: {
        [chainId: string]: Nft[];
      };
    };
  };
};

function getNftContractsByChainByAccount(state: NftState) {
  return state.metamask.allNftContracts ?? {};
}

function getNftsByChainByAccount(state: NftState) {
  return state.metamask.allNfts ?? {};
}

export const getNftContractsByAddressByChain = createSelector(
  getNftContractsByChainByAccount,
  (nftContractsByChainByAccount) => {
    const userAccounts = Object.keys(nftContractsByChainByAccount);

    const allNftContracts = userAccounts
      .map((account) =>
        Object.keys(nftContractsByChainByAccount[account]).map((chainId) =>
          nftContractsByChainByAccount[account][chainId].map((contract) => ({
            ...contract,
            chainId,
          })),
        ),
      )
      .flat()
      .flat();

    return allNftContracts.reduce((acc, contract) => {
      const { chainId, ...data } = contract;

      const chainIdContracts = acc[chainId] ?? {};
      acc[chainId] = chainIdContracts;

      chainIdContracts[data.address.toLowerCase()] = data;

      return acc;
    }, {} as { [chainId: string]: { [address: string]: NftContract } });
  },
);

export const getNftContractsByAddressOnCurrentChain = createSelector(
  getNftContractsByAddressByChain,
  getMemoizedCurrentChainId,
  (nftContractsByAddressByChain, currentChainId) => {
    return nftContractsByAddressByChain[currentChainId] ?? {};
  },
);

export const selectAllNftsFlat = createSelector(
  getNftsByChainByAccount,
  (nftsByChainByAccount) => {
    const nftsByChainArray = Object.values(nftsByChainByAccount);
    return nftsByChainArray.reduce((acc, nftsByChain) => {
      const nftsArrays = Object.values(nftsByChain);
      return acc.concat(...nftsArrays);
    }, [] as Nft[]);
  },
);
