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
// Transports created by the factory, in creation order. `destroy()` mirrors
// `WebHidTransport.destroy()`, which aborts the `navigator.hid` listeners the
// transport registers in its constructor.
type MockTransport = { destroy: jest.Mock };
let mockTransports: MockTransport[] = [];
const mockWebHidTransportFactory: jest.Mock = jest.fn(() => {
  const transport = {
    listenToAvailableDevices: mockListenToAvailableDevices,
    startDiscovering: jest.fn(),
    destroy: jest.fn(),
  };
  mockTransports.push(transport);
  return transport;
});
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

/**
 * Builds a mock bridge, invoking the injected transport factory the way the
 * real `LedgerDmkBridge` does via `DeviceManagementKitBuilder.addTransport()`.
 * The handler relies on that call to capture the transport for teardown.
 *
 * @param opts - The constructor options the handler passed to the bridge.
 * @param opts.transportFactory - The wrapped WebHID transport factory.
 */
const createMockBridge = (opts?: {
  transportFactory?: (deps?: unknown) => unknown;
}) => {
  opts?.transportFactory?.({});
  return {
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
  };
};

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
    mockHidGetDevices.mockResolvedValue([
      { vendorId: Number(LEDGER_USB_VENDOR_ID) },
    ]);
    mockOnSessionStateChangeSubject = new Subject();
    mockTransports = [];
    // `clearAllMocks()` clears calls but not implementations, and the Jest
    // config only sets `restoreMocks` (which covers spies, not `jest.fn()`).
    // Reset explicitly so a persistent `mockImplementation` in one test cannot
    // leak into the next.
    mockBridgeDestroy.mockReset();
    (LedgerDmkBridge as jest.Mock).mockImplementation((opts) =>
      createMockBridge(opts),
    );
    // Default to a permitted Ledger device so the cached-bridge liveness
    // check in ensureBridge() (see the stale-bridge tests below) keeps the
    // bridge cached in existing tests; individual tests override as needed.
    mockHidGetDevices.mockResolvedValue([
      { vendorId: Number(LEDGER_USB_VENDOR_ID) },
    ]);
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

    it('fails fast when no permitted Ledger device is granted', async () => {
      mockHidGetDevices.mockResolvedValue([]);

      const actionPromise = handler.handleAction(LedgerAction.makeApp);
      await expect(actionPromise).rejects.toMatchObject({
        name: 'HardwareWalletError',
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        message: 'No permitted Ledger device found',
      });
      await expect(actionPromise).rejects.toBeInstanceOf(HardwareWalletError);

      expect(mockBridgeStartDiscovering).not.toHaveBeenCalled();
      expect(mockBridgeDestroy).toHaveBeenCalledTimes(1);
    });

    it('skips the permitted-device probe when WebHID is unavailable', async () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });

      await expect(handler.handleAction(LedgerAction.makeApp)).resolves.toBe(
        true,
      );

      // The probe is WebHID-only, so it must not touch `navigator.hid`.
      expect(mockHidGetDevices).not.toHaveBeenCalled();
      expect(mockBridgeStartDiscovering).toHaveBeenCalledTimes(1);
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

    it('wraps non-Error discovery failures as HardwareWalletError with a JSON-stringified message', async () => {
      mockBridgeStartDiscovering.mockReturnValue(
        throwError(() => ({ nested: { circular: true } })),
      );

      await expect(
        handler.handleAction(LedgerAction.makeApp),
      ).rejects.toMatchObject({
        name: 'HardwareWalletError',
        code: ErrorCode.Unknown,
        message: JSON.stringify({ nested: { circular: true } }),
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

    it('forceReset clears bridge state synchronously so the next action rebuilds', async () => {
      const handler = new LedgerDmkBridgeHandler();
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

      handler.forceReset();
      expect(mockBridgeDestroy).toHaveBeenCalledTimes(1);

      (LedgerDmkBridge as jest.Mock).mockClear();
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);
      await expect(handler.handleAction(LedgerAction.makeApp)).resolves.toBe(
        true,
      );
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(1);

      resolveDestroy?.();
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

      mockHidGetDevices.mockResolvedValue([
        { vendorId: Number(LEDGER_USB_VENDOR_ID) },
      ]);
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

    it('does not let a discarded in-flight bridge overwrite the live permitted-device snapshot', async () => {
      const handler = new LedgerDmkBridgeHandler();
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const consoleLogSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);

      const deviceA = { vendorId: Number(LEDGER_USB_VENDOR_ID) };
      const deviceB = { vendorId: Number(LEDGER_USB_VENDOR_ID) };
      const deviceStale = { vendorId: Number(LEDGER_USB_VENDOR_ID) };
      mockHidGetDevices.mockResolvedValue([deviceA]);

      // Start construction A, paused at connect().
      let resolveFirstConnect: ((sessionId: string) => void) | undefined;
      mockBridgeConnect.mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            resolveFirstConnect = resolve;
          }),
      );
      const firstAction = handler.handleAction(LedgerAction.makeApp);
      firstAction.catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(resolveFirstConnect).toBeDefined();

      // Retire construction A mid-flight.
      handler.forceReset();

      // Construction B completes and becomes the live bridge, snapshotting deviceB.
      mockHidGetDevices.mockResolvedValue([deviceB]);
      await expect(handler.handleAction(LedgerAction.makeApp)).resolves.toBe(
        true,
      );
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(2);

      // Finish discarded construction A while a *different* device set is
      // permitted. Its snapshot must not be published over bridge B's.
      mockHidGetDevices.mockResolvedValue([deviceStale]);
      resolveFirstConnect?.('orphan-session-id');
      await expect(firstAction).rejects.toMatchObject({
        code: ErrorCode.DeviceInvalidSession,
      });

      // Bridge B is still healthy: its device is permitted, so the liveness
      // check must reuse it rather than tear it down against deviceStale.
      mockHidGetDevices.mockResolvedValue([deviceB]);
      await expect(handler.handleAction(LedgerAction.makeApp)).resolves.toBe(
        true,
      );

      expect(LedgerDmkBridge).toHaveBeenCalledTimes(2);
      expect(mockBridgeConnect).toHaveBeenCalledTimes(2);
      // Only the orphaned construction A was destroyed.
      expect(mockBridgeDestroy).toHaveBeenCalledTimes(1);

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe('stale bridge / permission revocation', () => {
    let handler: LedgerDmkBridgeHandler;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      handler = new LedgerDmkBridgeHandler();
      // Liveness-check failures are logged; silence for deterministic output.
      consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
    });

    afterEach(async () => {
      consoleErrorSpy.mockRestore();
      await handler.destroy();
    });

    it('reuses the cached bridge when a permitted Ledger device is still present', async () => {
      mockHidGetDevices.mockResolvedValue([
        { vendorId: Number(LEDGER_USB_VENDOR_ID) },
      ]);
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);

      await handler.handleAction(LedgerAction.makeApp);
      await handler.handleAction(LedgerAction.makeApp);

      expect(LedgerDmkBridge).toHaveBeenCalledTimes(1);
      expect(mockBridgeConnect).toHaveBeenCalledTimes(1);
      expect(mockBridgeDestroy).not.toHaveBeenCalled();
    });

    it('tears down and rebuilds the bridge when the WebHID permission grant is revoked', async () => {
      mockHidGetDevices.mockResolvedValue([
        { vendorId: Number(LEDGER_USB_VENDOR_ID) },
      ]);
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);

      await handler.handleAction(LedgerAction.makeApp);
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(1);
      expect(mockBridgeDestroy).not.toHaveBeenCalled();

      // Simulate the user revoking the WebHID permission grant (e.g. via
      // chrome://settings): the device disappears from getDevices() without
      // any native disconnect event firing.
      mockHidGetDevices.mockResolvedValue([]);

      await handler.handleAction(LedgerAction.makeApp);

      // The stale bridge was torn down and a fresh one constructed.
      expect(mockBridgeDestroy).toHaveBeenCalledTimes(1);
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(2);
      expect(mockBridgeConnect).toHaveBeenCalledTimes(2);
    });

    it('tears down and rebuilds the bridge when permission is revoked then re-granted', async () => {
      const deviceA = { vendorId: Number(LEDGER_USB_VENDOR_ID) };
      mockHidGetDevices.mockResolvedValue([deviceA]);
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);

      await handler.handleAction(LedgerAction.makeApp);
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(1);
      expect(mockBridgeDestroy).not.toHaveBeenCalled();

      // Re-grant returns a new HIDDevice with the same vendor ID.
      const deviceB = { vendorId: Number(LEDGER_USB_VENDOR_ID) };
      mockHidGetDevices.mockResolvedValue([deviceB]);
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);

      await handler.handleAction(LedgerAction.makeApp);

      // The bridge must be rebuilt for the new device.
      expect(mockBridgeDestroy).toHaveBeenCalledTimes(1);
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(2);
      expect(mockBridgeConnect).toHaveBeenCalledTimes(2);
    });

    it('does not tear down a replacement bridge when a stale liveness result resolves false', async () => {
      mockHidGetDevices.mockResolvedValue([
        { vendorId: Number(LEDGER_USB_VENDOR_ID) },
      ]);
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);

      // Cache bridge A.
      await handler.handleAction(LedgerAction.makeApp);
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(1);

      // Pause the liveness check while replacing bridge A.
      let resolveGetDevices!: (devices: { vendorId: number }[]) => void;
      mockHidGetDevices.mockImplementationOnce(
        () =>
          new Promise<{ vendorId: number }[]>((resolve) => {
            resolveGetDevices = resolve;
          }),
      );

      const actionPromise = handler.handleAction(LedgerAction.makeApp);
      await new Promise((resolve) => setTimeout(resolve, 0));
      // One call captures bridge A; the second is the pending check.
      expect(mockHidGetDevices).toHaveBeenCalledTimes(2);
      expect(resolveGetDevices).toBeDefined();

      // Replace bridge A with bridge B.
      mockOnSessionStateChangeSubject.next({ connected: false });
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockBridgeDestroy).toHaveBeenCalledTimes(1);

      const action2Promise = handler.handleAction(LedgerAction.makeApp);
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(2);

      // Bridge A's stale result must not destroy bridge B.
      resolveGetDevices?.([]);

      await expect(actionPromise).resolves.toBe(true);
      await expect(action2Promise).resolves.toBe(true);

      expect(LedgerDmkBridge).toHaveBeenCalledTimes(2);
      expect(mockBridgeConnect).toHaveBeenCalledTimes(2);
      // Only bridge A was destroyed.
      expect(mockBridgeDestroy).toHaveBeenCalledTimes(1);
    });

    it('rebuilds immediately on permission revocation even if the stale bridge hangs on destroy()', async () => {
      mockHidGetDevices.mockResolvedValue([
        { vendorId: Number(LEDGER_USB_VENDOR_ID) },
      ]);
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);

      await handler.handleAction(LedgerAction.makeApp);
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(1);

      // A permission-revoked WebHID device is the case most likely to hang
      // on close (its `destroy()` can stall until the transport's own read
      // timeout). Simulate that by never resolving the first bridge's
      // destroy() call.
      let resolveDestroy: (() => void) | undefined;
      mockBridgeDestroy.mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveDestroy = resolve;
          }),
      );

      // Simulate the user revoking the WebHID permission grant.
      mockHidGetDevices.mockResolvedValue([]);
      mockBridgeConnect.mockResolvedValueOnce('rebuilt-session-id');
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);

      // ensureBridge() must not await the hung destroy() — it should clear
      // the stale bridge synchronously and reconstruct right away instead of
      // stalling until destroy() (or its underlying read timeout) settles.
      await expect(handler.handleAction(LedgerAction.makeApp)).resolves.toBe(
        true,
      );

      expect(mockBridgeDestroy).toHaveBeenCalledTimes(1);
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(2);
      expect(mockBridgeConnect).toHaveBeenCalledTimes(2);

      resolveDestroy?.();
    });

    it('keeps the cached bridge when the liveness check throws (fail open)', async () => {
      mockHidGetDevices.mockResolvedValue([
        { vendorId: Number(LEDGER_USB_VENDOR_ID) },
      ]);
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);

      await handler.handleAction(LedgerAction.makeApp);
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(1);

      mockHidGetDevices.mockRejectedValue(new Error('getDevices blew up'));

      await handler.handleAction(LedgerAction.makeApp);

      // Inconclusive check → cached bridge must survive untouched.
      expect(mockBridgeDestroy).not.toHaveBeenCalled();
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(1);
      expect(mockBridgeConnect).toHaveBeenCalledTimes(1);
      expect(mockBridgeGetAppNameAndVersion).toHaveBeenCalledTimes(2);
    });

    it('does not run the liveness check before any bridge is cached', async () => {
      mockHidGetDevices.mockResolvedValue([
        { vendorId: Number(LEDGER_USB_VENDOR_ID) },
      ]);
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);

      await handler.handleAction(LedgerAction.makeApp);

      // One call captures devices. A liveness check would add another.
      expect(mockHidGetDevices).toHaveBeenCalledTimes(1);
      expect(LedgerDmkBridge).toHaveBeenCalledTimes(1);
    });
  });

  // `bridge.destroy()` only calls `dmk.disconnect({ sessionId })`, and
  // `dmk.close()` only closes device sessions. Neither destroys the transport,
  // but `WebHidTransport` registers `navigator.hid` connect/disconnect
  // listeners in its constructor that only `transport.destroy()` aborts. Every
  // bridge rebuild therefore leaks a listener pair — and an orphaned
  // transport's disconnect handler calls `close()` on the event's HIDDevice,
  // which can be the *live* bridge's device — unless the handler destroys the
  // transport itself.
  describe('transport teardown', () => {
    let handler: LedgerDmkBridgeHandler;
    let consoleErrorSpy: jest.SpyInstance;

    /**
     * Builds a cached bridge via a first action.
     */
    async function connectBridge(): Promise<void> {
      mockHidGetDevices.mockResolvedValue([
        { vendorId: Number(LEDGER_USB_VENDOR_ID) },
      ]);
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);
      await handler.handleAction(LedgerAction.makeApp);
    }

    beforeEach(() => {
      handler = new LedgerDmkBridgeHandler();
      consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('captures the transport the bridge creates', async () => {
      await connectBridge();

      expect(mockTransports).toHaveLength(1);
      expect(mockTransports[0].destroy).not.toHaveBeenCalled();

      await handler.destroy();
    });

    it('destroys the transport when the handler is destroyed', async () => {
      await connectBridge();

      await handler.destroy();

      expect(mockTransports[0].destroy).toHaveBeenCalledTimes(1);
    });

    it('destroys the transport when the device disconnects', async () => {
      await connectBridge();

      mockOnSessionStateChangeSubject.next({ connected: false });
      await Promise.resolve();
      await Promise.resolve();

      expect(mockTransports[0].destroy).toHaveBeenCalledTimes(1);
    });

    it('destroys the stale transport when the WebHID permission grant is revoked', async () => {
      await connectBridge();

      mockHidGetDevices.mockResolvedValue([]);
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);
      await handler.handleAction(LedgerAction.makeApp);

      // Stale transport destroyed; the replacement is left alive.
      expect(mockTransports).toHaveLength(2);
      expect(mockTransports[0].destroy).toHaveBeenCalledTimes(1);
      expect(mockTransports[1].destroy).not.toHaveBeenCalled();

      await handler.destroy();
    });

    it('destroys the stale transport synchronously even if the bridge hangs on destroy()', async () => {
      await connectBridge();

      let resolveDestroy: (() => void) | undefined;
      mockBridgeDestroy.mockImplementationOnce(
        async () =>
          new Promise<void>((resolve) => {
            resolveDestroy = resolve;
          }),
      );

      mockHidGetDevices.mockResolvedValue([]);
      setTimeout(() => {
        mockOnSessionStateChangeSubject.next({ connected: true });
      }, 0);
      await handler.handleAction(LedgerAction.makeApp);

      // The HID listeners must be gone even though destroy() never settled.
      expect(mockTransports[0].destroy).toHaveBeenCalledTimes(1);

      resolveDestroy?.();
      await handler.destroy();
    });

    it('destroys the transport on forceReset', async () => {
      await connectBridge();

      handler.forceReset();

      expect(mockTransports[0].destroy).toHaveBeenCalledTimes(1);
    });

    it('destroys the transport when construction fails', async () => {
      mockHidGetDevices.mockResolvedValue([
        { vendorId: Number(LEDGER_USB_VENDOR_ID) },
      ]);
      mockBridgeConnect.mockRejectedValueOnce(new Error('connect failed'));

      await expect(
        handler.handleAction(LedgerAction.makeApp),
      ).rejects.toThrow();

      // A failed construction must not leave an orphaned transport listening.
      expect(mockTransports).toHaveLength(1);
      expect(mockTransports[0].destroy).toHaveBeenCalledTimes(1);
    });

    // The in-flight transport is not yet stored on `#bridgeTransport`, so
    // `#clearBridgeState()` cannot abort it. If `destroyTransport` waited on
    // `bridge.destroy()` — which hangs against a permission-revoked device —
    // the transport's `navigator.hid` listeners would leak for the lifetime
    // of the offscreen document.
    it('destroys the transport without awaiting bridge.destroy() when construction fails', async () => {
      mockHidGetDevices.mockResolvedValue([
        { vendorId: Number(LEDGER_USB_VENDOR_ID) },
      ]);
      mockBridgeConnect.mockRejectedValueOnce(new Error('connect failed'));
      let resolveDestroy: (() => void) | undefined;
      mockBridgeDestroy.mockImplementationOnce(
        async () =>
          new Promise<void>((resolve) => {
            resolveDestroy = resolve;
          }),
      );

      const actionPromise = handler.handleAction(LedgerAction.makeApp);
      actionPromise.catch(() => undefined);

      // Let construction reach its failure path and hang on bridge.destroy().
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(resolveDestroy).toBeDefined();

      // Listeners must already be gone even though destroy() never settled.
      expect(mockTransports).toHaveLength(1);
      expect(mockTransports[0].destroy).toHaveBeenCalledTimes(1);

      resolveDestroy?.();
      await expect(actionPromise).rejects.toThrow();
    });

    it('destroys the transport without awaiting bridge.destroy() when an in-flight bridge is discarded', async () => {
      const consoleLogSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);
      mockHidGetDevices.mockResolvedValue([
        { vendorId: Number(LEDGER_USB_VENDOR_ID) },
      ]);

      let resolveConnect: ((sessionId: string) => void) | undefined;
      mockBridgeConnect.mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            resolveConnect = resolve;
          }),
      );

      const actionPromise = handler.handleAction(LedgerAction.makeApp);
      actionPromise.catch(() => undefined);

      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(resolveConnect).toBeDefined();

      // Retire the handler so the in-flight construction is orphaned.
      await handler.destroy();

      let resolveDestroy: (() => void) | undefined;
      mockBridgeDestroy.mockImplementationOnce(
        async () =>
          new Promise<void>((resolve) => {
            resolveDestroy = resolve;
          }),
      );

      resolveConnect?.('orphan-session-id');
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(resolveDestroy).toBeDefined();

      // The orphaned transport must be destroyed even though the orphaned
      // bridge's destroy() is still hanging.
      expect(mockTransports).toHaveLength(1);
      expect(mockTransports[0].destroy).toHaveBeenCalledTimes(1);

      resolveDestroy?.();
      await expect(actionPromise).rejects.toMatchObject({
        code: ErrorCode.DeviceInvalidSession,
      });
      consoleLogSpy.mockRestore();
    });

    it('does not destroy the transport twice across repeated teardown', async () => {
      await connectBridge();

      await handler.destroy();
      await handler.destroy();
      handler.forceReset();

      expect(mockTransports[0].destroy).toHaveBeenCalledTimes(1);
    });

    it('swallows transport destroy failures', async () => {
      await connectBridge();
      mockTransports[0].destroy.mockImplementationOnce(() => {
        throw new Error('destroy blew up');
      });

      await expect(handler.destroy()).resolves.toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[LedgerDMK] Error destroying transport',
        expect.any(Error),
      );
    });
  });
});
