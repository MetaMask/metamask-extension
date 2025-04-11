import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';

import { Color, TextAlign } from '../../../helpers/constants/design-system';
import { useNftsCollections } from '../../../hooks/useNftsCollections';
import { getTokenList } from '../../../selectors';
import Box from '../box';
import Identicon from '../identicon';

export default function NftCollectionImage({ assetName, tokenAddress }) {
  const { collections } = useNftsCollections();
  const tokenList = useSelector(getTokenList);
  const nftTokenListImage = tokenList[tokenAddress.toLowerCase()]?.iconUrl;

  const renderCollectionImageOrName = () => {
    const collection = Object.values(collections).find(
      ({ collectionName }) => collectionName === assetName,
    );

    if (collection?.collectionImage || nftTokenListImage) {
      return (
        <Identicon
          diameter={24}
          image={collection?.collectionImage || nftTokenListImage}
        />
      );
    }
    return (
      <Box
        color={Color.overlayInverse}
        textAlign={TextAlign.Center}
        className="collection-image-alt"
      >
        {assetName?.[0]?.toUpperCase() ?? null}
      </Box>
    );
  };

  return <Box>{renderCollectionImageOrName()}</Box>;
}

NftCollectionImage.propTypes = {
  assetName: PropTypes.string,
  tokenAddress: PropTypes.string,
};
