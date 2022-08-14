import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ONEKEY_USB_DEVICE_FILTERS,
  WEBHID_CONNECTED_STATUSES,
} from '../../../../shared/constants/hardware-wallets';

import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';

import {
  setOneKeyWebUsbConnectedStatus,
  getOneKeyWebUsbConnectedStatus,
} from '../../../ducks/app/app';

import Typography from '../../ui/typography/typography';
import Button from '../../ui/button';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  COLORS,
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import Dialog from '../../ui/dialog';

import { getEnvironmentType } from '../../../../app/scripts/lib/util';

const renderInstructionStep = (
  text,
  show = true,
  color = COLORS.TEXT_DEFAULT,
) => {
  return (
    show && (
      <Typography
        boxProps={{ margin: 0 }}
        color={color}
        fontWeight={FONT_WEIGHT.BOLD}
        variant={TYPOGRAPHY.H7}
      >
        {text}
      </Typography>
    )
  );
};

export default function OneKeyInstructionField() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const webusbConnectedStatus = useSelector(getOneKeyWebUsbConnectedStatus);
  const environmentType = getEnvironmentType();
  const environmentTypeIsFullScreen =
    environmentType === ENVIRONMENT_TYPE_FULLSCREEN;

  useEffect(() => {
    const initialConnectedDeviceCheck = async () => {
      console.log('initialConnectedDeviceCheck: ', webusbConnectedStatus);
      if (webusbConnectedStatus !== WEBHID_CONNECTED_STATUSES.CONNECTED) {
        const devices = await window.navigator.usb.getDevices();
        const webusbIsConnected = devices.some((device) => {
          const isOneKeyDevice = ONEKEY_USB_DEVICE_FILTERS.some(
            (desc) =>
              device.vendorId === desc.vendorId &&
              device.productId === desc.productId,
          );
          return isOneKeyDevice;
        });
        dispatch(
          setOneKeyWebUsbConnectedStatus(
            webusbIsConnected
              ? WEBHID_CONNECTED_STATUSES.CONNECTED
              : WEBHID_CONNECTED_STATUSES.NOT_CONNECTED,
          ),
        );
      }
    };
    initialConnectedDeviceCheck();
  }, [dispatch, webusbConnectedStatus]);

  return (
    <div>
      <div className="confirm-detail-row">
        <Dialog type="message">
          <div className="ledger-live-dialog">
            {renderInstructionStep(t('onekeyConnectionInstructionHeader'))}
            {renderInstructionStep(`- ${t('onekeyWalletStepOne')}`)}
            {renderInstructionStep(
              <span>
                <Button
                  type="link"
                  onClick={async () => {
                    if (environmentTypeIsFullScreen) {
                      const connectedDevice =
                        await window.navigator.usb.requestDevice({
                          filters: ONEKEY_USB_DEVICE_FILTERS,
                        });
                      dispatch(
                        setOneKeyWebUsbConnectedStatus(
                          connectedDevice &&
                            connectedDevice.serialNumber &&
                            connectedDevice.serialNumber.length > 0
                            ? WEBHID_CONNECTED_STATUSES.CONNECTED
                            : WEBHID_CONNECTED_STATUSES.NOT_CONNECTED,
                        ),
                      );
                    } else {
                      global.platform.openExtensionInBrowser(null, null, true);
                    }
                  }}
                >
                  {environmentTypeIsFullScreen
                    ? t('clickToConnectOneKeyViaWebUSB')
                    : t('openFullScreenForOneKeyWebUSB')}
                </Button>
              </span>,
              // webusbConnectedStatus !== WEBUSB_CONNECTED_STATUSES.CONNECTED,
              // COLORS.SECONDARY_DEFAULT,
            )}
          </div>
        </Dialog>
      </div>
    </div>
  );
}

OneKeyInstructionField.propTypes = {};
