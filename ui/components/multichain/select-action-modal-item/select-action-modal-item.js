import React from 'react';
import PropTypes from 'prop-types';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  TextAlign,
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
  disabled,
  ...props
}) => {
  if (disabled) {
    return null;
  }
  return (
    <Box
      padding={4}
      gap={4}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      as="button"
      backgroundColor={BackgroundColor.transparent}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="select-action-modal-item"
      data-testid="select-action-modal-item"
      width={BlockSize.Full}
      {...props}
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
          <Text variant={TextVariant.bodyLgMedium} textAlign={TextAlign.Left}>
            {primaryText}
          </Text>
          {showIcon && (
            <Icon
              name={IconName.Export}
              size={IconSize.Xs}
              color={IconColor.iconAlternative}
            />
          )}
        </Box>
        <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Left}>
          {secondaryText}
        </Text>
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
  onClick: PropTypes.func.isRequired,
  /**
   * Icon for each action Item
   */
  actionIcon: PropTypes.string.isRequired,
  /**
   * Title for each action Item
   */
  primaryText: PropTypes.string.isRequired,
  /**
   * Description for each action Item
   */
  secondaryText: PropTypes.string.isRequired,
  /**
   * Disable bridge and swap for selected networks
   */
  disabled: PropTypes.bool,
};
