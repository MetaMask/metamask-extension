import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  LedgerTransportTypes,
  WebHIDConnectedStatuses,
  HardwareTransportStates,
  HardwareWalletStates,
  LEDGER_USB_VENDOR_ID,
} from '../../../../shared/constants/hardware-wallets';
import {
  PLATFORM_FIREFOX,
  ENVIRONMENT_TYPE_FULLSCREEN,
} from '../../../../shared/constants/app';

import {
  setLedgerWebHidConnectedStatus,
  getLedgerWebHidConnectedStatus,
  getHardwareWalletState,
  setLedgerTransportStatus,
  getLedgerTransportStatus,
} from '../../../ducks/app/app';

import { BannerAlert, ButtonLink, Text } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  SEVERITIES,
  TextAlign,
  TextColor,
} from '../../../helpers/constants/design-system';
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
      <Text color={color} as="h6">
        {text}
      </Text>
    )
  );
};

export default function LedgerInstructionField({ showDataInstruction }) {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const webHidConnectedStatus = useSelector(getLedgerWebHidConnectedStatus);
  const ledgerTransportType = useSelector(getLedgerTransportType);
  const transportStatus = useSelector(getLedgerTransportStatus);
  const hdWalletState = useSelector(getHardwareWalletState);
  const environmentType = getEnvironmentType();
  const environmentTypeIsFullScreen =
    environmentType === ENVIRONMENT_TYPE_FULLSCREEN;

  useEffect(() => {
    const initialConnectedDeviceCheck = async () => {
      if (
        ledgerTransportType === LedgerTransportTypes.webhid &&
        webHidConnectedStatus !== WebHIDConnectedStatuses.connected
      ) {
        const devices = await window.navigator?.hid?.getDevices();
        const webHidIsConnected = devices?.some(
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
  }, [
    dispatch,
    ledgerTransportType,
    webHidConnectedStatus,
    transportStatus,
    hdWalletState,
  ]);

  useEffect(() => {
    return () => {
      dispatch(setLedgerTransportStatus(HardwareTransportStates.none));
    };
  }, [dispatch]);

  const usingLedgerLive = ledgerTransportType === LedgerTransportTypes.live;
  const usingWebHID = ledgerTransportType === LedgerTransportTypes.webhid;

  const isFirefox = getPlatform() === PLATFORM_FIREFOX;
  const isHdWalletLocked = hdWalletState === HardwareWalletStates.locked;

  return (
    <div>
      <div className="confirm-detail-row">
        <BannerAlert
          severity={isHdWalletLocked ? SEVERITIES.WARNING : SEVERITIES.INFO}
        >
          {renderInstructionStep(t('ledgerLocked'), isHdWalletLocked)}
          <div className="ledger-live-dialog">
            {renderInstructionStep(t('ledgerConnectionInstructionHeader'))}
            {renderInstructionStep(
              `• ${t('ledgerConnectionInstructionStepOne')}`,
              !isFirefox && usingLedgerLive,
            )}
            {renderInstructionStep(
              `• ${t('ledgerConnectionInstructionStepTwo')}`,
              !isFirefox && usingLedgerLive,
            )}
            {renderInstructionStep(
              `• ${t('ledgerConnectionInstructionStepThree')}`,
            )}
            {renderInstructionStep(
              `• ${t('ledgerConnectionInstructionStepFour')}`,
              showDataInstruction,
            )}
            {renderInstructionStep(
              <span>
                <ButtonLink
                  textAlign={TextAlign.Left}
                  onClick={async () => {
                    if (environmentTypeIsFullScreen) {
                      window.location.reload();
                    } else {
                      global.platform.openExtensionInBrowser(null, null, true);
                    }
                  }}
                >
                  {t('ledgerConnectionInstructionCloseOtherApps')}
                </ButtonLink>
              </span>,
              transportStatus === HardwareTransportStates.deviceOpenFailure,
            )}
            {renderInstructionStep(
              <span>
                <ButtonLink
                  textAlign={TextAlign.Left}
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
                </ButtonLink>
              </span>,
              usingWebHID &&
                webHidConnectedStatus === WebHIDConnectedStatuses.notConnected,
              TextColor.WARNING_DEFAULT,
            )}
          </div>
        </BannerAlert>
      </div>
    </div>
  );
}

LedgerInstructionField.propTypes = {
  // whether or not to show the data instruction
  showDataInstruction: PropTypes.bool,
};
