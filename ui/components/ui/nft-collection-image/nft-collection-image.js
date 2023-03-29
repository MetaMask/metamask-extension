import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { BorderColor } from '../../../helpers/constants/design-system';
import { getTokenList } from '../../../selectors';
import { useNftsCollections } from '../../../hooks/useNftsCollections';
import { AvatarToken, AVATAR_TOKEN_SIZES } from '../../component-library';

export default function NftCollectionImage({ assetName, tokenAddress }) {
  const { collections } = useNftsCollections();
  const tokenList = useSelector(getTokenList);
  const nftTokenListImage = tokenList[tokenAddress.toLowerCase()]?.iconUrl;

  const collection = Object.values(collections).find(
    ({ collectionName }) => collectionName === assetName,
  );

  return (
    <AvatarToken
      borderColor={
        collection?.collectionImage || nftTokenListImage
          ? BorderColor.transparent
          : BorderColor.borderDefault
      }
      src={collection?.collectionImage || nftTokenListImage}
      name={assetName?.[0]?.toUpperCase() ?? null}
      size={AVATAR_TOKEN_SIZES.SM}
    />
  );
}

NftCollectionImage.propTypes = {
  /**
   * The name of the asset
   */
  assetName: PropTypes.string,
  /**
   * The address of the token
   */
  tokenAddress: PropTypes.string,
};
