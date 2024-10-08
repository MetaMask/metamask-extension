import React from 'react';

import { useSelector } from 'react-redux';

import { getIpfsGateway, getOpenSeaEnabled } from '../../../../../selectors';
import useGetAssetImageUrl from '../../../../../hooks/useGetAssetImageUrl';
import { Box } from '../../../../component-library';

export const CollectionImageComponent = ({
  collectionImage,
  collectionName,
}: {
  collectionImage: string;
  collectionName: string;
}) => {
  const ipfsGateway = useSelector(getIpfsGateway);
  const openSeaEnabled = useSelector(getOpenSeaEnabled);
  const nftImageURL = useGetAssetImageUrl(collectionImage, ipfsGateway);

  const renderCollectionImage = () => {
    if (collectionImage?.startsWith('ipfs') && !ipfsGateway) {
      return (
        <div className="nfts-items__collection-image-alt">
          {collectionName?.[0]?.toUpperCase() ?? null}
        </div>
      );
    }
    if (!openSeaEnabled && !collectionImage?.startsWith('ipfs')) {
      return (
        <div className="nfts-items__collection-image-alt">
          {collectionName?.[0]?.toUpperCase() ?? null}
        </div>
      );
    }

    if (collectionImage) {
      return (
        <img
          alt={collectionName}
          src={nftImageURL}
          className="nfts-items__collection-image"
        />
      );
    }
    return (
      <div className="nfts-items__collection-image-alt">
        {collectionName?.[0]?.toUpperCase() ?? null}
      </div>
    );
  };

  return <Box>{renderCollectionImage()}</Box>;
};
