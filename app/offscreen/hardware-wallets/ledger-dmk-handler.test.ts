import { LedgerDmkBridge } from '@metamask/eth-ledger-bridge-keyring';
import {
  Category,
  ErrorCode,
  HardwareWalletError,
  Severity,
} from '@metamask/hw-wallet-sdk';

import { firstValueFrom, NEVER, of, Subject, throwError, toArray } from 'rxjs';

import {
  LEDGER_DEVICE_DISCOVERY_TIMEOUT_MS,
  LedgerAction,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../../shared/constants/offscreen-communication';
import { LEDGER_USB_VENDOR_ID } from '../../../shared/constants/hardware-wallets';
import { LedgerDmkBridgeHandler } from './ledger-dmk-handler';

// Mock the transport factory (virtual: ESM-only package has no CJS export for Jest)
const mockListenToAvailableDevices = jest.fn();
const mockWebHidTransportFactory: jest.Mock = jest.fn(() => ({
  listenToAvailableDevices: mockListenToAvailableDevices,
  startDiscovering: jest.fn(),
}));
jest.mock(
  '@ledgerhq/device-transport-kit-web-hid',
  () => ({
    // Wrapper keeps the mock reachable under jest.mock hoisting.
    webHidTransportFactory: (deps?: unknown) =>
      mockWebHidTransportFactory(deps),
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

function installWebHidNavigator(): void {
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      hid: {
        getDevices: mockHidGetDevices,
        addEventListener: mockHidAddEventListener,
        removeEventListener: mockHidRemoveEventListener,
      },
    },
    writable: true,
    configurable: true,
  });
}

installWebHidNavigator();

// Mock chrome.runtime
const mockSendMessage = jest.fn();
const mockAddListener = jest.fn();
const mockChromeRuntime: {
  sendMessage: jest.Mock;
  lastError: { message: string } | null;
  onMessage?: { addListener: jest.Mock };
} = {
  sendMessage: mockSendMessage,
  lastError: null,
};

function installChromeRuntime(): void {
  Object.defineProperty(globalThis, 'chrome', {
    value: {
      runtime: mockChromeRuntime,
    },
    writable: true,
    configurable: true,
  });
}

installChromeRuntime();

describe('LedgerDmkBridgeHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installWebHidNavigator();
    installChromeRuntime();
    delete mockChromeRuntime.onMessage;
    mockOnSessionStateChangeSubject = new Subject();
    (LedgerDmkBridge as jest.Mock).mockImplementation(() => createMockBridge());
    mockListenToAvailableDevices.mockReturnValue(
      of([{ name: 'MockLedgerDevice' }]),
    );
    mockBridgeStartDiscovering.mockReturnValue(
      of({ name: 'MockLedgerDevice' }),
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

  describe('constructBridge error normalization', () => {
    let handler: LedgerDmkBridgeHandler;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.useFakeTimers();
      // ensureBridge logs connect failures; silence for intentional error-path tests.
      consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      handler = new LedgerDmkBridgeHandler();
    });

    afterEach(async () => {
      await handler.destroy();
      consoleErrorSpy.mockRestore();
      jest.useRealTimers();
    });

    it('throws HardwareWalletError.DeviceDisconnected when device discovery times out', async () => {
      mockBridgeStartDiscovering.mockReturnValue(NEVER);

      const actionPromise = handler.handleAction(LedgerAction.makeApp);
      const expectation = expect(actionPromise).rejects.toMatchObject({
        name: 'HardwareWalletError',
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        message: 'No permitted Ledger device found',
      });

      await jest.advanceTimersByTimeAsync(LEDGER_DEVICE_DISCOVERY_TIMEOUT_MS);
      await expectation;
      await expect(actionPromise).rejects.toBeInstanceOf(HardwareWalletError);
      expect(mockBridgeDestroy).toHaveBeenCalledTimes(1);
    });

    it('wraps discovery Errors as HardwareWalletError.Unknown', async () => {
      const discoveryError = new Error('HID permission denied');
      mockBridgeStartDiscovering.mockReturnValue(
        throwError(() => discoveryError),
      );

      await expect(
        handler.handleAction(LedgerAction.makeApp),
      ).rejects.toMatchObject({
        name: 'HardwareWalletError',
        code: ErrorCode.Unknown,
        severity: Severity.Err,
        category: Category.Unknown,
        message: 'HID permission denied',
        metadata: { walletType: 'ledger' },
      });
      expect(mockBridgeDestroy).toHaveBeenCalledTimes(1);
    });

    it('wraps non-Error discovery failures as HardwareWalletError without JSON.stringify', async () => {
      mockBridgeStartDiscovering.mockReturnValue(
        throwError(() => ({ nested: { circular: true } })),
      );

      await expect(
        handler.handleAction(LedgerAction.makeApp),
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
      mockBridgeStartDiscovering.mockReturnValue(throwError(() => hwError));

      await expect(handler.handleAction(LedgerAction.makeApp)).rejects.toBe(
        hwError,
      );
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
      it('verifies reachability and returns a boolean', async () => {
        const result = await handler.handleAction(LedgerAction.makeApp);
        expect(mockBridgeGetAppNameAndVersion).toHaveBeenCalledTimes(1);
        expect(result).toBe(true);
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
      it('returns true without constructing the bridge', async () => {
        const result = await handler.handleAction(LedgerAction.updateTransport);
        expect(result).toBe(true);
        // Short-circuits before ensureBridge(), so no device discovery or
        // bridge construction should occur.
        expect(LedgerDmkBridge).not.toHaveBeenCalled();
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

      it('throws when message is null', async () => {
        await expect(
          handler.handleAction(LedgerAction.signTypedData, {
            hdPath: "m/44'/60'/0'/0/0",
            message: null,
          }),
        ).rejects.toMatchObject({
          name: 'HardwareWalletError',
          message: 'Missing hdPath or message parameter',
        });
      });
    });

    describe('requireActionParams', () => {
      it('throws when params are omitted entirely', async () => {
        await expect(
          handler.handleAction(LedgerAction.getPublicKey),
        ).rejects.toMatchObject({
          name: 'HardwareWalletError',
          message: 'Missing hdPath parameter',
        });
      });

      it('throws when a required string field is empty', async () => {
        await expect(
          handler.handleAction(LedgerAction.signTransaction, {
            hdPath: "m/44'/60'/0'/0/0",
            tx: '',
          }),
        ).rejects.toMatchObject({
          name: 'HardwareWalletError',
          message: 'Missing hdPath or tx parameter',
        });
      });
    });

    it('throws for an unknown action', async () => {
      await expect(
        handler.handleAction('not-a-real-action' as LedgerAction),
      ).rejects.toMatchObject({
        name: 'HardwareWalletError',
        message: 'Unknown Ledger action: not-a-real-action',
        code: ErrorCode.Unknown,
      });
    });

    it('throws for signDelegationAuthorization as an unknown action', async () => {
      await expect(
        handler.handleAction(LedgerAction.signDelegationAuthorization, {
          hdPath: "m/44'/60'/0'/0/0",
          chainId: 1,
          contractAddress: '0x1234',
          nonce: 2,
        }),
      ).rejects.toMatchObject({
        name: 'HardwareWalletError',
        message: `Unknown Ledger action: ${LedgerAction.signDelegationAuthorization}`,
        code: ErrorCode.Unknown,
      });
    });
  });

  describe('init', () => {
    it('does not register a chrome.runtime.onMessage listener', async () => {
      mockChromeRuntime.onMessage = { addListener: mockAddListener };
      mockHidGetDevices.mockResolvedValue([]);

      const handler = new LedgerDmkBridgeHandler();
      await handler.init();

      expect(mockAddListener).not.toHaveBeenCalled();
      await handler.destroy();
    });

    it('notifies the extension when a permitted Ledger is already present', async () => {
      const handler = new LedgerDmkBridgeHandler();
      mockHidGetDevices.mockResolvedValue([
        { vendorId: Number(LEDGER_USB_VENDOR_ID) },
      ]);

      await handler.init();

      expect(mockSendMessage).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.ledgerDeviceConnect,
        payload: true,
      });

      await handler.destroy();
    });

    it('does not notify when no permitted Ledger is present', async () => {
      const handler = new LedgerDmkBridgeHandler();
      mockHidGetDevices.mockResolvedValue([{ vendorId: 0x1234 }]);

      await handler.init();

      expect(mockSendMessage).not.toHaveBeenCalled();
      await handler.destroy();
    });

    it('logs and continues when checking permitted devices fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      mockHidGetDevices.mockRejectedValue(new Error('HID permission denied'));

      const handler = new LedgerDmkBridgeHandler();
      await expect(handler.init()).resolves.toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[LedgerDMK] Error checking for permitted Ledger devices:',
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
      await handler.destroy();
    });

    it('skips HID setup when WebHID is unavailable', async () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });

      const handler = new LedgerDmkBridgeHandler();
      await handler.init();

      expect(mockHidAddEventListener).not.toHaveBeenCalled();
      expect(mockHidGetDevices).not.toHaveBeenCalled();
      await handler.destroy();
    });
  });

  describe('HID device events', () => {
    it('notifies on Ledger disconnect and ignores non-Ledger devices', async () => {
      const handler = new LedgerDmkBridgeHandler();
      mockHidGetDevices.mockResolvedValue([]);
      await handler.init();

      const disconnectListener = mockHidAddEventListener.mock.calls.find(
        ([event]) => event === 'disconnect',
      )?.[1];
      expect(disconnectListener).toBeDefined();

      mockSendMessage.mockClear();
      disconnectListener?.({ device: { vendorId: 0x9999 } });
      expect(mockSendMessage).not.toHaveBeenCalled();

      disconnectListener?.({
        device: { vendorId: Number(LEDGER_USB_VENDOR_ID) },
      });
      expect(mockSendMessage).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.ledgerDeviceConnect,
        payload: false,
      });

      await handler.destroy();
    });
  });

  describe('offscreen transport factory', () => {
    it('redirects startDiscovering to listenToAvailableDevices and flattens devices', async () => {
      const handler = new LedgerDmkBridgeHandler();
      mockListenToAvailableDevices.mockReturnValue(
        of([{ name: 'Ledger A' }, { name: 'Ledger B' }]),
      );
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);

      await handler.handleAction(LedgerAction.makeApp);

      expect(LedgerDmkBridge).toHaveBeenCalledTimes(1);
      const { transportFactory } = (LedgerDmkBridge as jest.Mock).mock
        .calls[0][0];
      expect(typeof transportFactory).toBe('function');

      const wrappedTransport = transportFactory({});
      const devices = await firstValueFrom(
        wrappedTransport.startDiscovering().pipe(toArray()),
      );

      expect(mockListenToAvailableDevices).toHaveBeenCalledTimes(1);
      expect(devices).toEqual([{ name: 'Ledger A' }, { name: 'Ledger B' }]);

      await handler.destroy();
    });
  });

  describe('bridge lifecycle (state machine)', () => {
    it('caches the bridge across multiple actions', async () => {
      const handler = new LedgerDmkBridgeHandler();
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);

      // First action triggers bridge construction
      await handler.handleAction(LedgerAction.makeApp);
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(1);

      // Second action reuses the cached bridge
      await handler.handleAction(LedgerAction.makeApp);
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(1);
    });

    it('deduplicates concurrent bridge constructions', async () => {
      const handler = new LedgerDmkBridgeHandler();
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);

      // Fire two actions concurrently before the bridge finishes constructing
      const promise1 = handler.handleAction(LedgerAction.makeApp);
      const promise2 = handler.handleAction(LedgerAction.makeApp);
      await Promise.all([promise1, promise2]);

      // Only one bridge should have been constructed
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(1);
    });

    it('destroys the bridge on device disconnect', async () => {
      const handler = new LedgerDmkBridgeHandler();
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);

      await handler.handleAction(LedgerAction.makeApp);
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
      await handler.handleAction(LedgerAction.makeApp);
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(1);
    });

    it('clears bridge state before awaiting destroy so a hung destroy cannot stick callers', async () => {
      const handler = new LedgerDmkBridgeHandler();
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const consoleLogSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);

      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);
      await handler.handleAction(LedgerAction.makeApp);

      let resolveDestroy: (() => void) | undefined;
      mockBridgeDestroy.mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveDestroy = resolve;
          }),
      );

      // Disconnect starts tearDownBridge, which must clear this.bridge before
      // awaiting the hung destroy — otherwise ensureBridge would keep returning
      // the mid-destroy instance.
      mockOnSessionStateChangeSubject.next({ connected: false });
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockBridgeDestroy).toHaveBeenCalledTimes(1);
      expect(resolveDestroy).toBeDefined();

      (LedgerDmkBridge as jest.Mock).mockClear();
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);

      await expect(handler.handleAction(LedgerAction.makeApp)).resolves.toBe(
        true,
      );
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(1);

      resolveDestroy?.();
      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('preserves HID listeners on device disconnect (replug still notifies)', async () => {
      const handler = new LedgerDmkBridgeHandler();
      mockHidGetDevices.mockResolvedValue([]);
      await handler.init();

      const connectListener = mockHidAddEventListener.mock.calls.find(
        ([event]) => event === 'connect',
      )?.[1];
      const disconnectListener = mockHidAddEventListener.mock.calls.find(
        ([event]) => event === 'disconnect',
      )?.[1];
      expect(connectListener).toBeDefined();
      expect(disconnectListener).toBeDefined();

      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);
      await handler.handleAction(LedgerAction.makeApp);

      // Simulate unplug
      mockOnSessionStateChangeSubject.next({ connected: false });
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockBridgeDestroy).toHaveBeenCalledTimes(1);

      // The router keeps the handler instance, so HID listeners must remain
      // registered for replug to fire `ledgerDeviceConnect`.
      expect(mockHidRemoveEventListener).not.toHaveBeenCalledWith(
        'connect',
        connectListener,
      );
      expect(mockHidRemoveEventListener).not.toHaveBeenCalledWith(
        'disconnect',
        disconnectListener,
      );

      // Replug should still notify the extension.
      mockSendMessage.mockClear();
      connectListener?.({ device: { vendorId: Number(LEDGER_USB_VENDOR_ID) } });
      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          event: OffscreenCommunicationEvents.ledgerDeviceConnect,
          payload: true,
        }),
      );

      // Full destroy() (hot-swap) still removes the listeners.
      mockHidRemoveEventListener.mockClear();
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

    it('retries bridge construction after a failure', async () => {
      const handler = new LedgerDmkBridgeHandler();
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      // First construction fails
      mockBridgeConnect.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(handler.handleAction(LedgerAction.makeApp)).rejects.toThrow(
        'Connection failed',
      );
      // Failed constructBridge must destroy the orphaned DMK instance.
      expect(mockBridgeDestroy).toHaveBeenCalledTimes(1);

      // bridgePromise should be cleared so the next call can retry
      mockBridgeConnect.mockResolvedValueOnce('new-session-id');
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);

      await handler.handleAction(LedgerAction.makeApp);
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[LedgerDMK] ensureBridge: connect failed',
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });

    it('destroy() is safe to call multiple times', async () => {
      const handler = new LedgerDmkBridgeHandler();
      await expect(handler.destroy()).resolves.toBeUndefined();
      await expect(handler.destroy()).resolves.toBeUndefined();
    });

    it('removes HID listeners on destroy()', async () => {
      const handler = new LedgerDmkBridgeHandler();
      mockHidGetDevices.mockResolvedValue([]);
      await handler.init();

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

      const actionPromise = handler.handleAction(LedgerAction.makeApp);

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

      await expect(handler.handleAction(LedgerAction.makeApp)).resolves.toBe(
        true,
      );
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(1);

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('does not let an orphan destroy tear down a newer in-flight bridge', async () => {
      const handler = new LedgerDmkBridgeHandler();
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const consoleLogSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);

      // Orphan destroy emits disconnect — previously this re-ran tearDownBridge
      // via a monitor attached too early in constructBridge.
      mockBridgeDestroy.mockImplementation(async () => {
        mockOnSessionStateChangeSubject.next({ connected: false });
      });

      let resolveFirstConnect: ((sessionId: string) => void) | undefined;
      mockBridgeConnect.mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            resolveFirstConnect = resolve;
          }),
      );

      const firstAction = handler.handleAction(LedgerAction.makeApp);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(resolveFirstConnect).toBeDefined();

      // Retire the first construction (hot-swap / destroy).
      await handler.destroy();

      // Start a second construction before the orphan finishes being discarded.
      mockBridgeConnect.mockResolvedValueOnce('second-session-id');
      const secondAction = handler.handleAction(LedgerAction.makeApp);

      // Finish the orphaned first construction; discard path destroys it.
      resolveFirstConnect?.('orphan-session-id');
      await expect(firstAction).rejects.toMatchObject({
        code: ErrorCode.DeviceInvalidSession,
      });

      // Second construction must still succeed — orphan disconnect must not
      // bump generation / clear bridgePromise for the newer attempt.
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);
      await expect(secondAction).resolves.toBe(true);

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });
});
