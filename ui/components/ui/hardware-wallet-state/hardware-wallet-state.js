import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ActionableMessage from '../actionable-message';
import { isDeviceAccessible } from '../../../store/actions';
import { I18nContext } from '../../../contexts/i18n';
import { HARDWARE_CHECK_RATE } from '../../../../shared/constants/hardware-wallets';

const noOp = () => {
  // do nothing
};

/**
 * Component that monitors hardware wallet state and displays a warning if locked
 *
 * @param options0
 * @param options0.device
 * @param options0.hdPath
 * @param options0.pollingRateMs
 * @param options0.initialStatus
 * @param options0.onUpdate
 */
export default function HardwareWalletState({
  device,
  hdPath,
  pollingRateMs = HARDWARE_CHECK_RATE,
  initialStatus = 'locked',
  onUpdate = noOp,
}) {
  const t = useContext(I18nContext);
  const [status, setStatus] = useState(initialStatus);

  const updateHardwareLockState = async () => {
    const unlocked = await isDeviceAccessible(device, hdPath);
    const state = unlocked ? 'unlocked' : 'locked';
    setStatus(state);
    onUpdate(state);
  };

  useEffect(() => {
    const intervalId = setInterval(updateHardwareLockState, pollingRateMs);
    return () => clearInterval(intervalId);
  });

  return (
    status === 'locked' && (
      <ActionableMessage
        message={t('ledgerLocked')}
        type="danger"
        useIcon
        iconFillColor="var(--color-error-default)"
      />
    )
  );
}

HardwareWalletState.propTypes = {
  device: PropTypes.string,
  hdPath: PropTypes.string,
  pollingRateMs: PropTypes.number,
  initialStatus: PropTypes.string,
  onUpdate: PropTypes.func,
};
