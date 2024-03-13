import { NftContract } from '@metamask/assets-controllers';
import { createSelector } from 'reselect';
import { getMemoizedCurrentChainId } from '.';

type NftState = {
  metamask: {
    allNftContracts: {
      [account: string]: {
        [chainId: string]: NftContract[];
      };
    };
  };
};

function getNftContractsByChainByAccount(state: NftState) {
  return state.metamask.allNftContracts ?? {};
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
