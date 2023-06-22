import React, { forwardRef, Ref } from 'react';
import classnames from 'classnames';
import Box from '../../ui/box';
import {
  FontWeight,
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';
import { TextProps } from './text.types';

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

export const Text = forwardRef(function Text(
  {
    variant = TextVariant.bodyMd,
    color = TextColor.textDefault,
    fontWeight,
    fontStyle,
    textTransform,
    textAlign,
    textDirection,
    overflowWrap,
    ellipsis,
    as,
    className = '',
    children,
    ...props
  }: TextProps,
  ref: Ref<HTMLElement>,
) {
  // Check if as is set otherwise set a default tag based on variant
  const Tag = as ?? getTextElementDefault(variant);
  let strongTagFontWeight;

  if (Tag === 'strong') {
    strongTagFontWeight = FontWeight.Bold;
  }

  const computedClassName = classnames(
    'mm-text',
    className,
    `mm-text--${variant}`,
    {
      [`mm-text--font-weight-${strongTagFontWeight || fontWeight}`]: Boolean(
        strongTagFontWeight || fontWeight,
      ),
      [`mm-text--font-style-${String(fontStyle)}`]: Boolean(fontStyle),
      [`mm-text--ellipsis`]: Boolean(ellipsis),
      [`mm-text--text-transform-${String(textTransform)}`]:
        Boolean(textTransform),
      [`mm-text--text-align-${String(textAlign)}`]: Boolean(textAlign),
      [`mm-text--overflow-wrap-${String(overflowWrap)}`]: Boolean(overflowWrap),
    },
  );

  return (
    <Box
      className={classnames(computedClassName)}
      as={Tag}
      dir={textDirection}
      color={color}
      ref={ref}
      {...props}
    >
      {children}
    </Box>
  );
});
