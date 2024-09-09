import React, { useEffect, useState } from 'react';

import { useSelector } from 'react-redux';

import Box from '../../../../ui/box';

import { getIpfsGateway, getOpenSeaEnabled } from '../../../../../selectors';
import { getAssetImageURL } from '../../../../../helpers/utils/util';

export const CollectionImageComponent = ({
  collectionImage,
  collectionName,
}: {
  collectionImage: string;
  collectionName: string;
}) => {
  const ipfsGateway = useSelector(getIpfsGateway);
  const openSeaEnabled = useSelector(getOpenSeaEnabled);
  const [nftImageURL, setAssetImageUrl] = useState<string>('');

  useEffect(() => {
    const getAssetImageUrl = async () => {
      const assetImageUrl = await getAssetImageURL(
        collectionImage,
        ipfsGateway,
      );
      setAssetImageUrl(assetImageUrl);
    };

    getAssetImageUrl();
  }, []);

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
