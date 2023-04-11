import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  LedgerTransportTypes,
  WebHIDConnectedStatuses,
  HardwareTransportStates,
  LEDGER_USB_VENDOR_ID,
} from '../../../../shared/constants/hardware-wallets';
import {
  PLATFORM_FIREFOX,
  ENVIRONMENT_TYPE_FULLSCREEN,
} from '../../../../shared/constants/app';

import {
  setLedgerWebHidConnectedStatus,
  getLedgerWebHidConnectedStatus,
  setLedgerTransportStatus,
  getLedgerTransportStatus,
} from '../../../ducks/app/app';

import Typography from '../../ui/typography/typography';
import Button from '../../ui/button';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  FONT_WEIGHT,
  TextColor,
  TypographyVariant,
} from '../../../helpers/constants/design-system';
import Dialog from '../../ui/dialog';
import {
  getPlatform,
  getEnvironmentType,
} from '../../../../app/scripts/lib/util';
import { getLedgerTransportType } from '../../../ducks/metamask/metamask';
import { attemptLedgerTransportCreation } from '../../../store/actions';

const renderInstructionStep = (
  text,
  show = true,
  color = TextColor.textDefault,
) => {
  return (
    show && (
      <Typography
        boxProps={{ margin: 0 }}
        color={color}
        fontWeight={FONT_WEIGHT.BOLD}
        variant={TypographyVariant.H7}
      >
        {text}
      </Typography>
    )
  );
};

export default function LedgerInstructionField({ showDataInstruction }) {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const webHidConnectedStatus = useSelector(getLedgerWebHidConnectedStatus);
  const ledgerTransportType = useSelector(getLedgerTransportType);
  const transportStatus = useSelector(getLedgerTransportStatus);
  const environmentType = getEnvironmentType();
  const environmentTypeIsFullScreen =
    environmentType === ENVIRONMENT_TYPE_FULLSCREEN;

  useEffect(() => {
    const initialConnectedDeviceCheck = async () => {
      if (
        ledgerTransportType === LedgerTransportTypes.webhid &&
        webHidConnectedStatus !== WebHIDConnectedStatuses.connected
      ) {
        const devices = await window.navigator.hid.getDevices();
        const webHidIsConnected = devices.some(
          (device) => device.vendorId === Number(LEDGER_USB_VENDOR_ID),
        );
        dispatch(
          setLedgerWebHidConnectedStatus(
            webHidIsConnected
              ? WebHIDConnectedStatuses.connected
              : WebHIDConnectedStatuses.notConnected,
          ),
        );
      }
    };
    const determineTransportStatus = async () => {
      if (
        ledgerTransportType === LedgerTransportTypes.webhid &&
        webHidConnectedStatus === WebHIDConnectedStatuses.connected &&
        transportStatus === HardwareTransportStates.none
      ) {
        try {
          const transportedCreated = await attemptLedgerTransportCreation();
          dispatch(
            setLedgerTransportStatus(
              transportedCreated
                ? HardwareTransportStates.verified
                : HardwareTransportStates.unknownFailure,
            ),
          );
        } catch (e) {
          if (e.message.match('Failed to open the device')) {
            dispatch(
              setLedgerTransportStatus(
                HardwareTransportStates.deviceOpenFailure,
              ),
            );
          } else if (e.message.match('the device is already open')) {
            dispatch(
              setLedgerTransportStatus(HardwareTransportStates.verified),
            );
          } else {
            dispatch(
              setLedgerTransportStatus(HardwareTransportStates.unknownFailure),
            );
          }
        }
      }
    };
    determineTransportStatus();
    initialConnectedDeviceCheck();
  }, [dispatch, ledgerTransportType, webHidConnectedStatus, transportStatus]);

  useEffect(() => {
    return () => {
      dispatch(setLedgerTransportStatus(HardwareTransportStates.none));
    };
  }, [dispatch]);

  const usingLedgerLive = ledgerTransportType === LedgerTransportTypes.live;
  const usingWebHID = ledgerTransportType === LedgerTransportTypes.webhid;

  const isFirefox = getPlatform() === PLATFORM_FIREFOX;

  return (
    <div>
      <div className="confirm-detail-row">
        <Dialog type="message">
          <div className="ledger-live-dialog">
            {renderInstructionStep(t('ledgerConnectionInstructionHeader'))}
            {renderInstructionStep(
              `- ${t('ledgerConnectionInstructionStepOne')}`,
              !isFirefox && usingLedgerLive,
            )}
            {renderInstructionStep(
              `- ${t('ledgerConnectionInstructionStepTwo')}`,
              !isFirefox && usingLedgerLive,
            )}
            {renderInstructionStep(
              `- ${t('ledgerConnectionInstructionStepThree')}`,
            )}
            {renderInstructionStep(
              `- ${t('ledgerConnectionInstructionStepFour')}`,
              showDataInstruction,
            )}
            {renderInstructionStep(
              <span>
                <Button
                  type="link"
                  onClick={async () => {
                    if (environmentTypeIsFullScreen) {
                      window.location.reload();
                    } else {
                      global.platform.openExtensionInBrowser(null, null, true);
                    }
                  }}
                >
                  {t('ledgerConnectionInstructionCloseOtherApps')}
                </Button>
              </span>,
              transportStatus === HardwareTransportStates.deviceOpenFailure,
            )}
            {renderInstructionStep(
              <span>
                <Button
                  type="link"
                  onClick={async () => {
                    if (environmentTypeIsFullScreen) {
                      const connectedDevices =
                        await window.navigator.hid.requestDevice({
                          filters: [{ vendorId: LEDGER_USB_VENDOR_ID }],
                        });
                      const webHidIsConnected = connectedDevices.some(
                        (device) =>
                          device.vendorId === Number(LEDGER_USB_VENDOR_ID),
                      );
                      dispatch(
                        setLedgerWebHidConnectedStatus({
                          webHidConnectedStatus: webHidIsConnected
                            ? WebHIDConnectedStatuses.connected
                            : WebHIDConnectedStatuses.notConnected,
                        }),
                      );
                    } else {
                      global.platform.openExtensionInBrowser(null, null, true);
                    }
                  }}
                >
                  {environmentTypeIsFullScreen
                    ? t('clickToConnectLedgerViaWebHID')
                    : t('openFullScreenForLedgerWebHid')}
                </Button>
              </span>,
              usingWebHID &&
                webHidConnectedStatus === WebHIDConnectedStatuses.notConnected,
              TextColor.WARNING_DEFAULT,
            )}
          </div>
        </Dialog>
      </div>
    </div>
  );
}

LedgerInstructionField.propTypes = {
  showDataInstruction: PropTypes.bool,
};
