import React from 'react';
import PropTypes from 'prop-types';
import Button from '../../../../components/ui/button';

export default function ConfirmationFooter({
  onApprove,
  onCancel,
  approveText,
  cancelText,
  alerts,
  disableApprove,
}) {
  return (
    <div className="confirmation-footer">
      {alerts}
      <div className="confirmation-footer__actions">
        <Button type="secondary" onClick={onCancel}>
          {cancelText}
        </Button>
        <Button type="primary" onClick={onApprove} disabled={disableApprove}>
          {approveText}
        </Button>
      </div>
    </div>
  );
}

ConfirmationFooter.propTypes = {
  alerts: PropTypes.node,
  onApprove: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  approveText: PropTypes.string.isRequired,
  cancelText: PropTypes.string.isRequired,
  disableApprove: PropTypes.bool,
};
