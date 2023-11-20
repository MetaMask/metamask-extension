import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Button from '../../../../components/ui/button';

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
  return (
    <div className="confirmation-footer" style={style}>
      {alerts}
      {submitAlerts}
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
          <Button
            data-testid="confirmation-submit-button"
            disabled={Boolean(loading)}
            type="primary"
            onClick={onSubmit}
            className={classnames({
              centered: !onCancel,
            })}
          >
            {loading ? loadingText : submitText}
          </Button>
        ) : null}
      </div>
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
