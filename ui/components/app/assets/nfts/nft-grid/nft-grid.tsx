import React from 'react';
import { useSelector } from 'react-redux';
import { toHex } from '@metamask/controller-utils';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import { Box } from '../../../../component-library';
import Spinner from '../../../../ui/spinner';
import { getNftImageAlt, getNftImage } from '../../../../../helpers/utils/nfts';
import { NftItem } from '../../../../multichain/nft-item';
import { NFT } from '../../../../multichain/asset-picker-amount/asset-picker-modal/types';
import {
  getIpfsGateway,
  getNftIsStillFetchingIndication,
} from '../../../../../selectors';
import useGetAssetImageUrl from '../../../../../hooks/useGetAssetImageUrl';
import { getImageForChainId } from '../../../../../selectors/multichain';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';
import useFetchNftDetailsFromTokenURI from '../../../../../hooks/useFetchNftDetailsFromTokenURI';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { isWebUrl } from '../../../../../../app/scripts/lib/util';
import NFTGridItemErrorBoundary from './nft-grid-item-error-boundary';

const NFTGridItem = (props: {
  nft: NFT;
  onClick: () => void;
  privacyMode?: boolean;
}) => {
  const { nft, onClick, privacyMode } = props;

  const { image: _image, imageOriginal, tokenURI } = nft;
  const { image: imageFromTokenURI } = useFetchNftDetailsFromTokenURI(tokenURI);
  const image = getNftImage(_image);

  const ipfsGateway = useSelector(getIpfsGateway);
  const nftImageURL = useGetAssetImageUrl(
    imageOriginal ?? image ?? undefined,
    ipfsGateway,
  );
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);

  const isImageHosted =
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    (image && isWebUrl(image)) ||
    (imageFromTokenURI && isWebUrl(imageFromTokenURI));
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const nftItemSrc = isImageHosted ? image || imageFromTokenURI : nftImageURL;

  const nftImageAlt = getNftImageAlt(nft);

  const nftSrcUrl = imageOriginal ?? image;
  const isIpfsURL = nftSrcUrl?.startsWith('ipfs:');

  return (
    <NftItem
      nft={nft}
      alt={nftImageAlt}
      src={nftItemSrc}
      networkName={allNetworks?.[toHex(nft.chainId)]?.name}
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      networkSrc={getImageForChainId(toHex(nft.chainId)) || undefined}
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
  const nftsStillFetchingIndication = useSelector(
    getNftIsStillFetchingIndication,
  );

  return (
    <Box style={{ margin: 16 }}>
      <Box display={Display.Grid} gap={4} className="nft-items__wrapper">
        {nfts.map((nft: NFT) => {
          const { tokenURI } = nft;

          return (
            <NFTGridItemErrorBoundary key={tokenURI} fallback={() => null}>
              <Box
                data-testid="nft-wrapper"
                className="nft-items__image-wrapper"
              >
                <NFTGridItem
                  nft={nft}
                  onClick={() => handleNftClick(nft)}
                  privacyMode={privacyMode}
                />
              </Box>
            </NFTGridItemErrorBoundary>
          );
        })}
      </Box>
      {nftsStillFetchingIndication ? (
        <Box
          className="nfts-tab__fetching"
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          display={Display.Flex}
          marginTop={4}
        >
          <Spinner
            color="var(--color-warning-default)"
            className="loading-overlay__spinner"
          />
        </Box>
      ) : null}
    </Box>
  );
}
