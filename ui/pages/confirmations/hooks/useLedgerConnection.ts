import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
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
  const { currentConfirmation } = useConfirmContext<
    SignatureRequestType & TransactionMeta
  >();
  const ledgerTransportType = useSelector(getLedgerTransportType);
  const transportStatus = useSelector(getLedgerTransportStatus);
  const webHidConnectedStatus = useSelector(getLedgerWebHidConnectedStatus);

  const from =
    currentConfirmation?.msgParams?.from ?? currentConfirmation?.txParams?.from;

  const isLedgerWallet = useSelector(
    (state) => from && isAddressLedger(state, from),
  );

  useEffect(() => {
    if (
      !isLedgerWallet ||
      ledgerTransportType !== LedgerTransportTypes.webhid
    ) {
      return;
    }

    const initializeLedgerConnection = async () => {
      try {
        // Step 1: Check if device is connected first
        if (webHidConnectedStatus !== WebHIDConnectedStatuses.connected) {
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

          if (!webHidIsConnected) {
            return;
          }
        }

        // Step 2: Create transport if device is connected and transport not established
        if (
          webHidConnectedStatus === WebHIDConnectedStatuses.connected &&
          transportStatus === HardwareTransportStates.none
        ) {
          const transportCreated = await attemptLedgerTransportCreation();
          dispatch(
            setLedgerTransportStatus(
              transportCreated
                ? HardwareTransportStates.verified
                : HardwareTransportStates.unknownFailure,
            ),
          );
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (errorMessage.includes('Failed to open the device')) {
          dispatch(
            setLedgerTransportStatus(HardwareTransportStates.deviceOpenFailure),
          );
        } else if (errorMessage.includes('device is already open')) {
          dispatch(setLedgerTransportStatus(HardwareTransportStates.verified));
        } else {
          dispatch(
            setLedgerTransportStatus(HardwareTransportStates.unknownFailure),
          );
        }
      }
    };

    initializeLedgerConnection();
  }, [
    dispatch,
    ledgerTransportType,
    isLedgerWallet,
    webHidConnectedStatus,
    transportStatus,
  ]);

  useEffect(() => {
    return () => {
      if (isLedgerWallet) {
        dispatch(setLedgerTransportStatus(HardwareTransportStates.none));
      }
    };
  }, [dispatch, isLedgerWallet]);

  return {
    isLedgerWallet,
    transportStatus,
    webHidConnectedStatus,
  };
};

export default useLedgerConnection;
