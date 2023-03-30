import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import Box from '../box';
import { Color, TEXT_ALIGN } from '../../../helpers/constants/design-system';
import Identicon from '../identicon';
import { getTokenList } from '../../../selectors';
import { useNftsCollections } from '../../../hooks/useNftsCollections';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function NftCollectionImage({ assetName, tokenAddress }) {
  const t = useI18nContext();
  const { collections } = useNftsCollections(
    t('nftsPreviouslyOwned'),
    t('unknownCollection'),
  );
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
        textAlign={TEXT_ALIGN.CENTER}
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
