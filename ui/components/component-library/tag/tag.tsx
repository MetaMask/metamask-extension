import React, { Ref, forwardRef } from 'react';
import classnames from 'classnames';
import Box from '../../ui/box/box';
import { Text } from '../text';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  DISPLAY,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';

import { TagProps } from './tag.types';

export const Tag = forwardRef(
  (
    { label, className = '', labelProps, ...props }: TagProps,
    ref: Ref<HTMLElement>,
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
        display={DISPLAY.INLINE_BLOCK}
        {...props}
      >
        <Text variant={TextVariant.bodySm} {...labelProps}>
          {label}
        </Text>
      </Box>
    );
  },
);
