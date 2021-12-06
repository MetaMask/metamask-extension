import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import InfoTooltip from '../info-tooltip';
import InfoTooltipIcon from '../info-tooltip/info-tooltip-icon';

const CLASSNAME_WARNING = 'actionable-message--warning';
const CLASSNAME_DANGER = 'actionable-message--danger';
const CLASSNAME_INFO = 'actionable-message--info';
const CLASSNAME_WITH_RIGHT_BUTTON = 'actionable-message--with-right-button';

const typeHash = {
  warning: CLASSNAME_WARNING,
  danger: CLASSNAME_DANGER,
  info: CLASSNAME_INFO,
  default: '',
};

export default function ActionableMessage({
  message = '',
  primaryAction = null,
  primaryActionV2 = null,
  secondaryAction = null,
  className = '',
  infoTooltipText = '',
  withRightButton = false,
  type = 'default',
  useIcon = false,
  iconFillColor = '',
  roundedButtons,
}) {
  const actionableMessageClassName = classnames(
    'actionable-message',
    typeHash[type],
    withRightButton ? CLASSNAME_WITH_RIGHT_BUTTON : null,
    className,
    { 'actionable-message--with-icon': useIcon },
  );

  const onlyOneAction =
    (primaryAction && !secondaryAction) || (secondaryAction && !primaryAction);

  return (
    <div className={actionableMessageClassName}>
      {useIcon ? <InfoTooltipIcon fillColor={iconFillColor} /> : null}
      {infoTooltipText && (
        <InfoTooltip
          position="left"
          contentText={infoTooltipText}
          wrapperClassName="actionable-message__info-tooltip-wrapper"
        />
      )}
      <div className="actionable-message__message">{message}</div>
      {primaryActionV2 && (
        <button
          className="actionable-message__action-v2"
          onClick={primaryActionV2.onClick}
        >
          {primaryActionV2.label}
        </button>
      )}
      {(primaryAction || secondaryAction) && (
        <div
          className={classnames('actionable-message__actions', {
            'actionable-message__actions--single': onlyOneAction,
          })}
        >
          {primaryAction && (
            <button
              className={classnames(
                'actionable-message__action',
                'actionable-message__action--primary',
                `actionable-message__action-${type}`,
                {
                  'actionable-message__action--rounded': roundedButtons,
                },
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
                `actionable-message__action-${type}`,
                {
                  'actionable-message__action--rounded': roundedButtons,
                },
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
  primaryActionV2: PropTypes.shape({
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
  iconFillColor: PropTypes.string,
  roundedButtons: PropTypes.bool,
};
