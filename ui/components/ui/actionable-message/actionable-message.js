import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import InfoTooltip from '../info-tooltip';

const CLASSNAME_WARNING = 'actionable-message--warning';
const CLASSNAME_DANGER = 'actionable-message--danger';
const CLASSNAME_WITH_RIGHT_BUTTON = 'actionable-message--with-right-button';

const typeHash = {
  warning: CLASSNAME_WARNING,
  danger: CLASSNAME_DANGER,
};

export default function ActionableMessage({
  message = '',
  primaryAction = null,
  secondaryAction = null,
  className = '',
  infoTooltipText = '',
  withRightButton = false,
  type = false,
  useIcon = false,
  iconFill = '#b8b8b8',
}) {
  const actionableMessageClassName = classnames(
    'actionable-message',
    typeHash[type],
    withRightButton ? CLASSNAME_WITH_RIGHT_BUTTON : null,
    className,
    { 'actionable-message--with-icon': useIcon },
  );

  return (
    <div className={actionableMessageClassName}>
      {useIcon && (
        <svg
          viewBox="0 0 10 10"
          xmlns="http://www.w3.org/2000/svg"
          className="actionable-message__icon"
        >
          <path
            d="M5 0C2.2 0 0 2.2 0 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 2c.4 0 .7.3.7.7s-.3.7-.7.7-.7-.2-.7-.6.3-.8.7-.8zm.7 6H4.3V4.3h1.5V8z"
            fill={iconFill}
          />
        </svg>
      )}
      {infoTooltipText && (
        <InfoTooltip
          position="left"
          contentText={infoTooltipText}
          wrapperClassName="actionable-message__info-tooltip-wrapper"
        />
      )}
      <div className="actionable-message__message">{message}</div>
      {(primaryAction || secondaryAction) && (
        <div className="actionable-message__actions">
          {primaryAction && (
            <button
              className={classnames(
                'actionable-message__action',
                'actionable-message__action--primary',
              )}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              className={classnames(
                'actionable-message__action',
                'actionable-message__action--secondary',
              )}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

ActionableMessage.propTypes = {
  message: PropTypes.node.isRequired,
  primaryAction: PropTypes.shape({
    label: PropTypes.string,
    onClick: PropTypes.func,
  }),
  secondaryAction: PropTypes.shape({
    label: PropTypes.string,
    onClick: PropTypes.func,
  }),
  className: PropTypes.string,
  type: PropTypes.string,
  withRightButton: PropTypes.bool,
  infoTooltipText: PropTypes.string,
  useIcon: PropTypes.bool,
  iconFill: PropTypes.string,
};
