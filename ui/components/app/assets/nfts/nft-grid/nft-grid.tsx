import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { toHex } from '@metamask/controller-utils';
import { Box } from '../../../../component-library';
import { getNftImageAlt, getNftImage } from '../../../../../helpers/utils/nfts';
import { NftItem } from '../../../../multichain/nft-item';
import { NFT } from '../../../../multichain/asset-picker-amount/asset-picker-modal/types';
import { getIpfsGateway } from '../../../../../selectors';
import useGetAssetImageUrl from '../../../../../hooks/useGetAssetImageUrl';
import { getImageForChainId } from '../../../../../selectors/multichain';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/lib/selectors/networks';
import useFetchNftDetailsFromTokenURI from '../../../../../hooks/useFetchNftDetailsFromTokenURI';
// TODO: Remove restricted import
// eslint-disable-next-line import-x/no-restricted-paths
import { isWebUrl } from '../../../../../../app/scripts/lib/util';
import {
  VirtualizedList,
  noAdjustmentsScroll,
} from '../../../../ui/virtualized-list/virtualized-list';
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

    (image && isWebUrl(image)) ||
    (imageFromTokenURI && isWebUrl(imageFromTokenURI));
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880

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

// Container width threshold for switching between 3 and 4 columns
const CONTAINER_WIDTH_THRESHOLD = 640;
const ESTIMATED_ROW_SIZE = 172;

function extractRowKey(row: NFT[], index: number) {
  return (
    row
      .map((nft) => `${nft.chainId}-${nft.address}-${nft.tokenId}`)
      .join('|') || String(index)
  );
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860

export default function NftGrid({
  nfts,
  handleNftClick,
  privacyMode,
}: {
  nfts: NFT[];
  handleNftClick: (nft: NFT) => void;
  privacyMode?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect container width for virtualization grouping only
  const [itemsPerRow, setItemsPerRow] = useState(3);

  useEffect(() => {
    if (process.env.IN_TEST) {
      return;
    }

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const containerWidth = entry.contentRect.width;
        setItemsPerRow(containerWidth > CONTAINER_WIDTH_THRESHOLD ? 4 : 3);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Group NFTs into rows for virtualization
  const nftRows = useMemo(() => {
    const rows: NFT[][] = [];
    for (let i = 0; i < nfts.length; i += itemsPerRow) {
      rows.push(nfts.slice(i, i + itemsPerRow));
    }
    return rows;
  }, [nfts, itemsPerRow]);

  const gridClassName = itemsPerRow === 4 ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <Box ref={containerRef} style={{ margin: 16 }}>
      <VirtualizedList
        data={nftRows}
        estimatedItemSize={ESTIMATED_ROW_SIZE}
        scrollToFn={noAdjustmentsScroll}
        keyExtractor={extractRowKey}
        renderItem={({ item, index: rowIndex }) => (
          <Box className={`grid gap-4 pb-4 ${gridClassName}`}>
            {item.map((nft, index) => (
              <NFTGridItemErrorBoundary
                key={`${rowIndex}-${index}`}
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
        )}
      />
    </Box>
  );
}
