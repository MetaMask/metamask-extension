import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import CheckBox from '../../../ui/check-box/check-box.component';
import Typography from '../../../ui/typography/typography';
import { TYPOGRAPHY } from '../../../../helpers/constants/design-system';
import Popover from '../../../ui/popover';
import Button from '../../../ui/button';

export default function SnapInstallWarning({ onCancel, onSubmit, snapName }) {
  const t = useI18nContext();
  const [isConfirmed, setIsConfirmed] = useState(false);

  const onCheckboxClicked = useCallback(
    () => setIsConfirmed((confirmedState) => !confirmedState),
    [],
  );

  const SnapInstallWarningFooter = () => {
    return (
      <div className="snap-install-warning__footer">
        <Button
          className="snap-install-warning__footer-button"
          type="default"
          onClick={onCancel}
        >
          {t('cancel')}
        </Button>
        <Button
          className="snap-install-warning__footer-button"
          type="primary"
          disabled={!isConfirmed}
          onClick={onSubmit}
        >
          {t('confirm')}
        </Button>
      </div>
    );
  };

  return (
    <Popover
      className="snap-install-warning"
      title={t('areYouSure')}
      footer={<SnapInstallWarningFooter />}
    >
      <div className="snap-install-warning__content">
        <Typography variant={TYPOGRAPHY.H6} boxProps={{ paddingBottom: 4 }}>
          {t('snapInstallWarningCheck')}
        </Typography>
        <div className="checkbox-label">
          <CheckBox
            checked={isConfirmed}
            id="warning-accept"
            onClick={onCheckboxClicked}
          />
          <label htmlFor="warning-accept">
            {t('snapInstallWarningKeyAccess', [snapName])}
          </label>
        </div>
      </div>
    </Popover>
  );
}

SnapInstallWarning.propTypes = {
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
