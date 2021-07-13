import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

export default function ListItem({
  title,
  subtitle,
  onClick,
  children,
  titleIcon,
  icon,
  rightContent,
  midContent,
  className,
  'data-testid': dataTestId,
}) {
  const primaryClassName = classnames(
    'list-item',
    className,
    subtitle || children ? '' : 'list-item--single-content-row',
  );

  return (
    <div
      className={primaryClassName}
      onClick={onClick}
      data-testid={dataTestId}
      role="button"
      tabIndex={0}
      onKeyPress={(event) => {
        if (event.key === 'Enter') {
          onClick();
        }
      }}
    >
      {icon && <div className="list-item__icon">{icon}</div>}
      <div className="list-item__heading">
        {React.isValidElement(title) ? (
          title
        ) : (
          <h2 className="list-item__title">{title}</h2>
        )}
        {titleIcon && (
          <div className="list-item__heading-wrap">{titleIcon}</div>
        )}
      </div>
      {subtitle && <div className="list-item__subheading">{subtitle}</div>}
      {children && <div className="list-item__actions">{children}</div>}
      {midContent && <div className="list-item__mid-content">{midContent}</div>}
      {rightContent && (
        <div className="list-item__right-content">{rightContent}</div>
      )}
    </div>
  );
}

ListItem.propTypes = {
  'title': PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  'titleIcon': PropTypes.node,
  'subtitle': PropTypes.node,
  'children': PropTypes.node,
  'icon': PropTypes.node,
  'rightContent': PropTypes.node,
  'midContent': PropTypes.node,
  'className': PropTypes.string,
  'onClick': PropTypes.func,
  'data-testid': PropTypes.string,
};
