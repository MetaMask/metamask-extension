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
import { Text } from '../../component-library';
import NftCollectionImage from '../nft-collection-image/nft-collection-image';

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
          <NftCollectionImage
            assetName={assetName}
            tokenAddress={tokenAddress}
          />
        </Box>
        <Box>
          <Text variant={TextVariant.bodyMdBold} marginTop={4} as="h6">
            {assetName ?? t('unknownCollection')}
          </Text>
          <Text
            variant={TextVariant.bodySm}
            marginBottom={4}
            color={TextColor.textAlternative}
            as="h6"
          >
            {`${t('tokenId')} #${tokenId}`}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

NftInfo.propTypes = {
  assetName: PropTypes.string,
  tokenAddress: PropTypes.string,
  tokenId: PropTypes.string,
};
