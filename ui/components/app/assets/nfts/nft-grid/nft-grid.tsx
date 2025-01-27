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
  getNftIsStillFetchingIndication,
} from '../../../../../selectors';

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
                onClick={() => handleNftClick(nft)}
                isIpfsURL={isIpfsURL}
                privacyMode={privacyMode}
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
    </Box>
  );
}
