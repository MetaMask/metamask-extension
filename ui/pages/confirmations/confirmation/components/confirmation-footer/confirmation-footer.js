import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
} from '../../../../../components/component-library';
import { useTemplateAlertContext } from '../../alerts/TemplateAlertContext';

export default function ConfirmationFooter({
  onSubmit,
  onCancel,
  submitText,
  cancelText,
  loadingText,
  alerts,
  loading,
  submitAlerts,
  actionsStyle,
  style,
}) {
  const { hasAlerts, showAlertsModal } = useTemplateAlertContext();
  const showActions = Boolean(onCancel || onSubmit);
  return (
    <div className="confirmation-footer" style={style}>
      {alerts}
      {submitAlerts}
      {showActions && (
        <div className="confirmation-footer__actions" style={actionsStyle}>
          {onCancel ? (
            <Button
              block
              data-testid="confirmation-cancel-button"
              variant={ButtonVariant.Secondary}
              onClick={onCancel}
              size={ButtonSize.Lg}
            >
              {cancelText}
            </Button>
          ) : null}
          {onSubmit && submitText ? (
            <Button
              block
              data-testid="confirmation-submit-button"
              disabled={Boolean(loading)}
              onClick={hasAlerts ? showAlertsModal : onSubmit}
              className={classnames({
                centered: !onCancel,
              })}
              startIconName={hasAlerts ? IconName.Info : undefined}
              size={ButtonSize.Lg}
            >
              {loading ? loadingText : submitText}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

ConfirmationFooter.propTypes = {
  alerts: PropTypes.node,
  onCancel: PropTypes.func,
  cancelText: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  submitText: PropTypes.string.isRequired,
  loadingText: PropTypes.string,
  loading: PropTypes.bool,
  submitAlerts: PropTypes.node,
  style: PropTypes.object,
  actionsStyle: PropTypes.object,
};
