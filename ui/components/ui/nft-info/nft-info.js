import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import Box from '../box';
import Typography from '../typography';
import {
  BackgroundColor,
  DISPLAY,
  FONT_WEIGHT,
  TextColor,
  TypographyVariant,
} from '../../../helpers/constants/design-system';
import Identicon from '../identicon';
import Button from '../button';

export default function NftInfo({ assetName, tokenAddress, tokenId }) {
  const t = useContext(I18nContext);

  return (
    <Box
      display={DISPLAY.FLEX}
      className="nft-info"
      backgroundColor={BackgroundColor.backgroundAlternative}
    >
      <Box display={DISPLAY.FLEX} className="nft-info__content">
        <Box margin={4}>
          <Identicon address={tokenAddress} diameter={24} />
        </Box>
        <Box>
          <Typography
            fontWeight={FONT_WEIGHT.BOLD}
            variant={TypographyVariant.H6}
            marginTop={4}
          >
            {assetName}
          </Typography>
          <Typography
            variant={TypographyVariant.H7}
            marginBottom={4}
            color={TextColor.textAlternative}
          >
            {t('tokenId')} #{tokenId}
          </Typography>
        </Box>
      </Box>
      <Box marginTop={4} marginRight={4}>
        <Button className="nft-info__button" type="link">
          <Typography
            variant={TypographyVariant.H6}
            marginTop={0}
            color={TextColor.primaryDefault}
          >
            {t('view')}
          </Typography>
        </Button>
      </Box>
    </Box>
  );
}

NftInfo.propTypes = {
  assetName: PropTypes.string,
  tokenAddress: PropTypes.string,
  tokenId: PropTypes.string,
};
