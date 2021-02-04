import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import Button from '../../ui/button';

export default function ConfirmationFooter({
  onApprove,
  onCancel,
  approveText,
  cancelText,
  alerts,
}) {
  const className = classnames('confirmation-footer', {
    'confirmation-footer--with-alerts':
      alerts && Object.keys(alerts).length > 0,
  });

  return (
    <div className={className}>
      {alerts && alerts}
      <div className="confirmation-footer__actions">
        <Button
          rounded
          type="secondary"
          onClick={onCancel}
          onKeyUp={(event) => {
            if (event.key === 'Enter') {
              onCancel();
            }
          }}
        >
          {cancelText}
        </Button>
        <Button
          rounded
          type="primary"
          onClick={onApprove}
          onKeyUp={(event) => {
            if (event.key === 'Enter') {
              onApprove();
            }
          }}
        >
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
};
