import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import InfoTooltip from '../../../components/ui/info-tooltip';

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
}) {
  const actionableMessageClassName = classnames(
    'actionable-message',
    typeHash[type],
    withRightButton ? CLASSNAME_WITH_RIGHT_BUTTON : null,
    className,
  );

  return (
    <div className={actionableMessageClassName}>
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
};
