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
  TEXT_ALIGN,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';
import Identicon from '../identicon';

export default function NftInfo({ tokenName, tokenAddress, tokenId }) {
  const t = useContext(I18nContext);

  return (
    <Box
      display={DISPLAY.FLEX}
      className="nft-info"
      backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
    >
      <Box
        display={DISPLAY.FLEX}
        justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
        className="nft-info__content"
      >
        <Box margin={4}>
          <Identicon address={tokenAddress} diameter={24} />
        </Box>
        <Box>
          <Typography
            fontWeight={FONT_WEIGHT.BOLD}
            variant={TYPOGRAPHY.H6}
            marginTop={4}
            boxProps={{ display: DISPLAY.INLINE_BLOCK }}
          >
            {tokenName}
          </Typography>
          <Typography
            variant={TYPOGRAPHY.H7}
            display={DISPLAY.FLEX}
            marginBottom={4}
            color={COLORS.TEXT_ALTERNATIVE}
          >
            {t('tokenId')} #{tokenId}
          </Typography>
        </Box>
        <Box
          textAlign={TEXT_ALIGN.END}
          marginTop={4}
          marginRight={4}
          className="nft-info__content__view"
        >
          <button className="nft-info__content__view__button" type="link">
            {t('view')}
          </button>
        </Box>
      </Box>
    </Box>
  );
}

NftInfo.propTypes = {
  tokenName: PropTypes.string,
  tokenAddress: PropTypes.string,
  tokenId: PropTypes.string,
};
