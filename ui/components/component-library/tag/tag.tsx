import React from 'react';
import classnames from 'classnames';
import { Box, Icon, IconName, IconSize, Text } from '..';
import type { BoxProps, PolymorphicRef } from '../box';

import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';

import { TagComponent, TagProps } from './tag.types';

export const Tag: TagComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      label,
      className = '',
      labelProps,
      iconName,
      iconProps,
      ...props
    }: TagProps<C>,
    ref: PolymorphicRef<C>,
  ) => {
    /**
     * Guard that checks if the icon comes from the meta mask icon set
     *
     * @param name - The name of the icon
     */
    function isMetaMaskIcon(name: string): name is IconName {
      return Object.values(IconName).includes(name as IconName);
    }

    return (
      <Box
        ref={ref}
        className={classnames('mm-tag', className)}
        backgroundColor={BackgroundColor.backgroundDefault}
        borderColor={BorderColor.borderDefault}
        borderWidth={1}
        alignItems={AlignItems.center}
        paddingTop={2}
        paddingBottom={2}
        paddingLeft={4}
        paddingRight={4}
        gap={2}
        borderRadius={BorderRadius.pill}
        display={Display.Flex}
        {...(props as BoxProps<C>)}
      >
        {iconName && isMetaMaskIcon(iconName) ? (
          <Icon
            name={iconName}
            size={IconSize.Xs}
            display={Display.Flex}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
            {...iconProps}
          />
        ) : null}
        {/* {iconName && !isMetaMaskIcon(iconName) ? (*/}
        {/*  <SnapAvatar snapId={snapId} />*/}
        {/* ) : null}*/}
        <Text variant={TextVariant.bodySm} {...labelProps}>
          {label}
        </Text>
      </Box>
    );
  },
);
