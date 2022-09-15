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
import Identicon from '../identicon';
import Tooltip from '../tooltip/tooltip';
import Button from '../button';

export default function NftInfoSetApprovalForAll({
  tokenName,
  tokenAddress,
  nftNumber,
}) {
  const t = useContext(I18nContext);

  return (
    <Box
      display={DISPLAY.FLEX}
      className="nft-info"
      backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
    >
      <Box display={DISPLAY.FLEX} className="nft-info__content">
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
              <Identicon address={tokenAddress} diameter={24} />
            </Box>
            <Typography
              variant={TYPOGRAPHY.H5}
              display={DISPLAY.FLEX}
              color={COLORS.TEXT_ALTERNATIVE}
              marginLeft={2}
              marginTop={0}
            >
              {tokenName}
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
                  className="nft-info__content__tooltip"
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
              <i className="fa fa-exclamation-triangle  nft-info__content__tooltip__icon" />
            </Tooltip>
            <Typography
              variant={TYPOGRAPHY.H5}
              display={DISPLAY.FLEX}
              color={COLORS.TEXT_ALTERNATIVE}
              marginTop={0}
              marginLeft={2}
            >
              {t('numberOfNFTsFromCollection', [nftNumber])}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box marginTop={4} marginRight={4}>
        <Button className="nft-info__button" type="link">
          <Typography
            variant={TYPOGRAPHY.H6}
            marginTop={0}
            color={COLORS.PRIMARY_DEFAULT}
          >
            {t('view')}
          </Typography>
        </Button>
      </Box>
    </Box>
  );
}

NftInfoSetApprovalForAll.propTypes = {
  tokenName: PropTypes.string,
  tokenAddress: PropTypes.string,
  nftNumber: PropTypes.number,
};
