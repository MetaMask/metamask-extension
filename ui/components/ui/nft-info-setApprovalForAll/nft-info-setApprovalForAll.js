import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import Box from '../box';
import Typography from '../typography';
import {
  COLORS,
  DISPLAY,
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import Tooltip from '../tooltip/tooltip';
import NftCollectionImage from '../nft-collection-image/nft-collection-image';

export default function NftInfoSetApprovalForAll({
  assetName,
  tokenAddress,
  total,
  collections = {},
}) {
  const t = useContext(I18nContext);

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
            <NftCollectionImage
              assetName={assetName}
              tokenAddress={tokenAddress}
              collections={collections}
            />
          </Box>
          <Typography
            variant={TYPOGRAPHY.H5}
            display={DISPLAY.FLEX}
            color={COLORS.TEXT_ALTERNATIVE}
            marginLeft={2}
            marginTop={0}
          >
            {assetName ?? t('unknownCollection')}
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
