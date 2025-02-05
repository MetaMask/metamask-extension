import React from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { Display } from '../../../../../helpers/constants/design-system';
import { Box } from '../../../../component-library';
import Spinner from '../../../../ui/spinner';
import { getNftImageAlt } from '../../../../../helpers/utils/nfts';
import { NftItem } from '../../../../multichain/nft-item';
import { NFT } from '../../../../multichain/asset-picker-amount/asset-picker-modal/types';
import {
  getCurrentNetwork,
  getIpfsGateway,
  getNftIsStillFetchingIndication,
} from '../../../../../selectors';
import useGetAssetImageUrl from '../../../../../hooks/useGetAssetImageUrl';

const NFTGridItem = (props: {
  nft: NFT;
  onClick: () => void;
  privacyMode?: boolean;
  currentChain: {
    chainId: Hex;
    nickname: string;
    rpcPrefs?: {
      imageUrl: string;
    };
  };
}) => {
  const { nft, onClick, privacyMode, currentChain } = props;

  const { image, imageOriginal } = nft;

  const ipfsGateway = useSelector(getIpfsGateway);
  const nftImageURL = useGetAssetImageUrl(
    imageOriginal ?? image ?? undefined,
    ipfsGateway,
  );

  const isImageHosted =
    image?.startsWith('https:') || image?.startsWith('http:');
  const nftItemSrc = isImageHosted ? image : nftImageURL;

  const nftImageAlt = getNftImageAlt(nft);

  const nftSrcUrl = imageOriginal ?? image;
  const isIpfsURL = nftSrcUrl?.startsWith('ipfs:');

  return (
    <NftItem
      nft={nft}
      alt={nftImageAlt}
      src={nftItemSrc}
      networkName={currentChain.nickname}
      networkSrc={currentChain.rpcPrefs?.imageUrl}
      onClick={onClick}
      isIpfsURL={isIpfsURL}
      privacyMode={privacyMode}
      clickable
    />
  );
};

export default function NftGrid({
  nfts,
  handleNftClick,
  privacyMode,
}: {
  nfts: NFT[];
  handleNftClick: (nft: NFT) => void;
  privacyMode?: boolean;
}) {
  const currentChain = useSelector(getCurrentNetwork) as {
    chainId: Hex;
    nickname: string;
    rpcPrefs?: { imageUrl: string };
  };
  const nftsStillFetchingIndication = useSelector(
    getNftIsStillFetchingIndication,
  );

  return (
    <Box style={{ margin: 16 }}>
      <Box display={Display.Grid} gap={4} className="nft-items__wrapper">
        {nfts.map((nft: NFT) => {
          const { tokenURI } = nft;

          return (
            <Box
              data-testid="nft-wrapper"
              key={tokenURI}
              className="nft-items__image-wrapper"
            >
              <NFTGridItem
                currentChain={currentChain}
                nft={nft}
                onClick={() => handleNftClick(nft)}
                privacyMode={privacyMode}
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
    </Box>
  );
}
