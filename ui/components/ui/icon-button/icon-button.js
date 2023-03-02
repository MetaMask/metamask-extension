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
  renderBackgroundColor = true,
  ...props
}) {
  const renderWrapper = tooltipRender ?? defaultRender;
  return (
    <button
      className={classNames(
        renderBackgroundColor ? 'icon-button' : undefined,
        className,
        {
          'icon-button--disabled': disabled,
        },
      )}
      data-testid={props['data-testid'] ?? undefined}
      onClick={onClick}
      disabled={disabled}
    >
      {renderWrapper(
        <>
          <div
            className={
              renderBackgroundColor
                ? 'icon-button__circle'
                : 'icon-button__no_background'
            }
          >
            {Icon}
          </div>
          <span>{label}</span>
        </>,
      )}
    </button>
  );
}

IconButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  Icon: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
  label: PropTypes.string.isRequired,
  tooltipRender: PropTypes.func,
  className: PropTypes.string,
  renderBackgroundColor: PropTypes.bool,
  'data-testid': PropTypes.string,
};
