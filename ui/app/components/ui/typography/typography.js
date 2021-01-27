import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { COLORS, TYPOGRAPHY } from '../../../helpers/constants/design-system'

const { H6, H7, H8, H9 } = TYPOGRAPHY

export default function Typography({
  variant = TYPOGRAPHY.Paragraph,
  className,
  color = COLORS.BLACK,
  tag,
  children,
  spacing = 1,
  fontWeight = 'normal',
  align,
}) {
  const computedClassName = classnames(
    'typography',
    className,
    `typography--${variant}`,
    `typography--align-${align}`,
    `typography--spacing-${spacing}`,
    `typography--color-${color}`,
    `typography--weight-${fontWeight}`,
  )

  let Tag = tag ?? variant

  if (Tag === TYPOGRAPHY.Paragraph) {
    Tag = 'p'
  } else if ([H7, H8, H9].includes(Tag)) {
    Tag = H6
  }

  return <Tag className={computedClassName}>{children}</Tag>
}

Typography.propTypes = {
  variant: PropTypes.oneOf(Object.values(TYPOGRAPHY)),
  children: PropTypes.node.isRequired,
  color: PropTypes.oneOf(Object.values(COLORS)),
  className: PropTypes.string,
  align: PropTypes.oneOf(['center', 'right']),
  spacing: PropTypes.oneOf([1, 2, 3, 4, 5, 6, 7, 8]),
  fontWeight: PropTypes.oneOf(['bold', 'normal']),
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
  ]),
}
