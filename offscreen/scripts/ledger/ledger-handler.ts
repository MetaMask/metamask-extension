import {
  type ConnectedDevice,
  type DeviceActionState,
  DeviceActionStatus,
  type DeviceManagementKit,
  DeviceManagementKitBuilder,
} from '@ledgerhq/device-management-kit';
import { webHidTransportFactory } from '@ledgerhq/device-transport-kit-web-hid';
import { webBleTransportFactory } from '@ledgerhq/device-transport-kit-web-ble';
import {
  ContextModuleBuilder,
  type ContextModuleCalConfig,
} from '@ledgerhq/context-module';
import {
  type GetAddressDAError,
  type GetAddressDAIntermediateValue,
  SignerEthBuilder,
} from '@ledgerhq/device-signer-kit-ethereum';

import { WEBHID } from './constants';
import type { GetAddressCommandResponse } from '@ledgerhq/device-signer-kit-ethereum/api/app-binder/GetAddressCommandTypes.js';

export default class LedgerHandler {
  private dmk: DeviceManagementKit;

  private ethSigner!: ReturnType<SignerEthBuilder['build']>;

  private deviceStatus?: string;

  private transportType?: string;

  private sessionId?: string;

  private connectedDevice?: ConnectedDevice;

  constructor() {
    console.error('LedgerHandler constructor');
    this.dmk = new DeviceManagementKitBuilder()
      .addTransport(webHidTransportFactory)
      .addTransport(webBleTransportFactory)
      .build();
  }

  async makeEthApp() {
    console.log('makeApp');
    if (!this.transportType) {
      this.transportType = WEBHID;
    }

    const calConfig: ContextModuleCalConfig = {
      url: 'https://crypto-assets-service.api.ledger.com/v1',
      mode: 'prod' as const,
      branch: 'main' as const,
    };

    const web3ChecksConfig = {
      url: 'https://web3checks-backend.api.ledger.com/v3',
    };

    const contextModule = new ContextModuleBuilder({
      originToken: 'origin-token',
    })
      .addCalConfig(calConfig)
      .addWeb3ChecksConfig(web3ChecksConfig)
      .build();

    this.dmk.startDiscovering({ transport: this.transportType }).subscribe({
      next: (device) => {
        this.dmk.connect({ device }).then((sessionId) => {
          const connectedDevice = this.dmk.getConnectedDevice({
            sessionId,
          });
          this.connectedDevice = connectedDevice;

          this.sessionId = sessionId;
          this.ethSigner = new SignerEthBuilder({
            dmk: this.dmk,
            sessionId,
          })
            .withContextModule(contextModule)
            .build();

          this.#setupDeviceStatusListener();
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
  }

  unlock(params: unknown, sendResponse: (response: unknown) => void) {
    console.log('unlock', params);
    this.makeEthApp().then(() => {
      const { observable } = this.ethSigner.getAddress(
        (params as { hdPath: string }).hdPath.replace('m/', ''),
        {
          checkOnDevice: false,
          returnChainCode: false,
        },
      );

      observable.subscribe({
        next: (deviceActionState) => {
          this.handleResponse(deviceActionState, sendResponse);
        },
        error: (error) => {
          console.error(error);
          sendResponse({
            success: false,
            payload: { error: error },
          });
        },
        complete: () => {
          console.log('unlock completed');
        },
      });
    });
  }

  handleResponse(
    deviceActionState: DeviceActionState<
      GetAddressCommandResponse,
      GetAddressDAError,
      GetAddressDAIntermediateValue
    >,
    sendResponse: {
      (response: unknown): void;
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      (arg0: { success: boolean; payload: any }): void;
    },
  ) {
    console.warn(deviceActionState);

    if (deviceActionState.status === DeviceActionStatus.Completed) {
      const output = deviceActionState.output;
      console.log('output is', output);
      const result = output;
      //TODO handle signTypedData, signPersonalMessage, signTransaction
      // if (
      //   action === 'signTypedData' ||
      //   action === 'signPersonalMessage' ||
      //   action === 'signTransaction'
      // ) {
      //   result.r = result.r.replace('0x', '');
      //   result.s = result.s.replace('0x', '');
      //   result.v = result.v.toString();
      // }
      sendResponse({
        success: true,
        payload: result,
      });
    } else if (deviceActionState.status === DeviceActionStatus.Error) {
      sendResponse({
        success: false,
        payload: { error: deviceActionState.error },
      });
    }
  }

  #setupDeviceStatusListener() {
    const { sessionId } = this;
    if (!sessionId) {
      return;
    }
    this.dmk.getDeviceSessionState({ sessionId }).subscribe({
      next: (state) => {
        this.deviceStatus = state.deviceStatus;
      },
      error: (error) => {
        console.error('Error:', error);
      },
      complete: () => {
        console.log('Device session state subscription completed');
      },
    });
  }
}
