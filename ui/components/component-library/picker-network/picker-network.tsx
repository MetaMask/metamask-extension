import React from 'react';
import classnames from 'classnames';
import {
  AlignItems,
  BorderRadius,
  TextVariant,
  IconColor,
  BackgroundColor,
  Display,
} from '../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  IconName,
  Icon,
  IconSize,
  Text,
} from '..';
import { BoxProps, PolymorphicRef } from '../box';
import {
  PickerNetworkComponent,
  PickerNetworkProps,
} from './picker-network.types';

export const PickerNetwork: PickerNetworkComponent = React.forwardRef(
  <C extends React.ElementType = 'button'>(
    {
      className = '',
      avatarNetworkProps,
      iconProps,
      label,
      labelProps,
      src,
      ...props
    }: PickerNetworkProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    return (
      <Box
        className={classnames('mm-picker-network', className)}
        ref={ref}
        as="button"
        backgroundColor={BackgroundColor.backgroundAlternative}
        alignItems={AlignItems.center}
        paddingLeft={2}
        paddingRight={4}
        gap={2}
        borderRadius={BorderRadius.pill}
        display={Display.Flex}
        {...(props as BoxProps<C>)}
      >
        <AvatarNetwork
          className="mm-picker-network__avatar-network"
          src={src}
          name={label}
          size={AvatarNetworkSize.Xs}
          {...avatarNetworkProps}
        />
        <Text as="span" ellipsis variant={TextVariant.bodySm} {...labelProps}>
          {label}
        </Text>
        <Icon
          className="mm-picker-network__arrow-down-icon"
          name={IconName.ArrowDown}
          color={IconColor.iconDefault}
          size={IconSize.Xs}
          marginLeft="auto"
          {...iconProps}
        />
      </Box>
    );
  },
);
