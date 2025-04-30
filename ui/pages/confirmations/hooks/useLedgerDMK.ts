import { useSelector, useDispatch } from 'react-redux';
import { DeviceManagementKitBuilder } from '@ledgerhq/device-management-kit';
import { webHidTransportFactory } from '@ledgerhq/device-transport-kit-web-hid';
import { webBleTransportFactory } from '@ledgerhq/device-transport-kit-web-ble';
import { SignerEthBuilder } from '@ledgerhq/device-signer-kit-ethereum';
import { ContextModuleBuilder } from '@ledgerhq/context-module';
import {
  setConnectedDevice,
  setDeviceStatus,
  setDmk,
  setEthSigner,
  setSessionId,
  setTransportType,
} from '../../../ducks/ledger-dmk/ledger-dmk';
import {
  getLedgerConnectedDevice,
  getLedgerDeviceStatus,
  getLedgerEthSigner,
  getLedgerDmk,
  getLedgerSessionId,
  getLedgerTransportType,
} from '../../../ducks/ledger-dmk/selectors';
import type { WEBHID, BLE } from '../../../ducks/ledger-dmk/constants';
import { useConfirmContext } from '../context/confirm';
import type { SignatureRequestType } from '@metamask/signature-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { isAddressLedger } from '../../../ducks/metamask/metamask';

const useLedgerDMK = () => {
  const dispatch = useDispatch();
  const connectedDevice = useSelector(getLedgerConnectedDevice);
  const deviceStatus = useSelector(getLedgerDeviceStatus);
  const ethSigner = useSelector(getLedgerEthSigner);
  const dmk = useSelector(getLedgerDmk);
  const ledgerSessionId = useSelector(getLedgerSessionId);
  const ledgerTransportType = useSelector(getLedgerTransportType);
  const { currentConfirmation } = useConfirmContext<
    SignatureRequestType & TransactionMeta
  >();

  const initLedgerDMK = () => {
    const deviceManagementKit = new DeviceManagementKitBuilder()
      .addTransport(webHidTransportFactory)
      .addTransport(webBleTransportFactory)
      // .addLogger(new ConsoleLogger())
      // .addLogger(new FlipperDmkLogger())
      .build();

    dispatch(setDmk(deviceManagementKit));
  };

  const from =
    currentConfirmation?.msgParams?.from ?? currentConfirmation?.txParams?.from;

  const isLedgerWallet = useSelector(
    (state) => from && isAddressLedger(state, from),
  );

  const updateTransportType = (transportType: typeof WEBHID | typeof BLE) => {
    dispatch(setTransportType(transportType));
  };

  const setupDeviceStatusListener = () => {
    if (!dmk || !ledgerSessionId) {
      return;
    }

    // Ensure ledgerSessionId is a string
    if (typeof ledgerSessionId === 'string') {
      dmk.getDeviceSessionState({ sessionId: ledgerSessionId }).subscribe({
        next: (state) => {
          dispatch(setDeviceStatus(state.deviceStatus));
        },
        error: (error) => {
          console.error('Error:', error);
        },
        complete: () => {
          console.log('Device session state subscription completed');
        },
      });
    } else {
      console.error('ledgerSessionId is not a string');
    }
  };

  const connectLedger = () => {
    if (!dmk) {
      return;
    }

    const contextModule = new ContextModuleBuilder({
      originToken: 'origin-token', // TODO: replace with your origin token
    }).build();

    dmk.startDiscovering({ transport: ledgerTransportType }).subscribe({
      next: (device) => {
        dmk.connect({ device }).then((sessionId) => {
          const ledgerConnectedDevice = dmk.getConnectedDevice({
            sessionId,
          });
          dispatch(setConnectedDevice(ledgerConnectedDevice));
          dispatch(setSessionId(sessionId));

          const signer = new SignerEthBuilder({
            dmk,
            sessionId,
          })
            .withContextModule(contextModule)
            .build();

          dispatch(setEthSigner(signer));
        });
      },
      error: (error) => {
        console.error('Error:', error);
        throw error;
      },
      complete: () => {
        console.log('Discovery complete');
      },
    });
  };

  return {
    isLedgerWallet,
    initLedgerDMK,
    connectLedger,
    updateTransportType,
    setupDeviceStatusListener,
    connectedDevice,
    deviceStatus,
    ledgerTransportType,
    ethSigner,
    dmk,
  };
};

export default useLedgerDMK;
