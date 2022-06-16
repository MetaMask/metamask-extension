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
import { KEYRING_NAMES } from '../../../../shared/constants/hardware-wallets';
import LedgerSVG from './ledger-svg';

export default function HardwareConnectivityContent({
  deviceName,
  onConnectClick,
  onAdvancedClick,
  onClose,
}) {
  const t = useI18nContext();

  switch (deviceName) {
    case KEYRING_NAMES.LEDGER:
      return (
        <div className="hardware-connectivity-content">
          <div className="hardware-connectivity-content__close">
            <i
              onClick={onClose}
              onKeyUp={(event) => {
                if (event.key === 'Enter') {
                  onClose();
                }
              }}
              role="button"
              tabIndex={0}
              className="fas fa-times"
            />
          </div>
          <Typography
            variant={TYPOGRAPHY.H3}
            fontWeight={FONT_WEIGHT.BOLD}
            align={TEXT_ALIGN.CENTER}
          >
            {t('hardwareWalletConnectivityHelperHeading', [deviceName])}
          </Typography>
          <LedgerSVG />
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
  onClose: PropTypes.func.isRequired,
};
