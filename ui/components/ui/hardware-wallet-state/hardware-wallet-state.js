import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  getHardwareWalletDevice,
  getHardwareWalletPath,
} from '../../../selectors';
import { isDeviceAccessible } from '../../../store/actions';
import { I18nContext } from '../../../contexts/i18n';
import { HARDWARE_CHECK_RATE } from '../../../../shared/constants/hardware-wallets';
import { SEVERITIES } from '../../../helpers/constants/design-system';
import { BannerAlert } from '../../component-library';

const noOp = () => {
  // do nothing
};

/**
 * Component that monitors hardware wallet state and displays a warning if locked
 *
 * @param options0
 * @param options0.pollingRateMs
 * @param options0.initialStatus
 * @param options0.onUpdate
 */
export default function HardwareWalletState({
  pollingRateMs = HARDWARE_CHECK_RATE,
  initialStatus = 'locked',
  onUpdate = noOp,
}) {
  const t = useContext(I18nContext);
  const [status, setStatus] = useState(initialStatus);
  const device = useSelector(getHardwareWalletDevice);
  const path = useSelector(getHardwareWalletPath);

  const updateHardwareLockState = useCallback(async () => {
    const unlocked = await isDeviceAccessible(device, path);
    const state = unlocked ? 'unlocked' : 'locked';
    setStatus(state);
    onUpdate(state);
  }, [device, path, onUpdate]);

  useEffect(() => {
    const intervalId = setInterval(updateHardwareLockState, pollingRateMs);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollingRateMs]);

  return (
    status === 'locked' && (
      <BannerAlert severity={SEVERITIES.DANGER}>
        {t('ledgerLocked')}
      </BannerAlert>
    )
  );
}

HardwareWalletState.propTypes = {
  pollingRateMs: PropTypes.number,
  initialStatus: PropTypes.string,
  onUpdate: PropTypes.func,
};
