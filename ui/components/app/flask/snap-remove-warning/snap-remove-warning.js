import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Typography from '../../../ui/typography/typography';
import { TYPOGRAPHY } from '../../../../helpers/constants/design-system';
import Popover from '../../../ui/popover';
import Button from '../../../ui/button';

export default function SnapRemoveWarning({ onCancel, onSubmit, snapName }) {
  const t = useI18nContext();

  const SnapRemoveWarningFooter = () => {
    return (
      <>
        <Button
          className="snap-remove-warning__footer-button"
          type="default"
          onClick={onCancel}
        >
          {t('nevermind')}
        </Button>
        <Button
          className="snap-remove-warning__footer-button"
          type="danger-primary"
          onClick={onSubmit}
        >
          {t('removeSnap')}
        </Button>
      </>
    );
  };

  return (
    <Popover
      className="snap-remove-warning"
      title={t('pleaseConfirm')}
      footer={<SnapRemoveWarningFooter />}
      onClose={onCancel}
    >
      <div className="snap-remove-warning__content">
        <Typography variant={TYPOGRAPHY.H6}>
          {t('removeSnapConfirmation', [snapName])}
        </Typography>
      </div>
    </Popover>
  );
}

SnapRemoveWarning.propTypes = {
  /**
   * onCancel handler
   */
  onCancel: PropTypes.func,
  /**
   * onSubmit handler
   */
  onSubmit: PropTypes.func,
  /**
   * Name of snap
   */
  snapName: PropTypes.string,
};
