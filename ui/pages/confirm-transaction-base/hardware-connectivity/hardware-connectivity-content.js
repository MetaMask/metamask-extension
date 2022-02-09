import React from 'react';
import PropTypes from 'prop-types';

import { useI18nContext } from '../../../hooks/useI18nContext';

import Button from '../../../components/ui/button';

import Typography from '../../../components/ui/typography/typography';
import {
  TYPOGRAPHY,
  FONT_WEIGHT,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';

export default function HardwareConnectivityContent({
  deviceName,
  onConnectClick,
  onAdvancedClick,
}) {
  const t = useI18nContext();

  switch (deviceName) {
    case 'Ledger':
      return (
        <div className="hardware-connectivity-content">
          <Typography
            variant={TYPOGRAPHY.H3}
            fontWeight={FONT_WEIGHT.BOLD}
            align={TEXT_ALIGN.CENTER}
          >
            {t('hardwareWalletConnectivityHelperHeading', [deviceName])}
          </Typography>
          <img src="./images/ledger.svg" alt={deviceName} />
          <div className="hardware-connectivity-content-list-container">
            <ol>
              <li>{t('hardwareConnectivityLedgerInstructions1')}</li>
              <li>{t('hardwareConnectivityLedgerInstructions2')}</li>
              <li>{t('hardwareConnectivityLedgerInstructions3')}</li>
            </ol>
          </div>
          <Button type="primary" onClick={onConnectClick}>
            {t('connect')}
          </Button>
          <Button
            type="link"
            className="hardware-connectivity-content-advanced"
            onClick={onAdvancedClick}
          >
            {t('advancedOptions')}
          </Button>
        </div>
      );
    default:
      return null;
  }
}

HardwareConnectivityContent.propTypes = {
  deviceName: PropTypes.string.isRequired,
  onConnectClick: PropTypes.func.isRequired,
  onAdvancedClick: PropTypes.func.isRequired,
};
