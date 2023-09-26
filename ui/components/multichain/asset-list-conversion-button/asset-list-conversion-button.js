import React from 'react';
import PropTypes from 'prop-types';

import { IconName, Box, IconSize, Icon, Text } from '../../component-library';
import {
  AlignItems,
  BorderRadius,
  Display,
} from '../../../helpers/constants/design-system';

import { useI18nContext } from '../../../hooks/useI18nContext';

const ASSET_LIST_CONVERSION_BUTTON_VARIANTS = {
  buy: {
    color: 'var(--color-info-default)',
    backgroundImage: 'url(/images/token-list-buy-background.png)',
    text: 'buy',
    icon: IconName.Add,
  },
  receive: {
    color: 'var(--color-flask-default)',
    backgroundImage: 'url(/images/token-list-receive-background.png)',
    text: 'receive',
    icon: IconName.Arrow2Down,
  },
};

export const AssetListConversionButton = ({ onClick, onClose, variant }) => {
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
        gap={2}
        className="asset-list-conversion-button__contents"
      >
        <Box
          display={Display.Flex}
          className="asset-list-conversion-button__contents__button-wrapper"
        >
          <Box paddingTop={1} paddingInlineStart={1}>
            <Icon name={icon} size={IconSize.Sm} style={{ color }} />
          </Box>
        </Box>
        <Text
          className="asset-list-conversion-button__contents__text"
          paddingInlineStart={1}
        >
          {t(text)}
        </Text>
      </Box>
      {onClose ? (
        <Box
          paddingInlineEnd={2}
          paddingTop={2}
          tabIndex="0"
          title={t('close')}
          className="asset-list-conversion-button__close"
        >
          <Icon
            name={IconName.Close}
            size={IconSize.Xs}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="asset-list-conversion-button__close-icon"
          />
        </Box>
      ) : null}
    </Box>
  );
};

AssetListConversionButton.propTypes = {
  /**
   * Executes when the button is clicked
   */
  onClick: PropTypes.func.isRequired,
  /**
   * Executes when the close button is clicked
   */
  onClose: PropTypes.func,
  /**
   * Text within the button body
   */
  variant: PropTypes.oneOf(['buy', 'receive', 'nft']),
};
