import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import InfoTooltip from '../../../components/ui/info-tooltip';

export default function ActionableMessage({
  message = '',
  primaryAction = null,
  secondaryAction = null,
  className = '',
  infoTooltipText = '',
}) {
  return (
    <div className={classnames('actionable-message', className)}>
      {infoTooltipText && (
        <div className="actionable-message__info-tooltip-wrapper">
          <InfoTooltip position="left" contentText={infoTooltipText} />
        </div>
      )}
      <div className="actionable-message__message">{message}</div>
      {(primaryAction || secondaryAction) && (
        <div className={classnames('actionable-message__actions')}>
          {primaryAction && (
            <div
              className={classnames(
                'actionable-message__action',
                'actionable-message__action--primary',
              )}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </div>
          )}
          {secondaryAction && (
            <div
              className={classnames(
                'actionable-message__action',
                'actionable-message__action--secondary',
              )}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </div>
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
  infoTooltipText: PropTypes.string,
};
