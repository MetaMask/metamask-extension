import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import {
  COLORS,
  FONT_WEIGHT,
  FONT_STYLE,
  TEXT_ALIGN,
  TYPOGRAPHY,
  OVERFLOW_WRAP,
} from '../../../helpers/constants/design-system';
import Box, { MultipleSizes } from '../box';

const { H6, H7, H8, H9 } = TYPOGRAPHY;

export const ValidColors = [
  COLORS.TEXT_DEFAULT,
  COLORS.TEXT_ALTERNATIVE,
  COLORS.TEXT_MUTED,
  COLORS.OVERLAY_INVERSE,
  COLORS.PRIMARY_DEFAULT,
  COLORS.PRIMARY_INVERSE,
  COLORS.SECONDARY_DEFAULT,
  COLORS.SECONDARY_INVERSE,
  COLORS.ERROR_DEFAULT,
  COLORS.ERROR_INVERSE,
  COLORS.SUCCESS_DEFAULT,
  COLORS.SUCCESS_INVERSE,
  COLORS.WARNING_INVERSE,
  COLORS.INFO_DEFAULT,
  COLORS.INFO_INVERSE,
];

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
];

export default function Typography({
  variant = TYPOGRAPHY.Paragraph,
  color = COLORS.TEXT_DEFAULT,
  fontWeight = 'normal',
  fontStyle = 'normal',
  align,
  overflowWrap,
  title,
  tag,
  margin = [1, 0],
  boxProps = {},
  className,
  children,
}) {
  let Tag = tag ?? variant;
  let strongTagFontWeight;

  if (Tag === 'strong') {
    strongTagFontWeight = FONT_WEIGHT.BOLD;
  }

  const computedClassName = classnames(
    'typography',
    className,
    `typography--${variant}`,
    `typography--weight-${strongTagFontWeight || fontWeight}`,
    `typography--style-${fontStyle}`,
    {
      [`typography--align-${align}`]: Boolean(align),
      [`typography--color-${color}`]: Boolean(color),
      [`typography--overflowwrap-${overflowWrap}`]: Boolean(overflowWrap),
    },
  );

  if (Tag === TYPOGRAPHY.Paragraph) {
    Tag = 'p';
  } else if ([H7, H8, H9].includes(Tag)) {
    Tag = H6;
  }

  return (
    <Box margin={margin} {...boxProps}>
      {(boxClassName) => (
        <Tag
          className={classnames(boxClassName, computedClassName)}
          title={title}
        >
          {children}
        </Tag>
      )}
    </Box>
  );
}

Typography.propTypes = {
  /**
   * The variation of font sizes of the Typography component
   */
  variant: PropTypes.oneOf(Object.values(TYPOGRAPHY)),
  /**
   * The color of the Typography component Should use the COLOR object from
   * ./ui/helpers/constants/design-system.js
   */
  color: PropTypes.oneOf(ValidColors),
  /**
   * The font-weight of the Typography component. Should use the FONT_WEIGHT object from
   * ./ui/helpers/constants/design-system.js
   */
  fontWeight: PropTypes.oneOf(Object.values(FONT_WEIGHT)),
  /**
   * The font-style of the Typography component. Should use the FONT_STYLE object from
   * ./ui/helpers/constants/design-system.js
   */
  fontStyle: PropTypes.oneOf(Object.values(FONT_STYLE)),
  /**
   * The text-align of the Typography component. Should use the TEXT_ALIGN object from
   * ./ui/helpers/constants/design-system.js
   */
  align: PropTypes.oneOf(Object.values(TEXT_ALIGN)),
  /**
   * The overflow-wrap of the Typography component. Should use the OVERFLOW_WRAP object from
   * ./ui/helpers/constants/design-system.js
   */
  overflowWrap: PropTypes.oneOf(Object.values(OVERFLOW_WRAP)),
  /**
   * Changes the root html element tag of the Typography component.
   */
  tag: PropTypes.oneOf(ValidTags),
  /**
   * Adds margin to the Typography component should use valid sizes
   * 1,2,4,6,8 or an array of those values
   */
  margin: MultipleSizes,
  /**
   * Used to pass any valid Box component props such as margin or padding
   * to the Typography component
   */
  boxProps: PropTypes.shape({
    ...Box.propTypes,
  }),
  /**
   * Additional className to assign the Typography component
   */
  className: PropTypes.string,
  /**
   * Title attribute to include on the element. Will show as tooltip on hover.
   */
  title: PropTypes.string,
  /**
   * The text content of the Typography component
   */
  children: PropTypes.node.isRequired,
};
