import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import Box from '../box';
import { Text, Icon, ICON_NAMES, ICON_SIZES } from '../../component-library';
import {
  BackgroundColor,
  Color,
  DISPLAY,
  TextVariant,
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
      backgroundColor={BackgroundColor.backgroundAlternative}
    >
      <Box marginTop={4} marginBottom={4} marginLeft={4}>
        <Text variant={TextVariant.bodyMdBold} as="h6">
          {t('nftCollectionName')}:
        </Text>
        <Box display={DISPLAY.FLEX} marginTop={1}>
          <NftCollectionImage
            assetName={assetName}
            tokenAddress={tokenAddress}
          />
          <Text
            variant={TextVariant.bodyLgMedium}
            display={DISPLAY.FLEX}
            color={Color.textAlternative}
            marginLeft={2}
            as="h5"
          >
            {assetName ?? t('unknownCollection')}
          </Text>
        </Box>
        <Box marginTop={4}>
          <Text variant={TextVariant.bodyMdBold} as="h6">
            {t('numberOfNfts')}:
          </Text>
          <Box display={DISPLAY.FLEX}>
            <Tooltip
              interactive
              position="top"
              html={
                <Text
                  variant={TextVariant.bodySm}
                  display={DISPLAY.INLINE_BLOCK}
                  color={Color.textAlternative}
                  className="nft-info-setApproveForAll__tooltip"
                  as="h6"
                >
                  {t('nftInfoTooltipText', [
                    <Text
                      key="nft-tooltip-text"
                      variant={TextVariant.bodySmBold}
                      display={DISPLAY.INLINE_BLOCK}
                      color={Color.errorDefault}
                      className="nft-info-setApproveForAll__tooltip__title"
                      as="h6"
                    >
                      <Icon name={ICON_NAMES.DANGER} size={ICON_SIZES.AUTO} />{' '}
                      {t('beCareful')}
                    </Text>,
                  ])}
                </Text>
              }
            >
              <Icon
                name={ICON_NAMES.DANGER}
                className="nft-info-setApproveForAll__tooltip__icon"
                size={ICON_SIZES.MD}
              />
            </Tooltip>
            <Text
              variant={TextVariant.bodyLgMedium}
              display={DISPLAY.FLEX}
              color={Color.textAlternative}
              marginTop={1}
              marginLeft={2}
              as="h5"
            >
              {t('numberOfNFTsFromCollection', [isERC721 ? `(${total})` : ''])}
            </Text>
          </Box>
        </Box>
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
