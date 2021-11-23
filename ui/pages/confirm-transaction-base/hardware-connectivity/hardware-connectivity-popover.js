import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { useI18nContext } from '../../../hooks/useI18nContext';

import Popover from '../../../components/ui/popover';
import Button from '../../../components/ui/button';
import LedgerTransportDropdown from '../../settings/advanced-tab/ledger-transport-dropdown';
import ConnectHardwarePathSelector from '../../create-account/connect-hardware/connect-hardware-path';

import Typography from '../../../components/ui/typography/typography';
import { TYPOGRAPHY, COLORS } from '../../../helpers/constants/design-system';

import { LEDGER_HD_PATHS } from '../../create-account/connect-hardware';
import { useSelector } from 'react-redux';

export default function HardwareConnectivityPopover({ onClose, onSave }) {
  const [pathValue, setPathValue] = useState(); // TODO: Initial value?

  const t = useI18nContext();

  const onPathChange = (value) => {
    setPathValue(value);
  };

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
        <ConnectHardwarePathSelector
          device="ledger"
          options={LEDGER_HD_PATHS}
          onChange={onPathChange}
          selectedOption={pathValue}
        />
        <LedgerTransportDropdown />
      </div>
    </Popover>
  );
}

HardwareConnectivityPopover.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};
