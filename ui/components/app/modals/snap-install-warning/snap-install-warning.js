import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Modal from '../../modal';
import CheckBox from '../../../ui/check-box/check-box.component';
import { hideModal } from '../../../../store/actions';
import Typography from '../../../ui/typography/typography';
import {
  TYPOGRAPHY,
  FONT_WEIGHT,
} from '../../../../helpers/constants/design-system';

export default function SnapInstallWarning() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const { onSubmit, snapName } = useSelector(
    (state) => state.appState.modal.modalState.props,
  );

  const [isConfirmed, setIsConfirmed] = useState(false);

  const onCheckboxClicked = useCallback(
    () => setIsConfirmed((confirmedState) => !confirmedState),
    [],
  );
  const onCancel = useCallback(() => dispatch(hideModal()), [dispatch]);
  return (
    <Modal
      onSubmit={onSubmit}
      onCancel={onCancel}
      submitText={t('approveAndInstall')}
      cancelText={t('cancel')}
      submitDisabled={!isConfirmed}
    >
      <div className="snap-install-warning">
        <Typography variant={TYPOGRAPHY.H4} fontWeight={FONT_WEIGHT.BOLD}>
          {t('areYouSure')}
        </Typography>
        <Typography variant={TYPOGRAPHY.H6} paddingLeft={16} paddingRight={16}>
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
    </Modal>
  );
}
