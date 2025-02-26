import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  Button as ButtonComponent,
  IconName,
} from '../../../../../components/component-library';
import Button from '../../../../../components/ui/button';
import { useAlertContext } from '../../alerts/alerts-context';

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
  const { hasAlerts, showAlertsModal } = useAlertContext();
  const showActions = Boolean(onCancel || onSubmit);
  return (
    <div className="confirmation-footer" style={style}>
      {alerts}
      {submitAlerts}
      {showActions && (
        <div className="confirmation-footer__actions" style={actionsStyle}>
          {onCancel ? (
            <Button
              data-testid="confirmation-cancel-button"
              type="secondary"
              onClick={onCancel}
            >
              {cancelText}
            </Button>
          ) : null}
          {onSubmit && submitText ? (
            <ButtonComponent
              data-testid="confirmation-submit-button"
              disabled={Boolean(loading)}
              onClick={hasAlerts ? showAlertsModal : onSubmit}
              className={classnames({
                centered: !onCancel,
              })}
              startIconName={hasAlerts ? IconName.Info : undefined}
            >
              {loading ? loadingText : submitText}
            </ButtonComponent>
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
