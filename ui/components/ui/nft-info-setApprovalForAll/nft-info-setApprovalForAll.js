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
  isERC721,
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
          <NftCollectionImage
            assetName={assetName}
            tokenAddress={tokenAddress}
          />
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
        {isERC721 && (
          <Box marginTop={4}>
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
                      <i className="fa fa-exclamation-triangle" />{' '}
                      {t('beCareful')}
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
        )}
      </Box>
    </Box>
  );
}

NftInfoSetApprovalForAll.propTypes = {
  assetName: PropTypes.string,
  tokenAddress: PropTypes.string,
  total: PropTypes.number,
  isERC721: PropTypes.bool,
};
