import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import Box from '../../ui/box';
import {
  FONT_WEIGHT,
  FONT_STYLE,
  TEXT,
  TEXT_ALIGN,
  TEXT_TRANSFORM,
  OVERFLOW_WRAP,
  TEXT_COLORS,
} from '../../../helpers/constants/design-system';

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
];

export const Text = ({
  variant = TEXT.BODY_MD,
  color = TEXT_COLORS.TEXT_DEFAULT,
  fontWeight,
  fontStyle,
  textTransform,
  textAlign,
  overflowWrap,
  ellipsis,
  as,
  className,
  children,
  ...props
}) => {
  let Tag = as ?? variant;
  let strongTagFontWeight;

  if (Tag === 'strong') {
    strongTagFontWeight = FONT_WEIGHT.BOLD;
  }

  const computedClassName = classnames(
    'text',
    className,
    `text--${variant}`,
    (strongTagFontWeight || fontWeight) &&
      `text--font-weight-${strongTagFontWeight || fontWeight}`,
    {
      [`text--font-style-${fontStyle}`]: Boolean(fontStyle),
      [`text--ellipsis`]: Boolean(ellipsis),
      [`text--text-transform-${textTransform}`]: Boolean(textTransform),
      [`text--text-align-${textAlign}`]: Boolean(textAlign),
      [`text--color-${color}`]: Boolean(color),
      [`text--overflow-wrap-${overflowWrap}`]: Boolean(overflowWrap),
    },
  );

  // // Set a default tag based on variant
  const splitTag = Tag.split('-')[0];
  if (splitTag === 'body') {
    Tag = 'p';
  } else if (splitTag === 'heading') {
    Tag = 'h2';
  } else if (splitTag === 'display') {
    Tag = 'h1';
  }

  return (
    <Box {...props} className={classnames(computedClassName)} as={Tag}>
      {children}
    </Box>
  );
};

Text.propTypes = {
  /**
   * The variation of font styles including sizes and weights of the Text component (display, heading, body)
   */
  variant: PropTypes.oneOf(Object.values(TEXT)),
  /**
   * The color of the Text component Should use the COLOR object from
   * ./ui/helpers/constants/design-system.js
   */
  color: PropTypes.oneOf(Object.values(TEXT_COLORS)),
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
   * The text-align of the Text component. Should use the TEXT_ALIGN object from
   * ./ui/helpers/constants/design-system.js
   */
  textAlign: PropTypes.oneOf(Object.values(TEXT_ALIGN)),
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

export default Text;
