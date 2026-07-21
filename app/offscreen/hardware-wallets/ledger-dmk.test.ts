import { LedgerDMKBridge } from '@metamask/eth-ledger-bridge-keyring';

import { of, Subject } from 'rxjs';

import { LedgerAction } from '../../../shared/constants/offscreen-communication';

import { LedgerDmkBridgeHandler } from './ledger-dmk';

// Mock the transport factory (virtual: ESM-only package has no CJS export for Jest)
jest.mock(
  '@ledgerhq/device-transport-kit-web-hid',
  () => ({
    webHidTransportFactory: jest.fn(),
  }),
  { virtual: true },
);

// Mock LedgerDMKBridge
const mockBridgeDestroy = jest.fn();
const mockBridgeGetAppNameAndVersion = jest.fn();
const mockBridgeGetAppConfiguration = jest.fn();
const mockBridgeGetPublicKey = jest.fn();
const mockBridgeDeviceSignTransaction = jest.fn();
const mockBridgeDeviceSignMessage = jest.fn();
const mockBridgeDeviceSignTypedData = jest.fn();
const mockBridgeDeviceSignDelegationAuthorization = jest.fn();
const mockBridgeConnect = jest.fn();
const mockBridgeDmkGetDeviceSessionState = jest.fn();
const mockBridgeDmkListenToAvailableDevices = jest.fn();
const mockSessionStateSubject = new Subject<{
  sessionStateType: number;
  currentApp?: { name: string; version: string };
}>();
let mockOnSessionStateChangeSubject = new Subject<{ connected: boolean }>();

const createMockBridge = () => ({
  destroy: mockBridgeDestroy,
  getAppNameAndVersion: mockBridgeGetAppNameAndVersion,
  getAppConfiguration: mockBridgeGetAppConfiguration,
  getPublicKey: mockBridgeGetPublicKey,
  deviceSignTransaction: mockBridgeDeviceSignTransaction,
  deviceSignMessage: mockBridgeDeviceSignMessage,
  deviceSignTypedData: mockBridgeDeviceSignTypedData,
  deviceSignDelegationAuthorization:
    mockBridgeDeviceSignDelegationAuthorization,
  connect: mockBridgeConnect,
  onSessionStateChange: mockOnSessionStateChangeSubject.asObservable(),
  dmk: {
    getDeviceSessionState: mockBridgeDmkGetDeviceSessionState,
    listenToAvailableDevices: mockBridgeDmkListenToAvailableDevices,
  },
});

jest.mock('@metamask/eth-ledger-bridge-keyring', () => ({
  LedgerDMKBridge: jest.fn(),
}));

// Mock WebHID
const mockHidGetDevices = jest.fn();
Object.defineProperty(globalThis, 'navigator', {
  value: {
    ...globalThis.navigator,
    hid: {
      getDevices: mockHidGetDevices,
      addEventListener: jest.fn(),
    },
  },
  writable: true,
});

// Mock chrome.runtime
const mockSendMessage = jest.fn();
const mockAddListener = jest.fn();
const mockChromeRuntime = {
  sendMessage: mockSendMessage,
  onMessage: {
    addListener: mockAddListener,
  },
  lastError: null as { message: string } | null,
};
Object.defineProperty(globalThis, 'chrome', {
  value: {
    ...globalThis.chrome,
    runtime: mockChromeRuntime,
  },
  writable: true,
});

describe('LedgerDMKBridgeHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSessionStateChangeSubject = new Subject();
    (LedgerDMKBridge as jest.Mock).mockImplementation(() => createMockBridge());
    mockBridgeDmkGetDeviceSessionState.mockReturnValue(
      mockSessionStateSubject.asObservable(),
    );
    mockBridgeDmkListenToAvailableDevices.mockReturnValue(
      of([{ name: 'MockLedgerDevice' }]),
    );
    mockBridgeConnect.mockResolvedValue('test-session-id');
    mockBridgeGetAppNameAndVersion.mockResolvedValue({
      appName: 'Ethereum',
      version: '1.0.0',
    });
    mockBridgeGetAppConfiguration.mockResolvedValue({
      arbitraryDataEnabled: 1,
      erc20ProvisioningNecessary: 0,
      starkEnabled: 0,
      starkv2Supported: 0,
      version: '1.0.0',
    });
    mockBridgeGetPublicKey.mockResolvedValue({
      publicKey: '0xabc',
      address: '0x123',
      chainCode: '0xdef',
    });
  });

  describe('handleAction', () => {
    let handler: LedgerDmkBridgeHandler;

    beforeEach(async () => {
      handler = new LedgerDmkBridgeHandler();
      // Emit a ready session state so ensureBridge() resolves
      setTimeout(() => {
        mockSessionStateSubject.next({
          sessionStateType: 1,
          currentApp: { name: 'Ethereum', version: '1.0.0' },
        });
      }, 0);
    });

    describe('makeApp', () => {
      it('routes to bridge.getAppNameAndVersion()', async () => {
        const result = await handler.handleAction(LedgerAction.makeApp);
        expect(mockBridgeGetAppNameAndVersion).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ appName: 'Ethereum', version: '1.0.0' });
      });
    });

    describe('getAppNameAndVersion', () => {
      it('routes to bridge.getAppNameAndVersion()', async () => {
        const result = await handler.handleAction(
          LedgerAction.getAppNameAndVersion,
        );
        expect(mockBridgeGetAppNameAndVersion).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ appName: 'Ethereum', version: '1.0.0' });
      });
    });

    describe('getAppConfiguration', () => {
      it('routes to bridge.getAppConfiguration()', async () => {
        const result = await handler.handleAction(
          LedgerAction.getAppConfiguration,
        );
        expect(mockBridgeGetAppConfiguration).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
          arbitraryDataEnabled: 1,
          erc20ProvisioningNecessary: 0,
          starkEnabled: 0,
          starkv2Supported: 0,
          version: '1.0.0',
        });
      });
    });

    describe('updateTransport', () => {
      it('returns true without touching the bridge', async () => {
        const result = await handler.handleAction(LedgerAction.updateTransport);
        expect(result).toBe(true);
        // Bridge should still have been created since handleAction calls ensureBridge
        expect(mockBridgeGetAppNameAndVersion).not.toHaveBeenCalled();
      });
    });

    describe('getPublicKey', () => {
      it('routes to bridge.getPublicKey()', async () => {
        const result = await handler.handleAction(LedgerAction.getPublicKey, {
          hdPath: "m/44'/60'/0'/0/0",
        });
        expect(mockBridgeGetPublicKey).toHaveBeenCalledWith({
          hdPath: "m/44'/60'/0'/0/0",
        });
        expect(result).toEqual({
          publicKey: '0xabc',
          address: '0x123',
          chainCode: '0xdef',
        });
      });

      it('throws when hdPath is missing', async () => {
        await expect(
          handler.handleAction(LedgerAction.getPublicKey),
        ).rejects.toThrow('Missing hdPath parameter');
      });

      it('throws when hdPath is not a string', async () => {
        await expect(
          handler.handleAction(LedgerAction.getPublicKey, { hdPath: 123 }),
        ).rejects.toThrow('Missing hdPath parameter');
      });
    });

    describe('signTransaction', () => {
      it('routes to bridge.deviceSignTransaction()', async () => {
        mockBridgeDeviceSignTransaction.mockResolvedValue({
          v: '0x1b',
          r: '0xabc',
          s: '0xdef',
        });
        const result = await handler.handleAction(
          LedgerAction.signTransaction,
          { hdPath: "m/44'/60'/0'/0/0", tx: '0xdeadbeef' },
        );
        expect(mockBridgeDeviceSignTransaction).toHaveBeenCalledWith({
          tx: '0xdeadbeef',
          hdPath: "m/44'/60'/0'/0/0",
        });
        expect(result).toEqual({ v: '0x1b', r: '0xabc', s: '0xdef' });
      });

      it('throws when hdPath is missing', async () => {
        await expect(
          handler.handleAction(LedgerAction.signTransaction, {
            tx: '0xdeadbeef',
          }),
        ).rejects.toThrow('Missing hdPath or tx parameter');
      });

      it('throws when tx is missing', async () => {
        await expect(
          handler.handleAction(LedgerAction.signTransaction, {
            hdPath: "m/44'/60'/0'/0/0",
          }),
        ).rejects.toThrow('Missing hdPath or tx parameter');
      });
    });

    describe('signPersonalMessage', () => {
      it('routes to bridge.deviceSignMessage()', async () => {
        mockBridgeDeviceSignMessage.mockResolvedValue({
          v: 27,
          r: '0xabc',
          s: '0xdef',
        });
        const result = await handler.handleAction(
          LedgerAction.signPersonalMessage,
          { hdPath: "m/44'/60'/0'/0/0", message: '0xhello' },
        );
        expect(mockBridgeDeviceSignMessage).toHaveBeenCalledWith({
          hdPath: "m/44'/60'/0'/0/0",
          message: '0xhello',
        });
        expect(result).toEqual({ v: 27, r: '0xabc', s: '0xdef' });
      });

      it('throws when message is missing', async () => {
        await expect(
          handler.handleAction(LedgerAction.signPersonalMessage, {
            hdPath: "m/44'/60'/0'/0/0",
          }),
        ).rejects.toThrow('Missing hdPath or message parameter');
      });
    });

    describe('signTypedData', () => {
      it('routes to bridge.deviceSignTypedData()', async () => {
        const typedMessage = {
          domain: { name: 'Test' },
          types: {},
          primaryType: 'Test',
          message: { value: 1 },
        };
        mockBridgeDeviceSignTypedData.mockResolvedValue({
          v: 27,
          r: '0xabc',
          s: '0xdef',
        });
        const result = await handler.handleAction(LedgerAction.signTypedData, {
          hdPath: "m/44'/60'/0'/0/0",
          message: typedMessage,
        });
        expect(mockBridgeDeviceSignTypedData).toHaveBeenCalledWith({
          hdPath: "m/44'/60'/0'/0/0",
          message: typedMessage,
        });
        expect(result).toEqual({ v: 27, r: '0xabc', s: '0xdef' });
      });

      it('throws when message is not an object', async () => {
        await expect(
          handler.handleAction(LedgerAction.signTypedData, {
            hdPath: "m/44'/60'/0'/0/0",
            message: 'string-not-object',
          }),
        ).rejects.toThrow('Missing hdPath or message parameter');
      });
    });

    describe('signDelegationAuthorization', () => {
      it('routes to bridge.deviceSignDelegationAuthorization()', async () => {
        const params = {
          hdPath: "m/44'/60'/0'/0/0",
          chainId: 1,
          contractAddress: '0x1234',
          nonce: 2,
        };
        mockBridgeDeviceSignDelegationAuthorization.mockResolvedValue({
          v: '0x1c',
          r: '0xabc',
          s: '0xdef',
        });

        const result = await handler.handleAction(
          LedgerAction.signDelegationAuthorization,
          params,
        );

        expect(
          mockBridgeDeviceSignDelegationAuthorization,
        ).toHaveBeenCalledWith(params);
        expect(result).toEqual({ v: '0x1c', r: '0xabc', s: '0xdef' });
      });

      it('throws when a required parameter is missing', async () => {
        await expect(
          handler.handleAction(LedgerAction.signDelegationAuthorization, {
            hdPath: "m/44'/60'/0'/0/0",
            chainId: 1,
            contractAddress: '0x1234',
          }),
        ).rejects.toThrow('Missing delegation authorization parameter');
      });
    });
  });

  describe('bridge lifecycle (state machine)', () => {
    it('caches the bridge across multiple actions', async () => {
      const handler = new LedgerDmkBridgeHandler();
      setTimeout(() => {
        mockSessionStateSubject.next({
          sessionStateType: 1,
          currentApp: { name: 'Ethereum', version: '1.0.0' },
        });
      }, 0);

      // First action triggers bridge construction
      await handler.handleAction(LedgerAction.updateTransport);
      expect(LedgerDMKBridge).toHaveBeenCalledTimes(1);

      // Second action reuses the cached bridge
      await handler.handleAction(LedgerAction.updateTransport);
      expect(LedgerDMKBridge).toHaveBeenCalledTimes(1);
    });

    it('deduplicates concurrent bridge constructions', async () => {
      const handler = new LedgerDmkBridgeHandler();
      setTimeout(() => {
        mockSessionStateSubject.next({
          sessionStateType: 1,
          currentApp: { name: 'Ethereum', version: '1.0.0' },
        });
      }, 0);

      // Fire two actions concurrently before the bridge finishes constructing
      const promise1 = handler.handleAction(LedgerAction.updateTransport);
      const promise2 = handler.handleAction(LedgerAction.updateTransport);
      await Promise.all([promise1, promise2]);

      // Only one bridge should have been constructed
      expect(LedgerDMKBridge).toHaveBeenCalledTimes(1);
    });

    it('destroys the bridge on device disconnect', async () => {
      const handler = new LedgerDmkBridgeHandler();
      setTimeout(() => {
        mockSessionStateSubject.next({
          sessionStateType: 1,
          currentApp: { name: 'Ethereum', version: '1.0.0' },
        });
      }, 0);

      await handler.handleAction(LedgerAction.updateTransport);
      expect(mockBridgeDestroy).not.toHaveBeenCalled();

      // Simulate disconnect
      mockOnSessionStateChangeSubject.next({ connected: false });

      // Wait for the destroy promise to settle
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockBridgeDestroy).toHaveBeenCalledTimes(1);

      // Next action should construct a new bridge
      mockBridgeDestroy.mockClear();
      (LedgerDMKBridge as jest.Mock).mockClear();
      setTimeout(() => {
        mockSessionStateSubject.next({
          sessionStateType: 1,
          currentApp: { name: 'Ethereum', version: '1.0.0' },
        });
      }, 0);
      await handler.handleAction(LedgerAction.updateTransport);
      expect(LedgerDMKBridge).toHaveBeenCalledTimes(1);
    });

    it('retries bridge construction after a failure', async () => {
      const handler = new LedgerDmkBridgeHandler();
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      // First construction fails
      mockBridgeConnect.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(
        handler.handleAction(LedgerAction.updateTransport),
      ).rejects.toThrow('Connection failed');

      // bridgePromise should be cleared so the next call can retry
      mockBridgeConnect.mockResolvedValueOnce('new-session-id');
      setTimeout(() => {
        mockSessionStateSubject.next({
          sessionStateType: 1,
          currentApp: { name: 'Ethereum', version: '1.0.0' },
        });
      }, 0);

      await handler.handleAction(LedgerAction.updateTransport);
      expect(LedgerDMKBridge).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[LedgerDMK] ensureBridge: connect failed',
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });

    it('destroy() is safe to call multiple times', async () => {
      const handler = new LedgerDmkBridgeHandler();
      await handler.destroy();
      await handler.destroy();
      // No error thrown, no crash
    });
  });
});
