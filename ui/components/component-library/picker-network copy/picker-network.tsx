import React, { FC } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { AvatarNetworkProps, AvatarNetwork } from '../avatar-network';
import { IconName, Icon, IconSize } from '../icon';
import { Text } from '../text';
import Box, { BoxProps } from '../../ui/box';
import {
  AlignItems,
  DISPLAY,
  Size,
  BorderRadius,
  TextVariant,
  IconColor,
  BackgroundColor,
} from '../../../helpers/constants/design-system';

interface PickerNetworkProps extends BoxProps {
  src?: string;
  className?: string;
  avatarNetworkProps?: AvatarNetworkProps;
  iconProps?: object;
  label: string;
}

const PickerNetwork: FC<PickerNetworkProps> = ({
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
  src: PropTypes.string,
  className: PropTypes.string,
  avatarNetworkProps: PropTypes.shape<AvatarNetworkProps>(),
  iconProps: PropTypes.object,
  label: PropTypes.string.isRequired,
  ...Box.propTypes,
};

export default PickerNetwork;
