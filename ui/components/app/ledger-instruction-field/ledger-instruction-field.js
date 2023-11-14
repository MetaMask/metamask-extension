import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import {
  HardwareTransportStates,
  LEDGER_USB_VENDOR_ID,
  LedgerTransportTypes,
  WebHIDConnectedStatuses,
} from '../../../../shared/constants/hardware-wallets';
import {
  getLedgerTransportStatus,
  getLedgerWebHidConnectedStatus,
  setLedgerTransportStatus,
  setLedgerWebHidConnectedStatus,
} from '../../../ducks/app/app';
import { getLedgerTransportType } from '../../../ducks/metamask/metamask';
import {
  SEVERITIES,
  TextAlign,
  TextColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { attemptLedgerTransportCreation } from '../../../store/actions';
import { BannerAlert, ButtonLink, Text } from '../../component-library';

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
  }, [dispatch, ledgerTransportType, webHidConnectedStatus, transportStatus]);

  useEffect(() => {
    return () => {
      dispatch(setLedgerTransportStatus(HardwareTransportStates.none));
    };
  }, [dispatch]);

  const usingWebHID = ledgerTransportType === LedgerTransportTypes.webhid;

  return (
    <div>
      <div className="confirm-detail-row">
        <BannerAlert severity={SEVERITIES.INFO}>
          <div className="ledger-live-dialog">
            {renderInstructionStep(t('ledgerConnectionInstructionHeader'))}
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
              TextColor.warningDefault,
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
