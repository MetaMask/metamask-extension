import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const defaultRender = (inner) => inner;

export default function IconButton({
  onClick,
  Icon,
  disabled,
  label,
  tooltipRender,
  className,
  ...props
}) {
  const renderWrapper = tooltipRender ?? defaultRender;
  return (
    <button
      className={classNames('icon-button', className, {
        'icon-button--disabled': disabled,
      })}
      data-testid={props['data-testid'] ?? undefined}
      onClick={onClick}
      disabled={disabled}
    >
      {renderWrapper(
        <>
          <div className="icon-button__circle">
            <Icon />
          </div>
          <span>{label}</span>
        </>,
      )}
    </button>
  );
}

IconButton.propTypes = {
  'onClick': PropTypes.func.isRequired,
  'Icon': PropTypes.func.isRequired,
  'disabled': PropTypes.bool,
  'label': PropTypes.string.isRequired,
  'tooltipRender': PropTypes.func,
  'className': PropTypes.string,
  'data-testid': PropTypes.string,
};
