import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { AvatarNetwork } from '../avatar-network';
import { IconName, Icon, IconSize } from '../icon';
import { Text } from '../text';
import Box from '../../ui/box';
import {
  AlignItems,
  DISPLAY,
  Size,
  BorderRadius,
  TextVariant,
  IconColor,
  BackgroundColor,
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
      backgroundColor={BackgroundColor.backgroundAlternative}
      alignItems={AlignItems.center}
      paddingLeft={2}
      paddingRight={4}
      gap={2}
      borderRadius={BorderRadius.pill}
      display={DISPLAY.FLEX}
      {...props}
    >
      <AvatarNetwork
        className="mm-picker-network__avatar-network"
        src={src}
        name={label}
        size={Size.XS}
        {...avatarNetworkProps}
      />
      <Text ellipsis variant={TextVariant.bodySm}>
        {label}
      </Text>
      <Icon
        className="mm-picker-network__arrow-down-icon"
        name={IconName.ArrowDown}
        color={IconColor.iconDefault}
        size={IconSize.Xs}
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
  iconProps: PropTypes.object,
  /**
   * The text content of the PickerNetwork component
   */
  label: PropTypes.string.isRequired,
  /**
   * PickerNetwork accepts all the props from Box
   */
  ...Box.propTypes,
};
