import { NftContract } from '@metamask/assets-controllers';
import { createSelector } from 'reselect';
import { CaipChainId, Hex } from '@metamask/utils';
import { getMemoizedCurrentChainId } from './selectors';
import { NetworkState } from './networks';

type NftState = {
  metamask: {
    allNftContracts: {
      [account: string]: {
        [chainId: Hex | CaipChainId]: NftContract[];
      };
    };
  };
};

type AddressToContractMap = {
  [address: string]: NftContract;
};

type ChainToContractsMap = {
  [chainId: Hex | CaipChainId]: AddressToContractMap;
};

function getNftContractsByChainByAccount(state: NftState) {
  return state.metamask.allNftContracts ?? {};
}

export const getNftContractsByAddressByChain = createSelector(
  getNftContractsByChainByAccount,
  (nftContractsByChainByAccount) => {
    const contractMap: ChainToContractsMap = {};

    for (const chainContracts of Object.values(nftContractsByChainByAccount)) {
      for (const [chainId, contracts] of Object.entries(chainContracts)) {
        const chainIdKey = chainId as Hex | CaipChainId;
        if (!contractMap[chainIdKey]) {
          contractMap[chainIdKey] = {};
        }

        contracts.forEach((contract) => {
          contractMap[chainIdKey][contract.address.toLowerCase()] = contract;
        });
      }
    }

    return contractMap;
  },
);

export const getNftContractsByAddressOnCurrentChain = createSelector(
  (state: NftState & NetworkState) => getMemoizedCurrentChainId(state),
  getNftContractsByAddressByChain,
  (currentChainId, nftContractsByAddressByChain): AddressToContractMap => {
    return nftContractsByAddressByChain[currentChainId] ?? {};
  },
);
