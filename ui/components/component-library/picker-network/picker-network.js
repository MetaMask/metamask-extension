import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { AvatarNetwork } from '../avatar-network';
import { Icon, ICON_NAMES } from '../icon';
import { Text } from '../text';
import Box from '../../ui/box';
import {
  ALIGN_ITEMS,
  COLORS,
  DISPLAY,
  SIZES,
  BORDER_RADIUS,
  TEXT,
} from '../../../helpers/constants/design-system';

export const PickerNetwork = ({
  className,
  avatarNetworkProps,
  iconProps,
  label,
  src,
  ...props
}) => {
  return (
    <Box
      className={classnames('mm-picker-network', className)}
      as="button"
      backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
      alignItems={ALIGN_ITEMS.CENTER}
      paddingLeft={2}
      paddingRight={4}
      gap={2}
      borderRadius={BORDER_RADIUS.PILL}
      display={DISPLAY.FLEX}
      {...props}
    >
      <AvatarNetwork
        className="mm-picker-network__avatar-network"
        src={src}
        name={label}
        size={SIZES.XS}
        {...avatarNetworkProps}
      />
      <Text ellipsis variant={TEXT.BODY_SM}>
        {label}
      </Text>
      <Icon
        className="mm-picker-network__arrow-down-icon"
        name={ICON_NAMES.ARROW_DOWN}
        color={COLORS.ICON_DEFAULT}
        size={SIZES.XS}
        {...iconProps}
      />
    </Box>
  );
};

PickerNetwork.propTypes = {
  /**
   * The src accepts the string of the image to be rendered
   */
  src: PropTypes.string,
  /**
   * An additional className to apply to the PickerNetwork.
   */
  className: PropTypes.string,
  /**
   * It accepts all the props from AvatarNetwork
   */
  avatarNetworkProps: PropTypes.shape(AvatarNetwork.PropTypes),
  /**
   * It accepts all the props from Icon
   */
  iconProps: PropTypes.shape(Icon.PropTypes),
  /**
   * The text content of the PickerNetwork component
   */
  label: PropTypes.string.isRequired,
  /**
   * PickerNetwork accepts all the props from Box
   */
  ...Box.propTypes,
};
