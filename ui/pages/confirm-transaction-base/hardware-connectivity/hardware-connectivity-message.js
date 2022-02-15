import React from 'react';
import PropTypes from 'prop-types';

import { useI18nContext } from '../../../hooks/useI18nContext';
import ActionableMessage from '../../../components/ui/actionable-message/actionable-message';
import { DEVICE_NAMES } from '../../../../shared/constants/hardware-wallets';

export default function HardwareConnectivityMessage({
  connected = false,
  onClick = undefined,
}) {
  const t = useI18nContext();

  return (
    <div className="hardware-connectivity-message">
      <ActionableMessage
        type={connected ? '' : 'warning'}
        message={
          connected ? (
            t('hardwareWalletConnectivityConnected', DEVICE_NAMES.LEDGER)
          ) : (
            <>
              {t('hardwareWalletConnectivityNotConnected', [
                DEVICE_NAMES.LEDGER,
              ])}{' '}
              <button
                className="hardware-connectivity-message__button"
                onClick={onClick}
              >
                {t('hardwareWalletConnectivityNotConnectedConversion')}
              </button>
            </>
          )
        }
      />
    </div>
  );
}

HardwareConnectivityMessage.propTypes = {
  connected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};
