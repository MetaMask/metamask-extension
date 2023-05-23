import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import Box from '../../../ui/box';
import {
  FONT_WEIGHT,
  FONT_STYLE,
  TextVariant,
  TextAlign,
  TEXT_TRANSFORM,
  OVERFLOW_WRAP,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { TEXT_DIRECTIONS } from './text.constants';

export const ValidTags = [
  'dd',
  'div',
  'dt',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'li',
  'p',
  'span',
  'strong',
  'ul',
  'label',
  'input',
];

const getTextElementDefault = (variant) => {
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

export const Text = React.forwardRef(
  (
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
      className,
      children,
      ...props
    },
    ref,
  ) => {
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
        [`mm-text--font-style-${fontStyle}`]: Boolean(fontStyle),
        [`mm-text--ellipsis`]: Boolean(ellipsis),
        [`mm-text--text-transform-${textTransform}`]: Boolean(textTransform),
        [`mm-text--text-align-${textAlign}`]: Boolean(textAlign),
        [`mm-text--overflow-wrap-${overflowWrap}`]: Boolean(overflowWrap),
      },
    );

    return (
      <Box
        ref={ref}
        className={classnames(computedClassName)}
        as={Tag}
        dir={textDirection}
        color={color}
        {...props}
      >
        {children}
      </Box>
    );
  },
);

Text.propTypes = {
  /**
   * The variation of font styles including sizes and weights of the Text component
   * Possible values:
   * `DISPLAY_MD` large screen: 48px / small screen: 32px,
   * `HEADING_LG` large screen: 32px / small screen: 24px,
   * `HEADING_MD` large screen: 24px / small screen: 18px,
   * `HEADING_SM` large screen: 18px / small screen: 16px,
   * `BODY_LG_MEDIUM` large screen: 18px / small screen: 16px,
   * `BODY_MD` large screen: 16px / small screen: 14px,
   * `BODY_MD_BOLD` large screen: 16px / small screen: 14px,
   * `BODY_SM` large screen: 14px / small screen: 12px,
   * `BODY_SM_BOLD` large screen: 14px / small screen: 12px,
   * `BODY_XS` large screen: 12px / small screen: 10px,
   * `INHERIT`
   */
  variant: PropTypes.oneOf(Object.values(TextVariant)),
  /**
   * The color of the Text component Should use the COLOR object from
   * ./ui/helpers/constants/design-system.js
   */
  color: PropTypes.oneOf(Object.values(TextColor)),
  /**
   * The font-weight of the Text component. Should use the FONT_WEIGHT object from
   * ./ui/helpers/constants/design-system.js
   */
  fontWeight: PropTypes.oneOf(Object.values(FONT_WEIGHT)),
  /**
   * The font-style of the Text component. Should use the FONT_STYLE object from
   * ./ui/helpers/constants/design-system.js
   */
  fontStyle: PropTypes.oneOf(Object.values(FONT_STYLE)),
  /**
   * The textTransform of the Text component. Should use the TEXT_TRANSFORM object from
   * ./ui/helpers/constants/design-system.js
   */
  textTransform: PropTypes.oneOf(Object.values(TEXT_TRANSFORM)),
  /**
   * The text-align of the Text component. Should use the TextAlign enum from
   * ./ui/helpers/constants/design-system.js
   */
  textAlign: PropTypes.oneOf(Object.values(TextAlign)),
  /**
   * Change the dir (direction) global attribute of text to support the direction a language is written
   * Possible values: `LEFT_TO_RIGHT` (default), `RIGHT_TO_LEFT`, `AUTO` (user agent decides)
   */
  textDirection: PropTypes.oneOf(Object.values(TEXT_DIRECTIONS)),
  /**
   * The overflow-wrap of the Text component. Should use the OVERFLOW_WRAP object from
   * ./ui/helpers/constants/design-system.js
   */
  overflowWrap: PropTypes.oneOf(Object.values(OVERFLOW_WRAP)),
  /**
   * Used for long strings that can be cut off...
   */
  ellipsis: PropTypes.bool,
  /**
   * Changes the root html element tag of the Text component.
   */
  as: PropTypes.oneOf(ValidTags),
  /**
   * Additional className to assign the Text component
   */
  className: PropTypes.string,
  /**
   * The text content of the Text component
   */
  children: PropTypes.node.isRequired,
  /**
   * Text component accepts all Box component props
   */
  ...Box.propTypes,
};

Text.displayName = 'Text'; // Used for React DevTools profiler
