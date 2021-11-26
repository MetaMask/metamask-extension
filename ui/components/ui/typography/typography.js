import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import {
  COLORS,
  FONT_WEIGHT,
  FONT_STYLE,
  TEXT_ALIGN,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import Box, { MultipleSizes } from '../box';

const { H6, H7, H8, H9 } = TYPOGRAPHY;

export default function Typography({
  variant = TYPOGRAPHY.Paragraph,
  className,
  color = COLORS.BLACK,
  tag,
  children,
  fontWeight = 'normal',
  fontStyle = 'normal',
  align,
  boxProps = {},
  margin = [1, 0],
}) {
  const computedClassName = classnames(
    'typography',
    className,
    `typography--${variant}`,
    `typography--weight-${fontWeight}`,
    `typography--style-${fontStyle}`,
    {
      [`typography--align-${align}`]: Boolean(align),
      [`typography--color-${color}`]: Boolean(color),
    },
  );

  let Tag = tag ?? variant;

  if (Tag === TYPOGRAPHY.Paragraph) {
    Tag = 'p';
  } else if ([H7, H8, H9].includes(Tag)) {
    Tag = H6;
  }

  return (
    <Box margin={margin} {...boxProps}>
      {(boxClassName) => (
        <Tag className={classnames(boxClassName, computedClassName)}>
          {children}
        </Tag>
      )}
    </Box>
  );
}

Typography.propTypes = {
  variant: PropTypes.oneOf(Object.values(TYPOGRAPHY)),
  children: PropTypes.node.isRequired,
  color: PropTypes.oneOf(Object.values(COLORS)),
  className: PropTypes.string,
  align: PropTypes.oneOf(Object.values(TEXT_ALIGN)),
  boxProps: PropTypes.shape({
    ...Box.propTypes,
  }),
  margin: MultipleSizes,
  fontWeight: PropTypes.oneOf(Object.values(FONT_WEIGHT)),
  fontStyle: PropTypes.oneOf(Object.values(FONT_STYLE)),
  fontSize: PropTypes.string,
  tag: PropTypes.oneOf([
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'span',
    'strong',
    'em',
    'li',
    'div',
    'dt',
    'dd',
  ]),
};
