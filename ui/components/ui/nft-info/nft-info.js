import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import Box from '../box';
import Typography from '../typography';
import {
  COLORS,
  DISPLAY,
  FONT_WEIGHT,
  TYPOGRAPHY,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';
import Identicon from '../identicon';
import Button from '../button';
import { getTokenList } from '../../../selectors';

export default function NftInfo({
  collections = {},
  assetName,
  tokenId,
  tokenAddress,
  onView,
}) {
  const t = useContext(I18nContext);
  const tokenList = useSelector(getTokenList);
  const nftTokenListImage = tokenList[tokenAddress.toLowerCase()]?.iconUrl;
  let nftCollectionNameExist;
  let nftCollectionImageExist;

  Object.values(collections).forEach((nftCollections) => {
    if (nftCollections.collectionName === assetName) {
      nftCollectionNameExist = nftCollections.collectionName;
      nftCollectionImageExist = nftCollections.collectionImage;
    }
  });

  const renderCollectionImage = (collectionImage, collectionName, key) => {
    if (collectionImage) {
      return <Identicon diameter={24} image={collectionImage} />;
    }
    return (
      <Box
        key={key}
        color={COLORS.OVERLAY_INVERSE}
        textAlign={TEXT_ALIGN.CENTER}
        className="nft-info__collection-image-alt"
      >
        {collectionName?.[0]?.toUpperCase() ?? null}
      </Box>
    );
  };

  return (
    <Box
      display={DISPLAY.FLEX}
      className="nft-info"
      backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
    >
      <Box display={DISPLAY.FLEX} className="nft-info__content">
        <Box margin={4}>
          {Object.keys(collections).length > 0 && nftCollectionNameExist
            ? renderCollectionImage(
                nftCollectionImageExist,
                nftCollectionNameExist,
                tokenId,
              )
            : renderCollectionImage(nftTokenListImage, assetName, tokenId)}
        </Box>
        <Box>
          <Typography
            fontWeight={FONT_WEIGHT.BOLD}
            variant={TYPOGRAPHY.H6}
            marginTop={4}
          >
            {assetName}
          </Typography>
          <Typography
            variant={TYPOGRAPHY.H7}
            marginBottom={4}
            color={COLORS.TEXT_ALTERNATIVE}
          >
            {t('tokenId')} #{tokenId}
          </Typography>
        </Box>
      </Box>
      {Object.keys(collections).length > 0 && nftCollectionNameExist ? (
        <Box marginTop={4} marginRight={4}>
          <Button className="nft-info__button" type="link" onClick={onView}>
            <Typography
              variant={TYPOGRAPHY.H6}
              marginTop={0}
              color={COLORS.PRIMARY_DEFAULT}
            >
              {t('view')}
            </Typography>
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}

NftInfo.propTypes = {
  collections: PropTypes.shape({
    collectibles: PropTypes.arrayOf(
      PropTypes.shape({
        address: PropTypes.string.isRequired,
        tokenId: PropTypes.string.isRequired,
        name: PropTypes.string,
        description: PropTypes.string,
        image: PropTypes.string,
        standard: PropTypes.string,
        imageThumbnail: PropTypes.string,
        imagePreview: PropTypes.string,
        creator: PropTypes.shape({
          address: PropTypes.string,
          config: PropTypes.string,
          profile_img_url: PropTypes.string,
        }),
      }),
    ),
    collectionImage: PropTypes.string,
    collectionName: PropTypes.string,
  }),
  assetName: PropTypes.string,
  tokenAddress: PropTypes.string,
  tokenId: PropTypes.string,
  onView: PropTypes.func,
};
