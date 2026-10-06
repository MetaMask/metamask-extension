import React from 'react';
import classnames from 'clsx';
import {
  AlignItems,
  BorderRadius,
  TextVariant,
  IconColor,
  BackgroundColor,
  Display,
} from '../../../helpers/constants/design-system';
import { Text } from '../text/text';
import { Box } from '../box/box';
import { BoxProps, PolymorphicRef } from '../box/box.types';
import { AvatarGroup } from '../../multichain/avatar-group/avatar-group';
import { AvatarNetwork } from '../avatar-network/avatar-network';
import { AvatarNetworkSize } from '../avatar-network/avatar-network.types';
import { Icon } from '../icon/icon';
import { IconName, IconSize } from '../icon/icon.types';
import {
  PickerNetworkComponent,
  PickerNetworkProps,
} from './picker-network.types';

export const PickerNetwork: PickerNetworkComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'button'>(
    {
      className = '',
      avatarGroupProps,
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
        paddingRight={2}
        gap={2}
        borderRadius={BorderRadius.pill}
        display={Display.Flex}
        {...(props as BoxProps<C>)}
      >
        {avatarGroupProps ? (
          <AvatarGroup {...avatarGroupProps} isTagOverlay={true} />
        ) : (
          <AvatarNetwork
            className="mm-picker-network__avatar-network"
            src={src}
            name={label}
            size={AvatarNetworkSize.Xs}
            {...avatarNetworkProps}
          />
        )}

        <Text ellipsis variant={TextVariant.bodySm} {...labelProps}>
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
