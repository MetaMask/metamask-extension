import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  getHardwareWalletDevice,
  getHardwareWalletPath,
} from '../../../selectors';
import { isDeviceAccessible } from '../../../store/actions';
import { I18nContext } from '../../../contexts/i18n';
import {
  setHardwareWalletState,
  getHardwareWalletState,
} from '../../../ducks/app/app';
import {
  HardwareWalletStates,
  HARDWARE_CHECK_RATE,
} from '../../../../shared/constants/hardware-wallets';
import { SEVERITIES } from '../../../helpers/constants/design-system';
import { BannerAlert } from '../../component-library';

/**
 * Default renedered component for HardwareWalletState
 *
 * @param options0
 * @param options0.severity
 * @param options0.children
 */
const DefaultComponent = ({
  severity = SEVERITIES.WARNING,
  children,
  ...props
}) => (
  <BannerAlert severity={severity} {...props}>
    {children}
  </BannerAlert>
);

DefaultComponent.propTypes = {
  // BannerAlert severity/color
  severity: PropTypes.string,
  // child nodes to render inside default component
  children: PropTypes.node,
};

/**
 * Component that monitors hardware wallet state and displays a warning if locked
 *
 * @param options0
 * @param options0.pollingRateMs
 * @param options0.headless
 * @param options0.onUpdate
 * @param options0.Component
 */
export default function HardwareWalletState({
  pollingRateMs = HARDWARE_CHECK_RATE,
  headless = false,
  onUpdate,
  Component = DefaultComponent,
  ...props
}) {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();

  const hdState = useSelector(getHardwareWalletState);
  const [status, setStatus] = useState(hdState);
  const device = useSelector(getHardwareWalletDevice);
  const path = useSelector(getHardwareWalletPath);

  const updateHardwareLockState = useCallback(async () => {
    const unlocked = await isDeviceAccessible(device, path);
    const state = unlocked
      ? HardwareWalletStates.unlocked
      : HardwareWalletStates.locked;
    setStatus(state);
    onUpdate?.(state);
    // dispatch a change action?
    if (state !== hdState) {
      dispatch(setHardwareWalletState(state));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device, path, onUpdate]);

  useEffect(() => {
    const intervalId = setInterval(updateHardwareLockState, pollingRateMs);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollingRateMs]);

  return (
    !headless &&
    status === HardwareWalletStates.locked && (
      <Component {...props}>{t('ledgerLocked')}</Component>
    )
  );
}

HardwareWalletState.propTypes = {
  // number of milliseconds between polling checks
  pollingRateMs: PropTypes.number,
  // whether or not to render component
  headless: PropTypes.bool,
  // invoked with each updated status (locked/unlocked)
  onUpdate: PropTypes.func,
  // component to be rendered (default: BannerAlert)
  Component: PropTypes.func,
};
