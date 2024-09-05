import React from 'react';
import classnames from 'classnames';

import {
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';

import { Box } from '..';

import type { PolymorphicRef, BoxProps } from '../box';

import { TextProps, TextComponent } from './text.types';

const getTextElementDefault = (variant: TextVariant) => {
  switch (variant) {
    case TextVariant.displayMd:
      return 'h1';
    case TextVariant.headingLg:
      return 'h2';
    case TextVariant.headingMd:
      return 'h3';
    case TextVariant.headingSm:
      return 'h4';
    case TextVariant.inherit:
      return 'span';
    // TextVariant.bodyLgMedium, TextVariant.bodyMd, TextVariant.bodyMdBold, TextVariant.bodySm, TextVariant.bodySmBold, TextVariant.bodyXs use default 'p' tag
    default:
      return 'p';
  }
};

export const Text: TextComponent = React.forwardRef(
  <C extends React.ElementType = 'p'>(
    {
      variant = TextVariant.bodyMd,
      fontWeight,
      fontStyle,
      textTransform,
      textAlign,
      textDirection,
      overflowWrap,
      ellipsis,
      className = '',
      children,
      isBrandEvolution, // Enables Brand Evolution Typography do not use unless you are working on the brand evolution
      ...props
    }: TextProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    // Set tag based on variant
    // If as prop is passed tag will be overridden
    const tag = getTextElementDefault(variant);
    const computedClassName = classnames(
      'mm-text',
      className,
      `mm-text--${variant}`,
      {
        [`mm-text--font-weight-${fontWeight}`]: Boolean(fontWeight),
        [`mm-text--font-style-${fontStyle}`]: Boolean(fontStyle),
        [`mm-text--ellipsis`]: Boolean(ellipsis),
        [`mm-text--text-transform-${textTransform}`]: Boolean(textTransform),
        [`mm-text--text-align-${textAlign}`]: Boolean(textAlign),
        [`mm-text--overflow-wrap-${overflowWrap}`]: Boolean(overflowWrap),
        [`mm-text--${variant}-brand-evo`]: Boolean(isBrandEvolution),
      },
    );

    return (
      <Box
        className={classnames(computedClassName)}
        as={tag}
        dir={textDirection}
        ref={ref}
        color={TextColor.textDefault}
        {...(props as BoxProps<C>)}
      >
        {children}
      </Box>
    );
  },
);
