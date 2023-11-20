import React from 'react';
import PropTypes from 'prop-types';

import { Box, Icon, IconName, IconSize, Text } from '../../component-library';
import {
  AlignItems,
  BorderRadius,
  Display,
} from '../../../helpers/constants/design-system';

import { useI18nContext } from '../../../hooks/useI18nContext';

export const ASSET_LIST_CONVERSION_BUTTON_VARIANT_TYPES = {
  BUY: 'buy',
  RECEIVE: 'receive',
  NFT: 'nft',
};

const ASSET_LIST_CONVERSION_BUTTON_VARIANTS = {
  [ASSET_LIST_CONVERSION_BUTTON_VARIANT_TYPES.BUY]: {
    color: 'var(--color-info-default)',
    backgroundImage: 'url(/images/token-list-buy-background.png)',
    text: 'buy',
    icon: IconName.Add,
  },
  [ASSET_LIST_CONVERSION_BUTTON_VARIANT_TYPES.RECEIVE]: {
    color: 'var(--color-flask-default)',
    backgroundImage: 'url(/images/token-list-receive-background.png)',
    text: 'receive',
    icon: IconName.Arrow2Down,
  },
  [ASSET_LIST_CONVERSION_BUTTON_VARIANT_TYPES.NFT]: {
    color: 'var(--color-error-alternative)',
    backgroundImage: 'url(/images/token-list-nfts-background.png)',
    text: 'nftLearnMore',
    icon: IconName.Book,
  },
};

export const AssetListConversionButton = ({ onClick, variant }) => {
  const t = useI18nContext();
  const { color, backgroundImage, text, icon } =
    ASSET_LIST_CONVERSION_BUTTON_VARIANTS[variant];

  return (
    <Box
      as="button"
      onClick={onClick}
      className="asset-list-conversion-button"
      display={Display.Flex}
      alignItems={AlignItems.center}
      borderRadius={BorderRadius.LG}
      style={{ backgroundImage, backgroundColor: color }}
    >
      <Box
        display={Display.Flex}
        className="asset-list-conversion-button__contents"
      >
        <Box
          display={Display.Flex}
          className="asset-list-conversion-button__contents__button-wrapper"
          borderRadius={BorderRadius.full}
        >
          <Box paddingTop={1} paddingInlineStart={1}>
            <Icon name={icon} size={IconSize.Sm} style={{ color }} />
          </Box>
        </Box>
        <Text
          className="asset-list-conversion-button__contents__text"
          paddingInlineStart={2}
        >
          {t(text)}
        </Text>
      </Box>
    </Box>
  );
};

AssetListConversionButton.propTypes = {
  /**
   * Executes when the button is clicked
   */
  onClick: PropTypes.func.isRequired,
  /**
   * Text within the button body
   */
  variant: PropTypes.oneOf(
    Object.values(ASSET_LIST_CONVERSION_BUTTON_VARIANT_TYPES),
  ),
};
