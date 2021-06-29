import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import {
  COLORS,
  FONT_WEIGHT,
  TEXT_ALIGN,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import Box from '../box';

const { H6, H7, H8, H9 } = TYPOGRAPHY;

export default function Typography({
  variant = TYPOGRAPHY.Paragraph,
  className,
  color = COLORS.BLACK,
  tag,
  children,
  fontWeight = 'normal',
  align,
  boxProps = {},
}) {
  const computedClassName = classnames(
    'typography',
    className,
    `typography--${variant}`,
    `typography--weight-${fontWeight}`,
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
    <Box margin={[1, 0]} {...boxProps}>
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
  fontWeight: PropTypes.oneOf(Object.values(FONT_WEIGHT)),
  tag: PropTypes.oneOf([
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'span',
    'div',
    'dt',
    'dd',
  ]),
};
