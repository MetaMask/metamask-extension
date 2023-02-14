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
 * @param options0.onChange
 * @param options0.onLock
 * @param options0.onUnlock
 */
export default function HardwareWalletState({
  device,
  hdPath,
  pollingRateMs = HARDWARE_CHECK_RATE,
  onChange = noOp,
  onLock = noOp,
  onUnlock = noOp,
}) {
  const t = useContext(I18nContext);
  const [isUnlocked, setUnlocked] = useState(undefined);

  const updateHardwareLockState = async () => {
    const wasUnlocked = isUnlocked;
    const unlocked = await isDeviceAccessible(device, hdPath);
    setUnlocked(unlocked);
    // fire events on change
    if (wasUnlocked !== unlocked) {
      if (unlocked) {
        await onUnlock();
        await onChange('unlocked');
      } else {
        await onLock();
        await onChange('locked');
      }
    }
  };

  useEffect(() => {
    const intervalId = setInterval(updateHardwareLockState, pollingRateMs);
    return () => clearInterval(intervalId);
  });

  // only show if state is defined
  return (
    isUnlocked === false && (
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
  onChange: PropTypes.func,
  onLock: PropTypes.func,
  onUnlock: PropTypes.func,
};
