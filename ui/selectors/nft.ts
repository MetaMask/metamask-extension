import { Nft, NftContract } from '@metamask/assets-controllers';
import { getKnownPropertyNames } from '@metamask/utils';
import { createSelector } from 'reselect';
import { MetaMaskReduxState } from '../store/store';
import { getMemoizedCurrentChainId } from './selectors';

function getNftContractsByChainByAccount(state: MetaMaskReduxState) {
  return state.metamask.NftController.allNftContracts ?? {};
}

/**
 * Get all NFTs owned by the user.
 *
 * @param state - Metamask state.
 * @returns All NFTs owned by the user, keyed by chain ID then account address.
 */
function getNftsByChainByAccount(state: MetaMaskReduxState) {
  return state.metamask.NftController.allNfts ?? {};
}

export const getNftContractsByAddressByChain = createSelector(
  getNftContractsByChainByAccount,
  (nftContractsByChainByAccount) => {
    const userAccounts = Object.keys(nftContractsByChainByAccount);

    const allNftContracts = userAccounts
      .map((account) =>
        getKnownPropertyNames(nftContractsByChainByAccount[account]).map(
          (chainId) =>
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
  (state: MetaMaskReduxState) => getMemoizedCurrentChainId(state),
  getNftContractsByAddressByChain,
  (currentChainId, nftContractsByAddressByChain) => {
    return nftContractsByAddressByChain[currentChainId] ?? {};
  },
);

/**
 * Get a flattened list of all NFTs owned by the user.
 * Includes all NFTs from all chains and accounts.
 *
 * @param state - Metamask state.
 * @returns All NFTs owned by the user in a single array.
 */
export const selectAllNftsFlat = createSelector(
  getNftsByChainByAccount,
  (nftsByChainByAccount) => {
    const nftsByChainArray = Object.values(nftsByChainByAccount);
    return nftsByChainArray.reduce<Nft[]>((acc, nftsByChain) => {
      const nftsArrays = Object.values(nftsByChain);
      return acc.concat(...nftsArrays);
    }, []);
  },
);
