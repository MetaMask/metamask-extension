import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toHex } from '@metamask/controller-utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import { Box } from '../../../../component-library';
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
import { useScrollContainer } from '../../../../../contexts/scroll-container';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { isWebUrl } from '../../../../../../app/scripts/lib/util';
import PulseLoader from '../../../../ui/pulse-loader';
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
      networkName={allNetworks?.[toHex(nft?.chainId ?? '')]?.name}
      networkSrc={getImageForChainId(toHex(nft?.chainId ?? '')) || undefined}
      onClick={onClick}
      isIpfsURL={isIpfsURL}
      privacyMode={privacyMode}
      clickable
    />
  );
};

// Breakpoint matches design-system $screen-md-max (768px - 1px)
const SCREEN_MD_MAX = 767;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function NftGrid({
  nfts,
  handleNftClick,
  privacyMode,
}: {
  nfts: NFT[];
  handleNftClick: (nft: NFT) => void;
  privacyMode?: boolean;
}) {
  const scrollContainerRef = useScrollContainer();
  const nftsStillFetchingIndication = useSelector(
    getNftIsStillFetchingIndication,
  );

  // Detect screen size to match CSS Grid column count
  // 4 columns for large screens, 3 columns for medium and below
  const [itemsPerRow, setItemsPerRow] = useState(() =>
    window.innerWidth > SCREEN_MD_MAX ? 4 : 3,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${SCREEN_MD_MAX}px)`);

    const handleResize = (e: MediaQueryListEvent) => {
      setItemsPerRow(e.matches ? 3 : 4);
    };

    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  // Group NFTs into rows for virtualization
  const nftRows = useMemo(() => {
    const rows: NFT[][] = [];
    for (let i = 0; i < nfts.length; i += itemsPerRow) {
      rows.push(nfts.slice(i, i + itemsPerRow));
    }
    return rows;
  }, [nfts, itemsPerRow]);

  const virtualizer = useVirtualizer({
    count: nftRows.length,
    getScrollElement: () => scrollContainerRef?.current || null,
    estimateSize: () => 200,
    overscan: 5,
  });

  // Disable virtualization when scroll container is not available (e.g., in tests)
  // or when there are few NFTs (no performance benefit)
  const shouldDisableVirtualization =
    !scrollContainerRef?.current || nfts.length <= 20;

  return (
    <Box style={{ margin: 16 }}>
      {shouldDisableVirtualization ? (
        <Box display={Display.Grid} gap={4} className="nft-items__wrapper">
          {nfts.map((nft: NFT, index: number) => {
            return (
              <NFTGridItemErrorBoundary key={index} fallback={() => null}>
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
      ) : (
        <div
          className="relative w-full"
          style={{
            height: `${virtualizer.getTotalSize()}px`,
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const rowNfts = nftRows[virtualRow.index];
            return (
              <div
                key={virtualRow.index}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                  paddingBottom: '16px',
                }}
              >
                <Box
                  display={Display.Grid}
                  gap={4}
                  className="nft-items__wrapper"
                >
                  {rowNfts.map((nft, index) => (
                    <NFTGridItemErrorBoundary
                      key={`${virtualRow.index}-${index}`}
                      fallback={() => null}
                    >
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
                  ))}
                </Box>
              </div>
            );
          })}
        </div>
      )}
      {nftsStillFetchingIndication ? (
        <Box
          className="nfts-tab__fetching"
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          display={Display.Flex}
          marginTop={4}
        >
          <Box marginTop={4} marginBottom={4}>
            <PulseLoader />
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
