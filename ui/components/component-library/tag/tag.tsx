import React from 'react';
import classnames from 'classnames';
import { Text, Box } from '..';
import type { PolymorphicRef, BoxProps } from '../box';

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
    { label, className = '', labelProps, ...props }: TagProps<C>,
    ref: PolymorphicRef<C>,
  ) => {
    return (
      <Box
        ref={ref}
        className={classnames('mm-tag', className)}
        backgroundColor={BackgroundColor.backgroundDefault}
        borderColor={BorderColor.borderDefault}
        borderWidth={1}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        paddingLeft={1}
        paddingRight={1}
        borderRadius={BorderRadius.pill}
        display={Display.InlineBlock}
        {...(props as BoxProps<C>)}
      >
        <Text variant={TextVariant.bodySm} {...labelProps}>
          {label}
        </Text>
      </Box>
    );
  },
);
