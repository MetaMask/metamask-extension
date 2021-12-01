import React from 'react';
import PropTypes from 'prop-types';

import { useI18nContext } from '../../../hooks/useI18nContext';

import Popover from '../../../components/ui/popover';
import Button from '../../../components/ui/button';
import LedgerTransportDropdown from '../../settings/advanced-tab/ledger-transport-dropdown';

export default function HardwareConnectivityPopover({ onClose }) {
  const t = useI18nContext();

  return (
    <Popover
      title={t('advancedOptions')}
      onClose={onClose}
      footer={
        <>
          <Button type="secondary" onClick={onClose}>
            {t('close')}
          </Button>
        </>
      }
    >
      <div style={{ padding: '0 16px' }}>
        <LedgerTransportDropdown />
      </div>
    </Popover>
  );
}

HardwareConnectivityPopover.propTypes = {
  onClose: PropTypes.func.isRequired,
};
