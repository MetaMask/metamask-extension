import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import Box from '../box';
import {
  BackgroundColor,
  DISPLAY,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import Identicon from '../identicon';
import Button from '../button';
import { Text } from '../../component-library';

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
          <Text variant={TextVariant.bodySmBold} as="h6" marginTop={4}>
            {assetName}
          </Text>
          <Text
            variant={TextVariant.bodySm}
            as="h6"
            marginBottom={4}
            color={TextColor.textAlternative}
          >
            {t('tokenId')} #{tokenId}
          </Text>
        </Box>
      </Box>
      <Box marginTop={4} marginRight={4}>
        <Button className="nft-info__button" type="link">
          <Text
            variant={TextVariant.bodySm}
            as="h6"
            marginTop={0}
            color={TextColor.primaryDefault}
          >
            {t('view')}
          </Text>
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
