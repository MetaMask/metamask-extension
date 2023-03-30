import React, { forwardRef, Ref } from 'react';
import classnames from 'classnames';
import Box from '../../ui/box';
import {
  FONT_WEIGHT,
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';
import { TextProps, ValidTag } from './text.types';

const getTextElementDefault = (variant: TextVariant) => {
  switch (variant) {
    case TextVariant.displayMd:
      return ValidTag.H1;
    case TextVariant.headingLg:
      return ValidTag.H2;
    case TextVariant.headingMd:
      return ValidTag.H3;
    case TextVariant.headingSm:
      return ValidTag.H4;
    case TextVariant.inherit:
      return ValidTag.Span;
    // TextVariant.bodyLgMedium, TextVariant.bodyMd, TextVariant.bodyMdBold, TextVariant.bodySm, TextVariant.bodySmBold, TextVariant.bodyXs use default 'p' tag
    default:
      return ValidTag.P;
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
  ref: Ref<HTMLElement> | null,
) {
  // Check if as is set otherwise set a default tag based on variant
  const Tag = as ?? getTextElementDefault(variant);
  let strongTagFontWeight;

  if (Tag === 'strong') {
    strongTagFontWeight = FONT_WEIGHT.BOLD;
  }

  const computedClassName = classnames(
    'mm-text',
    className,
    `mm-text--${variant}`,
    (strongTagFontWeight || fontWeight) &&
      `mm-text--font-weight-${strongTagFontWeight || fontWeight}`,
    {
      [`mm-text--font-style-${String(fontStyle)}`]: fontStyle,
      [`mm-text--ellipsis`]: ellipsis,
      [`mm-text--text-transform-${String(textTransform)}`]: textTransform,
      [`mm-text--text-align-${String(textAlign)}`]: textAlign,
      [`mm-text--overflow-wrap-${String(overflowWrap)}`]: overflowWrap,
    },
  );

  return (
    <Box
      className={classnames(computedClassName)}
      as={Tag}
      dir={textDirection}
      color={color}
      ref={ref || null}
      {...props}
    >
      {children}
    </Box>
  );
});
