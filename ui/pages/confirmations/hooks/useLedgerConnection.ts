import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import {
  getLedgerTransportType,
  isAddressLedger,
} from '../../../ducks/metamask/metamask';
import { attemptLedgerTransportCreation } from '../../../store/actions';
import { SignatureRequestType } from '../types/confirm';
import { useConfirmContext } from '../context/confirm';

const useLedgerConnection = () => {
  const dispatch = useDispatch();
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();
  const ledgerTransportType = useSelector(getLedgerTransportType);
  const transportStatus = useSelector(getLedgerTransportStatus);
  const webHidConnectedStatus = useSelector(getLedgerWebHidConnectedStatus);

  let from: string | undefined;
  // todo: extend to other confirmation types
  if (currentConfirmation?.msgParams) {
    from = currentConfirmation.msgParams.from;
  }

  const isLedgerWallet = useSelector(
    (state) => from && isAddressLedger(state, from),
  );

  useEffect(() => {
    if (!isLedgerWallet) {
      return;
    }
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
        } catch (e: unknown) {
          if ((e as Error).message.match('Failed to open the device')) {
            dispatch(
              setLedgerTransportStatus(
                HardwareTransportStates.deviceOpenFailure,
              ),
            );
          } else if ((e as Error).message.match('the device is already open')) {
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
    isLedgerWallet,
    webHidConnectedStatus,
    transportStatus,
  ]);

  useEffect(() => {
    if (!isLedgerWallet) {
      return undefined;
    }
    return () => {
      dispatch(setLedgerTransportStatus(HardwareTransportStates.none));
    };
  }, [dispatch]);

  return { isLedgerWallet };
};

export default useLedgerConnection;
