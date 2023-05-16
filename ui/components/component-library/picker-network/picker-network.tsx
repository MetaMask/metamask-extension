import React, { FC } from 'react';
import classnames from 'classnames';
import { AvatarNetwork } from '../avatar-network';
import { Icon } from '../icon';
import { Text } from '../text';
import Box from '../../ui/box';
import {
  AlignItems,
  display,
  Size,
  BorderRadius,
  TextVariant,
  IconColor,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import { PickerNetworkProps } from './picker-network.types';

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

export default PickerNetwork;
