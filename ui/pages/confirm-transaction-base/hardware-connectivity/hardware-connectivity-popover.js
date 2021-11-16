import React from 'react';
import PropTypes from 'prop-types';

import { useI18nContext } from '../../../hooks/useI18nContext';

import Popover from '../../../components/ui/popover';
import Button from '../../../components/ui/button';

import Typography from '../../../components/ui/typography/typography';
import { TYPOGRAPHY, COLORS } from '../../../helpers/constants/design-system';

export default function HardwareConnectivityPopover({ onClose, onSave }) {
  const t = useI18nContext();

  return (
    <Popover
      title={t('advancedOptions')}
      onClose={onClose}
      footer={
        <>
          <Button type="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="primary" onClick={onSave}>
            {t('save')}
          </Button>
        </>
      }
    >
      <div style={{ padding: '0 16px' }}>
        <Typography variant={TYPOGRAPHY.H6}>{t('selectHdPath')}</Typography>
        <Typography variant={TYPOGRAPHY.H6} color={COLORS.UI4}>
          {t('hardwareWalletConnectivityAdvancedPathDescription')}
        </Typography>
        <div>(TODO: Dropdown here)</div>
        <Typography variant={TYPOGRAPHY.H6}>
          {t('hardwareWalletConnectivityAdvancedMethodSelect')}
        </Typography>
        <Typography variant={TYPOGRAPHY.H6} color={COLORS.UI4}>
          {t('hardwareWalletConnectivityAdvancedMethodSelectDescription')}
        </Typography>
        <div>(TODO: Radio buttons here)</div>
      </div>
    </Popover>
  );
}

HardwareConnectivityPopover.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};
