import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { AvatarNetwork } from '../avatar-network';
import { Icon } from '../icon';
import { Text } from '../text';
import Box from '../../ui/box';
import {
  ALIGN_ITEMS,
  COLORS,
  DISPLAY,
} from '../../../helpers/constants/design-system';

export const PickerNetwork = ({
  className,
  avatarNetworkProps,
  fallbackIconProps,
  label,
  ...props
}) => {
  return (
    <Box
      className={classnames('mm-picker-network', className)}
      backgroundColor={COLORS.BACKGROUND_DEFAULT}
      alignItems={ALIGN_ITEMS.CENTER}
      paddingLeft={1}
      paddingRight={1}
      display={DISPLAY.FLEX}
      {...props}
    >
      <AvatarNetwork {...avatarNetworkProps} />
      <Text>{label}</Text>
      <Icon {...fallbackIconProps} />
    </Box>
  );
};

PickerNetwork.propTypes = {
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
  fallbackIconProps: PropTypes.shape(Icon.PropTypes),
  /**
   * The text content of the TagUrl component
   */
  label: PropTypes.string.isRequired,
  /**
   * PickerNetwork accepts all the props from Box
   */
  ...Box.propTypes,
};
