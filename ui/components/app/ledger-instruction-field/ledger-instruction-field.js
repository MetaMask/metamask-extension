import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  LEDGER_TRANSPORT_TYPES,
  LEDGER_USB_VENDOR_ID,
  WEBHID_CONNECTED_STATUSES,
  TRANSPORT_STATES,
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
  COLORS,
  FONT_WEIGHT,
  TYPOGRAPHY,
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
        ledgerTransportType === LEDGER_TRANSPORT_TYPES.WEBHID &&
        webHidConnectedStatus !== WEBHID_CONNECTED_STATUSES.CONNECTED
      ) {
        const devices = await window.navigator.hid.getDevices();
        const webHidIsConnected = devices.some(
          (device) => device.vendorId === Number(LEDGER_USB_VENDOR_ID),
        );
        dispatch(
          setLedgerWebHidConnectedStatus(
            webHidIsConnected
              ? WEBHID_CONNECTED_STATUSES.CONNECTED
              : WEBHID_CONNECTED_STATUSES.NOT_CONNECTED,
          ),
        );
      }
    };
    const determineTransportStatus = async () => {
      if (
        ledgerTransportType === LEDGER_TRANSPORT_TYPES.WEBHID &&
        webHidConnectedStatus === WEBHID_CONNECTED_STATUSES.CONNECTED &&
        transportStatus === TRANSPORT_STATES.NONE
      ) {
        try {
          const transportedCreated = await attemptLedgerTransportCreation();
          dispatch(
            setLedgerTransportStatus(
              transportedCreated
                ? TRANSPORT_STATES.VERIFIED
                : TRANSPORT_STATES.UNKNOWN_FAILURE,
            ),
          );
        } catch (e) {
          if (e.message.match('Failed to open the device')) {
            dispatch(
              setLedgerTransportStatus(TRANSPORT_STATES.DEVICE_OPEN_FAILURE),
            );
          } else if (e.message.match('the device is already open')) {
            dispatch(setLedgerTransportStatus(TRANSPORT_STATES.VERIFIED));
          } else {
            dispatch(
              setLedgerTransportStatus(TRANSPORT_STATES.UNKNOWN_FAILURE),
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
      dispatch(setLedgerTransportStatus(TRANSPORT_STATES.NONE));
    };
  }, [dispatch]);

  const usingLedgerLive = ledgerTransportType === LEDGER_TRANSPORT_TYPES.LIVE;
  const usingWebHID = ledgerTransportType === LEDGER_TRANSPORT_TYPES.WEBHID;

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
              transportStatus === TRANSPORT_STATES.DEVICE_OPEN_FAILURE,
            )}
            {renderInstructionStep(
              <span>
                <Button
                  type="link"
                  onClick={async () => {
                    if (environmentTypeIsFullScreen) {
                      const connectedDevices = await window.navigator.hid.requestDevice(
                        {
                          filters: [{ vendorId: LEDGER_USB_VENDOR_ID }],
                        },
                      );
                      const webHidIsConnected = connectedDevices.some(
                        (device) =>
                          device.vendorId === Number(LEDGER_USB_VENDOR_ID),
                      );
                      dispatch(
                        setLedgerWebHidConnectedStatus({
                          webHidConnectedStatus: webHidIsConnected
                            ? WEBHID_CONNECTED_STATUSES.CONNECTED
                            : WEBHID_CONNECTED_STATUSES.NOT_CONNECTED,
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
                webHidConnectedStatus ===
                  WEBHID_CONNECTED_STATUSES.NOT_CONNECTED,
              COLORS.SECONDARY_DEFAULT,
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
