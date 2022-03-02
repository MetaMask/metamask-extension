import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { COLORS, SIZES } from '../../../helpers/constants/design-system';

export default function ColorIndicator({
  size = SIZES.SM,
  type = 'outlined',
  color = COLORS.UI4,
  borderColor,
  iconClassName,
}) {
  const colorIndicatorClassName = classnames('color-indicator', {
    'color-indicator--filled': type === 'filled' || Boolean(iconClassName),
    'color-indicator--partial-filled': type === 'partial-filled',
    [`color-indicator--border-color-${borderColor}`]: Boolean(borderColor),
    [`color-indicator--color-${color}`]: true,
    [`color-indicator--size-${size}`]: true,
  });

  return (
    <div className={colorIndicatorClassName}>
      {iconClassName ? (
        <i className={classnames('color-indicator__icon', iconClassName)} />
      ) : (
        <span className="color-indicator__inner-circle" />
      )}
    </div>
  );
}

ColorIndicator.TYPES = {
  FILLED: 'filled',
  PARTIAL: 'partial-filled',
  OUTLINE: 'outline',
};

ColorIndicator.propTypes = {
  color: PropTypes.oneOf(Object.values(COLORS)),
  borderColor: PropTypes.oneOf(Object.values(COLORS)),
  size: PropTypes.oneOf(Object.values(SIZES)),
  iconClassName: PropTypes.string,
  type: PropTypes.oneOf(Object.values(ColorIndicator.TYPES)),
};
