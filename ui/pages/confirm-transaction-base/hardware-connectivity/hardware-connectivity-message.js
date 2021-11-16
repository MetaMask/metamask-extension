import React from 'react';
import PropTypes from 'prop-types';

import { useI18nContext } from '../../../hooks/useI18nContext';
import ActionableMessage from '../../../components/ui/actionable-message/actionable-message';

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
            t('hardwareWalletConnectivityConnected', ['Ledger'])
          ) : (
            <>
              {t('hardwareWalletConnectivityNotConnected', ['Ledger'])}{' '}
              <a href="#" onClick={onClick}>
                {t('hardwareWalletConnectivityNotConnectedConversion')}
              </a>
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
