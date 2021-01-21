import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { omit } from 'lodash'
import Typography from '../typography'
import { COLORS } from '../../../helpers/constants/design-system'

export default function Chip({
  className,
  children,
  borderColor = COLORS.UI1,
  label,
  labelProps = {},
  leftIcon,
  rightIcon,
  onClick,
}) {
  const onKeyPress = (event) => {
    if (event.key === 'Enter' && onClick) {
      onClick(event)
    }
  }

  return (
    <div
      onClick={onClick}
      onKeyPress={onKeyPress}
      className={classnames(className, 'chip', {
        'chip--with-left-icon': Boolean(leftIcon),
        'chip--with-right-icon': Boolean(rightIcon),
        [`chip--${borderColor}`]: true,
      })}
      role="button"
      tabIndex={0}
    >
      {leftIcon && <div className="chip__left-icon">{leftIcon}</div>}
      {children ?? (
        <Typography
          className="chip__label"
          variant="h6"
          tag="span"
          color="UI4"
          {...labelProps}
        >
          {label}
        </Typography>
      )}
      {rightIcon && <div className="chip__right-icon">{rightIcon}</div>}
    </div>
  )
}

Chip.propTypes = {
  borderColor: PropTypes.oneOf(Object.values(COLORS)),
  label: PropTypes.string,
  children: PropTypes.node,
  labelProps: PropTypes.shape(omit(Typography.propTypes, ['className'])),
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func,
}
