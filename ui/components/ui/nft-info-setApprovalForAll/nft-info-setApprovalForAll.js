import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
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
import Tooltip from '../tooltip/tooltip';
import { getTokenList } from '../../../selectors';

export default function NftInfoSetApprovalForAll({
  assetName,
  tokenAddress,
  total,
  collections = {},
}) {
  const t = useContext(I18nContext);
  const tokenList = useSelector(getTokenList);

  const nftTokenListImage = tokenList[tokenAddress.toLowerCase()]?.iconUrl;
  const collectionsKeys = Object.keys(collections);
  const nftCollectionName = collectionsKeys.map((key) => {
    const { collectionName } = collections[key];
    return collectionName;
  });

  const nftCollectionImage = collectionsKeys.map((key) => {
    const { collectionImage } = collections[key];
    return collectionImage;
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
        className="nft-info-setApproveForAll__collection-image-alt"
      >
        {collectionName?.[0]?.toUpperCase() ?? null}
      </Box>
    );
  };

  return (
    <Box
      display={DISPLAY.FLEX}
      className="nft-info-setApproveForAll"
      backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
    >
      <Box marginTop={4} marginBottom={4} marginLeft={4}>
        <Typography
          fontWeight={FONT_WEIGHT.BOLD}
          variant={TYPOGRAPHY.H6}
          marginTop={0}
        >
          {t('nftCollectionName')}:
        </Typography>
        <Box display={DISPLAY.FLEX}>
          <Box marginBottom={4}>
            {Object.keys(collections).length > 0 &&
            nftCollectionName === assetName
              ? renderCollectionImage(nftCollectionName, nftCollectionImage)
              : renderCollectionImage(nftTokenListImage, assetName)}
          </Box>
          <Typography
            variant={TYPOGRAPHY.H5}
            display={DISPLAY.FLEX}
            color={COLORS.TEXT_ALTERNATIVE}
            marginLeft={2}
            marginTop={0}
          >
            {assetName}
          </Typography>
        </Box>
        <Typography
          fontWeight={FONT_WEIGHT.BOLD}
          variant={TYPOGRAPHY.H6}
          marginTop={0}
        >
          {t('numberOfNfts')}:
        </Typography>
        <Box display={DISPLAY.FLEX}>
          <Tooltip
            position="top"
            html={
              <Typography
                variant={TYPOGRAPHY.H7}
                color={COLORS.TEXT_ALTERNATIVE}
                className="nft-info-setApproveForAll__tooltip"
              >
                <Typography
                  variant={TYPOGRAPHY.H7}
                  fontWeight={FONT_WEIGHT.BOLD}
                  color={COLORS.ERROR_DEFAULT}
                >
                  <i className="fa fa-exclamation-triangle" /> {t('beCareful')}
                </Typography>
                {t('nftInfoTooltipText')}
              </Typography>
            }
          >
            <i className="fa fa-exclamation-triangle nft-info-setApproveForAll__tooltip__icon" />
          </Tooltip>
          <Typography
            variant={TYPOGRAPHY.H5}
            display={DISPLAY.FLEX}
            color={COLORS.TEXT_ALTERNATIVE}
            marginTop={0}
            marginLeft={2}
          >
            {t('numberOfNFTsFromCollection', [total])}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

NftInfoSetApprovalForAll.propTypes = {
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
  total: PropTypes.number,
};
