import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { AvatarNetwork } from '../avatar-network';
import { Icon } from '../icon';
import { Text } from '../text';
import Box from 'ui/components/ui/box';

export const PickerNetwork = ({
  className,
  AccessoryComponentLeft = AvatarNetwork,
  leftAccessoryComponentProps,
  AccessoryComponentRight = Icon,
  rightAccessoryComponentProps,
  label,
  ...props
}) => {
  return (
    <Box className={classnames('mm-picker-network', className)} {...props}>
      <AccessoryComponentLeft {...leftAccessoryComponentProps} />
      <Text>{label}</Text>
      <AccessoryComponentRight {...rightAccessoryComponentProps} />
    </Box>
  );
};

PickerNetwork.propTypes = {
  /**
   * An additional className to apply to the PickerNetwork.
   */
  className: PropTypes.string,
  /**
   * The text content of the PickerNetwork component
   */
  label: PropTypes.string,
  /**
   * The component to be rendered in left side of the picker network
   */
  AccessoryComponentLeft: PropTypes.node,
  /**
   * The component to be rendered in right side of the picker network
   */
  AccessoryComponentRight: PropTypes.node,
  /**
   * PickerNetwork accepts all the props from Box
   */
  ...PickerNetwork.propTypes,
};
