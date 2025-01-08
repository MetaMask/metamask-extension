import React from 'react';
import {
  Display,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { Box, Text } from '../../../../component-library';
import Spinner from '../../../../ui/spinner';
import { getNftImageAlt } from '../../../../../helpers/utils/nfts';
import { NftItem } from '../../../../multichain/nft-item';
import { NFT } from '../../../../multichain/asset-picker-amount/asset-picker-modal/types';
import {
  getCurrentNetwork,
  getNftIsStillFetchingIndication,
} from '../../../../../selectors';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export default function NftGrid({
  nfts,
  prevNfts,
  handleNftClick,
}: {
  nfts: NFT[];
  prevNfts: NFT[];
  handleNftClick: (nft: NFT) => void;
}) {
  const t = useI18nContext();
  const currentChain = useSelector(getCurrentNetwork) as {
    chainId: Hex;
    nickname: string;
    rpcPrefs?: { imageUrl: string };
  };
  const nftsStillFetchingIndication = useSelector(
    getNftIsStillFetchingIndication,
  );

  return (
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
              clickable
            />
          </Box>
        );
      })}
      <Text
        variant={TextVariant.headingSm}
        color={TextColor.textDefault}
        margin={2}
      >
        {t('nftsPreviouslyOwned')}
      </Text>
      {prevNfts.map((nft: NFT) => {
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
