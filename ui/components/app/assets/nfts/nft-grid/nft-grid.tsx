import React from 'react';
import { useHistory } from 'react-router-dom';
import { Display } from '../../../../../helpers/constants/design-system';
import { Box } from '../../../../component-library';
import Spinner from '../../../../ui/spinner';
import { getNftImageAlt } from '../../../../../helpers/utils/nfts';
import { NftItem } from '../../../../multichain/nft-item';
import { NFT } from '../../../../multichain/asset-picker-amount/asset-picker-modal/types';
import { ASSET_ROUTE } from '../../../../../helpers/constants/routes';
import {
  getCurrentNetwork,
  getNftIsStillFetchingIndication,
} from '../../../../../selectors';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { useNfts } from '../../../../../hooks/useNfts';

export default function NftGrid() {
  const history = useHistory();

  const currentChain = useSelector(getCurrentNetwork) as {
    chainId: Hex;
    nickname: string;
    rpcPrefs?: { imageUrl: string };
  };
  const nftsStillFetchingIndication = useSelector(
    getNftIsStillFetchingIndication,
  );

  const { currentlyOwnedNfts } = useNfts();

  return (
    <Box
      display={Display.Grid}
      gap={4}
      className="nft-items__wrapper"
      // style={{ outline: 'solid red 2px' }}
    >
      {currentlyOwnedNfts.map((nft: NFT, index: number) => {
        console.log('NFT: ', nft);
        const handleImageClick = () => {
          // if (isModal) {
          //   return onSendNft(nft);
          // }
          return history.push(
            `${ASSET_ROUTE}/${currentChain.chainId}/${nft.address}/${nft.tokenId}`,
          );
        };
        const { image, imageOriginal, tokenURI } = nft;
        const nftImageAlt = getNftImageAlt(nft);

        const isIpfsURL = (imageOriginal ?? image ?? tokenURI)?.startsWith(
          'ipfs:',
        );
        return (
          <Box
            data-testid="nft-wrapper"
            key={tokenURI}
            className="nft-items__image-wrapper"
          >
            <NftItem
              nft={nft}
              alt={nftImageAlt}
              src={image ?? ''}
              networkName={currentChain.nickname}
              networkSrc={currentChain.rpcPrefs?.imageUrl}
              onClick={handleImageClick}
              isIpfsURL={isIpfsURL}
              clickable
            />
          </Box>
        );
      })}
      {nftsStillFetchingIndication ? (
        <Box className="nfts-tab__fetching">
          <Spinner
            color="var(--color-warning-default)"
            className="loading-overlay__spinner"
          />
        </Box>
      ) : null}
    </Box>
  );
}
