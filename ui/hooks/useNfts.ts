import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import { getNfts, getNftContracts } from '../ducks/metamask/metamask';
import { getSelectedInternalAccount } from '../selectors';
import { getCurrentChainId } from '../../shared/modules/selectors/networks';
import { usePrevious } from './usePrevious';
import { useI18nContext } from './useI18nContext';
import { NFT } from '../components/multichain/asset-picker-amount/asset-picker-modal/types';

export function useNfts() {
  const t = useI18nContext();
  const nfts = useSelector(getNfts);
  const { address: selectedAddress } = useSelector(getSelectedInternalAccount);
  const chainId = useSelector(getCurrentChainId);
  const nftContracts = useSelector(getNftContracts);

  const previouslyOwnedText = t('nftsPreviouslyOwned');
  const unknownCollectionText = t('unknownCollection');

  const [currentlyOwnedNfts, setCurrentlyOwnedNfts] = useState<NFT[]>([]);
  const [previouslyOwnedNfts, setPreviouslyOwnedNfts] = useState<NFT[]>([]);
  const [loading, setNftsLoading] = useState(() => nfts?.length >= 0);
  const prevNfts = usePrevious(nfts);
  const prevChainId = usePrevious(chainId);
  const prevSelectedAddress = usePrevious(selectedAddress);

  useEffect(() => {
    const selectNfts = () => {
      setNftsLoading(true);
      if (selectedAddress === undefined || chainId === undefined) {
        return;
      }

      const previousNfts: NFT[] = [];
      const currentNfts: NFT[] = [];

      nfts.forEach((nft: NFT) => {
        if (nft?.isCurrentlyOwned === false) {
          previousNfts.push(nft);
        } else {
          currentNfts.push(nft);
        }
      });
      setPreviouslyOwnedNfts(previousNfts);
      setCurrentlyOwnedNfts(currentNfts);
      setNftsLoading(false);
    };

    if (
      !isEqual(prevNfts, nfts) ||
      !isEqual(prevSelectedAddress, selectedAddress) ||
      !isEqual(prevChainId, chainId)
    ) {
      selectNfts();
    }
  }, [
    nfts,
    prevNfts,
    nftContracts,
    setNftsLoading,
    chainId,
    prevChainId,
    selectedAddress,
    prevSelectedAddress,
    previouslyOwnedText,
    unknownCollectionText,
  ]);

  return { loading, currentlyOwnedNfts, previouslyOwnedNfts };
}
