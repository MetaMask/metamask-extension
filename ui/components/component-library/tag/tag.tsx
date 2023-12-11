import React from 'react';
import classnames from 'classnames';
import { Box, Icon, IconSize, Text } from '..';
import type { BoxProps, PolymorphicRef } from '../box';

import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  TextVariant,
} from '../../../helpers/constants/design-system';

import { TagComponent, TagProps } from './tag.types';

export const Tag: TagComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      label,
      className = '',
      labelProps,
      startIconName,
      startIconProps,
      ...props
    }: TagProps<C>,
    ref: PolymorphicRef<C>,
  ) => {
    return (
      <Box
        ref={ref}
        className={classnames('mm-tag', className)}
        backgroundColor={BackgroundColor.backgroundDefault}
        borderColor={BorderColor.borderDefault}
        borderWidth={1}
        alignItems={AlignItems.center}
        paddingLeft={1}
        paddingRight={1}
        gap={1}
        borderRadius={BorderRadius.pill}
        display={Display.Flex}
        {...(props as BoxProps<C>)}
      >
        {startIconName ? (
          <Icon name={startIconName} size={IconSize.Xs} {...startIconProps} />
        ) : null}
        <Text variant={TextVariant.bodySm} {...labelProps}>
          {label}
        </Text>
      </Box>
    );
  },
);
