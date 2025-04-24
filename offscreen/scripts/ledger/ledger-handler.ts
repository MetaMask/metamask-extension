import {
  type ConnectedDevice,
  type DeviceManagementKit,
  DeviceManagementKitBuilder,
} from '@ledgerhq/device-management-kit';
import { webHidTransportFactory } from '@ledgerhq/device-transport-kit-web-hid';
import { webBleTransportFactory } from '@ledgerhq/device-transport-kit-web-ble';
import {
  ContextModuleBuilder,
  type ContextModuleCalConfig,
} from '@ledgerhq/context-module';
import { SignerEthBuilder } from '@ledgerhq/device-signer-kit-ethereum';

import { WEBHID } from './constants';

export default class LedgerHandler {
  private dmk: DeviceManagementKit;

  private ethSigner!: ReturnType<SignerEthBuilder['build']>;

  private deviceStatus?: string;

  private transportType?: string;

  private sessionId?: string;

  private connectedDevice?: ConnectedDevice;

  constructor() {
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

  async unlock(params: unknown) {
    console.log('unlock', params);
    throw new Error('Method not implemented.');
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
