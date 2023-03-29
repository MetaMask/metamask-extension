import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import Box from '../box';
import {
  Text,
  Icon,
  ICON_NAMES,
  ICON_SIZES,
  AvatarIcon,
} from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  IconColor,
  TextColor,
  DISPLAY,
  TextVariant,
  BLOCK_SIZES,
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
      className="nft-info-set-approve-for-all"
      backgroundColor={BackgroundColor.backgroundAlternative}
      padding={4}
    >
      <Text variant={TextVariant.bodyMdBold} as="h6" marginBottom={1}>
        {t('nftCollectionName')}:
      </Text>
      <Box
        display={DISPLAY.FLEX}
        alignItems={AlignItems.center}
        marginBottom={4}
      >
        <NftCollectionImage assetName={assetName} tokenAddress={tokenAddress} />
        <Text
          variant={TextVariant.bodyLgMedium}
          display={DISPLAY.FLEX}
          color={TextColor.textAlternative}
          marginLeft={2}
          as="h5"
        >
          {assetName ?? t('unknownCollection')}
        </Text>
      </Box>
      <Box>
        <Text variant={TextVariant.bodyMdBold} as="h6" marginBottom={1}>
          {t('numberOfNfts')}:
        </Text>
        <Box display={DISPLAY.FLEX} alignItems={AlignItems.center}>
          <Tooltip
            interactive
            position="top"
            html={
              <Text
                variant={TextVariant.bodySm}
                display={DISPLAY.INLINE_BLOCK}
                color={TextColor.textAlternative}
                className="nft-info-set-approve-for-all__tooltip"
                as="h6"
              >
                {t('nftInfoTooltipText', [
                  <Text
                    key="nft-tooltip-text"
                    variant={TextVariant.bodySmBold}
                    display={DISPLAY.INLINE_BLOCK}
                    color={TextColor.errorDefault}
                    width={BLOCK_SIZES.FULL}
                    as="h6"
                  >
                    <Icon
                      name={ICON_NAMES.DANGER}
                      size={ICON_SIZES.AUTO}
                      marginRight={1}
                    />{' '}
                    {t('beCareful')}
                  </Text>,
                ])}
              </Text>
            }
          >
            <AvatarIcon
              iconName={ICON_NAMES.DANGER}
              size={ICON_SIZES.SM}
              color={IconColor.errorDefault}
              backgroundColor={BackgroundColor.errorMuted}
              className="nft-info-set-approve-for-all__tooltip__icon"
            />
          </Tooltip>
          <Text
            variant={TextVariant.bodyLgMedium}
            color={TextColor.textAlternative}
            marginLeft={2}
            as="h5"
          >
            {t('numberOfNFTsFromCollection', [isERC721 ? `(${total})` : ''])}
          </Text>
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
