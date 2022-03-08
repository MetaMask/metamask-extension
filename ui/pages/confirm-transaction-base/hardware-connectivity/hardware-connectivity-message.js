import React from 'react';
import PropTypes from 'prop-types';

import { useI18nContext } from '../../../hooks/useI18nContext';
import ActionableMessage from '../../../components/ui/actionable-message/actionable-message';
import { KEYRING_NAMES } from '../../../../shared/constants/hardware-wallets';

export default function HardwareConnectivityMessage({
  connected = false,
  onClick = undefined,
}) {
  const t = useI18nContext();

  return (
    <div className="hardware-connectivity-message">
      <ActionableMessage
        type={connected ? 'success' : 'warning'}
        withRightButton
        primaryAction={{
          label: t('hardwareWalletConnectivityNotConnectedConversion'),
          onClick,
        }}
        message={
          connected ? (
            <>
              <i className="fa fa-check-circle" />{' '}
              {t('hardwareWalletConnectivityConnected', [KEYRING_NAMES.LEDGER])}
            </>
          ) : (
            <>
              <i className="fa fa-exclamation-circle" />{' '}
              {t('hardwareWalletConnectivityNotConnected', [
                KEYRING_NAMES.LEDGER,
              ])}{' '}
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
