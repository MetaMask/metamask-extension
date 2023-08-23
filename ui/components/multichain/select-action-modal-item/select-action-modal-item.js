import React from 'react';
import PropTypes from 'prop-types';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FlexDirection,
  IconColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  AvatarIcon,
  AvatarIconSize,
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../component-library';

export const SelectActionModalItem = ({
  actionIcon,
  onClick,
  showIcon,
  primaryText,
  secondaryText,
}) => {
  return (
    <Box
      paddingTop={4}
      paddingBottom={4}
      gap={4}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      as="a"
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="select-action-modal-item"
      data-testid="select-action-modal-item"
    >
      <Box>
        <AvatarIcon
          iconName={actionIcon}
          color={IconColor.primaryInverse}
          backgroundColor={BackgroundColor.primaryDefault}
          size={AvatarIconSize.Md}
          className="select-action-modal-item__avatar"
        />
      </Box>
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          gap={2}
          alignItems={AlignItems.center}
        >
          <Text variant={TextVariant.bodyLgMedium}>{primaryText}</Text>
          {showIcon && (
            <Icon
              name={IconName.Export}
              size={IconSize.Xs}
              color={IconColor.iconAlternative}
            />
          )}
        </Box>
        <Text variant={TextVariant.bodyMd}>{secondaryText}</Text>
      </Box>
    </Box>
  );
};

SelectActionModalItem.propTypes = {
  /**
   * Show link icon with text
   */
  showIcon: PropTypes.bool,
  /**
   * onClick handler for each action
   */
  onClick: PropTypes.func,
  /**
   * Icon for each action Item
   */
  actionIcon: PropTypes.string,
  /**
   * Title for each action Item
   */
  primaryText: PropTypes.string,
  /**
   * Description for each action Item
   */
  secondaryText: PropTypes.string,
};
