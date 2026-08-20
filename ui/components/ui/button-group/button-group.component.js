import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'clsx';

function ButtonGroup({
  className = 'button-group',
  defaultActiveButtonIndex = 0,
  variant = 'default',
  noButtonActiveByDefault,
  children,
  disabled,
  style,
  newActiveButtonIndex,
}) {
  const [activeButtonIndex, setActiveButtonIndex] = useState(() =>
    noButtonActiveByDefault ? null : defaultActiveButtonIndex,
  );

  useEffect(() => {
    if (
      typeof newActiveButtonIndex === 'number' &&
      activeButtonIndex !== newActiveButtonIndex
    ) {
      setActiveButtonIndex(newActiveButtonIndex);
    }
  }, [newActiveButtonIndex, activeButtonIndex]);

  const renderButtons = () =>
    React.Children.map(children, (child, index) => {
      return (
        child && (
          <button
            role={variant === 'radiogroup' ? 'radio' : undefined}
            aria-checked={index === activeButtonIndex}
            className={classnames(
              variant === 'radiogroup'
                ? 'radio-button-group__button'
                : 'button-group__button',
              child.props.className,
              {
                'button-group__button--active': index === activeButtonIndex,
                'radio-button-group__button--active':
                  variant === 'radiogroup' && index === activeButtonIndex,
              },
            )}
            data-testid={`button-group__button${index}`}
            onClick={() => {
              setActiveButtonIndex(index);
              child.props.onClick?.();
            }}
            disabled={disabled || child.props.disabled}
            key={index}
          >
            {child.props.children}
          </button>
        )
      );
    });

  return (
    <div
      className={classnames(className, {
        'radio-button-group': variant === 'radiogroup',
      })}
      role={variant === 'radiogroup' ? 'radiogroup' : undefined}
      style={style}
    >
      {renderButtons()}
    </div>
  );
}

ButtonGroup.propTypes = {
  defaultActiveButtonIndex: PropTypes.number,
  noButtonActiveByDefault: PropTypes.bool,
  disabled: PropTypes.bool,
  children: PropTypes.array,
  className: PropTypes.string,
  style: PropTypes.object,
  newActiveButtonIndex: PropTypes.number,
  variant: PropTypes.oneOf(['radiogroup', 'default']),
};

export default ButtonGroup;
