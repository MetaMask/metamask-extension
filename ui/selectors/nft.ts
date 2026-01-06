import { Nft, NftContract } from '@metamask/assets-controllers';
import { createSelector } from 'reselect';
import { NetworkState } from '../../shared/modules/selectors/networks';
import { getMemoizedCurrentChainId } from './selectors';
import { EMPTY_OBJECT } from './shared';

export type NftState = {
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

// TODO Unified Assets Controller State Access
// NftController: allNftContracts
// References
// ui/selectors/nft.ts (2)
function getNftContractsByChainByAccount(state: NftState) {
  return state.metamask.allNftContracts ?? EMPTY_OBJECT;
}

// TODO Unified Assets Controller State Access
// NftController: allNfts
// References
// ui/selectors/nft.ts (2)
// ui/pages/confirmations/hooks/send/useSendNfts.ts (1)
/**
 * Get all NFTs owned by the user.
 *
 * @param state - Metamask state.
 * @returns All NFTs owned by the user, keyed by chain ID then account address.
 */
export function getNftsByChainByAccount(state: NftState) {
  return state.metamask.allNfts ?? EMPTY_OBJECT;
}

// TODO Unified Assets Controller State Access Second Layer
// Uses: getNftContractsByChainByAccount
// References
// ui/selectors/nft.ts (1)
// ui/hooks/useDisplayName.ts (1)
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

    return allNftContracts.reduce(
      (acc, contract) => {
        const { chainId, ...data } = contract;

        const chainIdContracts = acc[chainId] ?? {};
        acc[chainId] = chainIdContracts;

        chainIdContracts[data.address.toLowerCase()] = data;

        return acc;
      },
      {} as { [chainId: string]: { [address: string]: NftContract } },
    );
  },
);

export const getNftContractsByAddressOnCurrentChain = createSelector(
  (state: NftState & NetworkState) => getMemoizedCurrentChainId(state),
  getNftContractsByAddressByChain,
  (currentChainId, nftContractsByAddressByChain) => {
    return nftContractsByAddressByChain[currentChainId] ?? {};
  },
);

// TODO Unified Assets Controller State Access Second Layer
// Uses: getNftsByChainByAccount
// References
// ui/selectors/nft.ts (1)
// ui/helpers/utils/tags.ts (1)
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
