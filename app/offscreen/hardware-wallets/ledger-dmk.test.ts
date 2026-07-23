import { LedgerDmkBridge } from '@metamask/eth-ledger-bridge-keyring';
import {
  Category,
  ErrorCode,
  HardwareWalletError,
  Severity,
} from '@metamask/hw-wallet-sdk';

import { NEVER, of, Subject, throwError } from 'rxjs';

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

// Mock LedgerDmkBridge
const mockBridgeDestroy = jest.fn();
const mockBridgeGetAppNameAndVersion = jest.fn();
const mockBridgeGetAppConfiguration = jest.fn();
const mockBridgeGetPublicKey = jest.fn();
const mockBridgeDeviceSignTransaction = jest.fn();
const mockBridgeDeviceSignMessage = jest.fn();
const mockBridgeDeviceSignTypedData = jest.fn();
const mockBridgeDeviceSignDelegationAuthorization = jest.fn();
const mockBridgeConnect = jest.fn();
const mockBridgeStartDiscovering = jest.fn();
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
  startDiscovering: mockBridgeStartDiscovering,
  onSessionStateChange: mockOnSessionStateChangeSubject.asObservable(),
});

jest.mock('@metamask/eth-ledger-bridge-keyring', () => ({
  LedgerDmkBridge: jest.fn(),
}));

// Mock WebHID
const mockHidGetDevices = jest.fn();
const mockHidAddEventListener = jest.fn();
const mockHidRemoveEventListener = jest.fn();
Object.defineProperty(globalThis, 'navigator', {
  value: {
    ...globalThis.navigator,
    hid: {
      getDevices: mockHidGetDevices,
      addEventListener: mockHidAddEventListener,
      removeEventListener: mockHidRemoveEventListener,
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

describe('LedgerDmkBridgeHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSessionStateChangeSubject = new Subject();
    (LedgerDmkBridge as jest.Mock).mockImplementation(() => createMockBridge());
    mockBridgeStartDiscovering.mockReturnValue(of({ name: 'MockLedgerDevice' }));
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

  describe('constructBridge error normalization', () => {
    let handler: LedgerDmkBridgeHandler;

    beforeEach(() => {
      jest.useFakeTimers();
      handler = new LedgerDmkBridgeHandler();
    });

    afterEach(async () => {
      await handler.destroy();
      jest.useRealTimers();
    });

    it('throws HardwareWalletError.DeviceDisconnected when device discovery times out', async () => {
      mockBridgeStartDiscovering.mockReturnValue(NEVER);

      const actionPromise = handler.handleAction(LedgerAction.updateTransport);
      const expectation = expect(actionPromise).rejects.toMatchObject({
        name: 'HardwareWalletError',
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        message: 'No permitted Ledger device found',
      });

      await jest.advanceTimersByTimeAsync(15_000);
      await expectation;
      await expect(actionPromise).rejects.toBeInstanceOf(HardwareWalletError);
    });

    it('wraps discovery Errors as HardwareWalletError.Unknown', async () => {
      const discoveryError = new Error('HID permission denied');
      mockBridgeStartDiscovering.mockReturnValue(
        throwError(() => discoveryError),
      );

      await expect(
        handler.handleAction(LedgerAction.updateTransport),
      ).rejects.toMatchObject({
        name: 'HardwareWalletError',
        code: ErrorCode.Unknown,
        severity: Severity.Err,
        category: Category.Connection,
        message: 'HID permission denied',
        cause: discoveryError,
      });
    });

    it('wraps non-Error discovery failures as HardwareWalletError without JSON.stringify', async () => {
      mockBridgeStartDiscovering.mockReturnValue(
        throwError(() => ({ nested: { circular: true } })),
      );

      await expect(
        handler.handleAction(LedgerAction.updateTransport),
      ).rejects.toMatchObject({
        name: 'HardwareWalletError',
        code: ErrorCode.Unknown,
        message: '[object Object]',
      });
    });

    it('preserves HardwareWalletError thrown during discovery', async () => {
      const hwError = new HardwareWalletError('already structured', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'already structured',
      });
      mockBridgeStartDiscovering.mockReturnValue(
        throwError(() => hwError),
      );

      await expect(
        handler.handleAction(LedgerAction.updateTransport),
      ).rejects.toBe(hwError);
    });
  });

  describe('handleAction', () => {
    let handler: LedgerDmkBridgeHandler;

    beforeEach(async () => {
      handler = new LedgerDmkBridgeHandler();
      // Emit a ready session state so ensureBridge() resolves
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
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
        ).rejects.toMatchObject({
          name: 'HardwareWalletError',
          message: 'Missing hdPath parameter',
          code: ErrorCode.Unknown,
        });
      });

      it('throws when hdPath is not a string', async () => {
        await expect(
          handler.handleAction(LedgerAction.getPublicKey, { hdPath: 123 }),
        ).rejects.toMatchObject({
          name: 'HardwareWalletError',
          message: 'Missing hdPath parameter',
          code: ErrorCode.Unknown,
        });
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
        ).rejects.toMatchObject({
          name: 'HardwareWalletError',
          message: 'Missing hdPath or tx parameter',
        });
      });

      it('throws when tx is missing', async () => {
        await expect(
          handler.handleAction(LedgerAction.signTransaction, {
            hdPath: "m/44'/60'/0'/0/0",
          }),
        ).rejects.toMatchObject({
          name: 'HardwareWalletError',
          message: 'Missing hdPath or tx parameter',
        });
      });

      it('wraps plain bridge errors as HardwareWalletError', async () => {
        mockBridgeDeviceSignTransaction.mockRejectedValue(
          new Error('transport blew up'),
        );

        await expect(
          handler.handleAction(LedgerAction.signTransaction, {
            hdPath: "m/44'/60'/0'/0/0",
            tx: '0xdeadbeef',
          }),
        ).rejects.toMatchObject({
          name: 'HardwareWalletError',
          message: 'transport blew up',
          code: ErrorCode.Unknown,
        });
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
        ).rejects.toMatchObject({
          name: 'HardwareWalletError',
          message: 'Missing hdPath or message parameter',
        });
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
        ).rejects.toMatchObject({
          name: 'HardwareWalletError',
          message: 'Missing hdPath or message parameter',
        });
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
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);

      // First action triggers bridge construction
      await handler.handleAction(LedgerAction.updateTransport);
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(1);

      // Second action reuses the cached bridge
      await handler.handleAction(LedgerAction.updateTransport);
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(1);
    });

    it('deduplicates concurrent bridge constructions', async () => {
      const handler = new LedgerDmkBridgeHandler();
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);

      // Fire two actions concurrently before the bridge finishes constructing
      const promise1 = handler.handleAction(LedgerAction.updateTransport);
      const promise2 = handler.handleAction(LedgerAction.updateTransport);
      await Promise.all([promise1, promise2]);

      // Only one bridge should have been constructed
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(1);
    });

    it('destroys the bridge on device disconnect', async () => {
      const handler = new LedgerDmkBridgeHandler();
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
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
      (LedgerDmkBridge as jest.Mock).mockClear();
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);
      await handler.handleAction(LedgerAction.updateTransport);
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(1);
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
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);

      await handler.handleAction(LedgerAction.updateTransport);
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(2);
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

    it('removes HID listeners on destroy()', async () => {
      const handler = new LedgerDmkBridgeHandler();
      mockHidGetDevices.mockResolvedValue([]);
      await handler.init(true);

      expect(mockHidAddEventListener).toHaveBeenCalledWith(
        'connect',
        expect.any(Function),
      );
      expect(mockHidAddEventListener).toHaveBeenCalledWith(
        'disconnect',
        expect.any(Function),
      );

      const connectListener = mockHidAddEventListener.mock.calls.find(
        ([event]) => event === 'connect',
      )?.[1];
      const disconnectListener = mockHidAddEventListener.mock.calls.find(
        ([event]) => event === 'disconnect',
      )?.[1];

      await handler.destroy();

      expect(mockHidRemoveEventListener).toHaveBeenCalledWith(
        'connect',
        connectListener,
      );
      expect(mockHidRemoveEventListener).toHaveBeenCalledWith(
        'disconnect',
        disconnectListener,
      );
    });

    it('discards an in-flight bridge when destroy() runs during construction', async () => {
      const handler = new LedgerDmkBridgeHandler();
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const consoleLogSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);

      let resolveConnect: ((sessionId: string) => void) | undefined;
      mockBridgeConnect.mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            resolveConnect = resolve;
          }),
      );

      const actionPromise = handler.handleAction(LedgerAction.updateTransport);

      // Allow constructBridge to reach the deferred connect().
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(resolveConnect).toBeDefined();

      await handler.destroy();
      resolveConnect?.('late-session-id');
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);

      await expect(actionPromise).rejects.toMatchObject({
        name: 'HardwareWalletError',
        message: 'Ledger bridge was destroyed during construction',
        code: ErrorCode.DeviceInvalidSession,
      });
      expect(mockBridgeDestroy).toHaveBeenCalled();

      // Handler must not keep the late-built bridge; a later action builds fresh.
      mockBridgeDestroy.mockClear();
      (LedgerDmkBridge as jest.Mock).mockClear();
      mockBridgeConnect.mockResolvedValueOnce('fresh-session-id');
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);

      await expect(
        handler.handleAction(LedgerAction.updateTransport),
      ).resolves.toBe(true);
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(1);

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });
});
