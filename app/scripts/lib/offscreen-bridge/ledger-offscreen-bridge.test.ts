import {
  HardwareWalletError,
  Severity,
  Category,
} from '@metamask/hw-wallet-sdk';
import {
  LedgerAction,
  OffscreenCommunicationTarget,
} from '../../../../shared/constants/offscreen-communication';
import { LedgerOffscreenBridge } from './ledger-offscreen-bridge';

type SendMessageCallback = (response: unknown) => void;

type ChromeRuntimeMock = {
  sendMessage: jest.Mock;
  lastError?: { message: string };
};

describe('LedgerOffscreenBridge', () => {
  let chromeRuntimeMock: ChromeRuntimeMock;
  let capturedResponseCallback: SendMessageCallback | null;

  beforeEach(() => {
    capturedResponseCallback = null;
    chromeRuntimeMock = {
      sendMessage: jest.fn(
        (_message: unknown, callback: SendMessageCallback) => {
          capturedResponseCallback = callback;
        },
      ),
    };

    Object.defineProperty(globalThis, 'chrome', {
      value: { runtime: chromeRuntimeMock },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Drives the in-flight sendMessage promise by invoking the captured
   * chrome.runtime.sendMessage callback with the supplied response.
   * @param response
   */
  function respond(response: unknown): void {
    if (!capturedResponseCallback) {
      throw new Error('No sendMessage callback was captured');
    }
    capturedResponseCallback(response);
  }

  describe('init / destroy / options', () => {
    it('init resolves to undefined', async () => {
      const bridge = new LedgerOffscreenBridge();
      await expect(bridge.init()).resolves.toBeUndefined();
    });

    it('destroy resolves to undefined', async () => {
      const bridge = new LedgerOffscreenBridge();
      await expect(bridge.destroy()).resolves.toBeUndefined();
    });

    it('getOptions resolves to an empty object', async () => {
      const bridge = new LedgerOffscreenBridge();
      await expect(bridge.getOptions()).resolves.toEqual({});
    });

    it('setOptions resolves to undefined', async () => {
      const bridge = new LedgerOffscreenBridge();
      await expect(bridge.setOptions()).resolves.toBeUndefined();
    });

    it('does NOT expose isDeviceConnected (omitted from the implemented shape)', () => {
      // The offscreen bridge does not own HID state — the offscreen document
      // does. Forcing this property to exist would mislead callers into
      // reading a value that is never updated.
      const bridge = new LedgerOffscreenBridge();
      expect(
        (bridge as unknown as { isDeviceConnected?: unknown })
          .isDeviceConnected,
      ).toBeUndefined();
    });
  });

  describe('action wrappers route to chrome.runtime.sendMessage', () => {
    it('attemptMakeApp sends makeApp with default timeout', async () => {
      const bridge = new LedgerOffscreenBridge();
      const promise = bridge.attemptMakeApp();

      expect(chromeRuntimeMock.sendMessage).toHaveBeenCalledTimes(1);
      const [payload] = chromeRuntimeMock.sendMessage.mock.calls[0];
      expect(payload).toEqual({
        action: LedgerAction.makeApp,
        target: OffscreenCommunicationTarget.ledgerOffscreen,
      });

      respond({ success: true, payload: true });
      await expect(promise).resolves.toBe(true);
    });

    it('updateTransportMethod forwards the transportType param', async () => {
      const bridge = new LedgerOffscreenBridge();
      const promise = bridge.updateTransportMethod('webhid');

      const [payload] = chromeRuntimeMock.sendMessage.mock.calls[0];
      expect(payload).toEqual({
        action: LedgerAction.updateTransport,
        target: OffscreenCommunicationTarget.ledgerOffscreen,
        params: { transportType: 'webhid' },
      });

      respond({ success: true, payload: true });
      await expect(promise).resolves.toBe(true);
    });

    it('getPublicKey forwards the hdPath param and resolves with payload', async () => {
      const bridge = new LedgerOffscreenBridge();
      const expected = {
        publicKey: '04abcd',
        address: '0xabc',
        chainCode: 'cc',
      };
      const promise = bridge.getPublicKey({ hdPath: "m/44'/60'/0'/0/0" });

      const [payload] = chromeRuntimeMock.sendMessage.mock.calls[0];
      expect(payload).toEqual({
        action: LedgerAction.getPublicKey,
        target: OffscreenCommunicationTarget.ledgerOffscreen,
        params: { hdPath: "m/44'/60'/0'/0/0" },
      });

      respond({ success: true, payload: expected });
      await expect(promise).resolves.toEqual(expected);
    });

    it('deviceSignTypedData forwards params and resolves with payload', async () => {
      const bridge = new LedgerOffscreenBridge();
      const params = {
        hdPath: "m/44'/60'/0'/0/0",
        message: {
          domain: {},
          types: { EIP712Domain: [] },
          primaryType: 'EIP712Domain',
          message: {},
        },
      } as unknown as Parameters<
        LedgerOffscreenBridge['deviceSignTypedData']
      >[0];
      const expected = { v: '0x1c', r: '0xrr', s: '0xss' };

      const promise = bridge.deviceSignTypedData(params);
      respond({ success: true, payload: expected });
      await expect(promise).resolves.toEqual(expected);
    });

    it('deviceSignDelegationAuthorization forwards params and resolves with payload', async () => {
      const bridge = new LedgerOffscreenBridge();
      const params = {
        hdPath: "m/44'/60'/0'/0/0",
        chainId: 1,
        contractAddress: '0x1234',
        nonce: 2,
      };
      const expected = { v: '0x1c', r: '0xrr', s: '0xss' };

      const promise = bridge.deviceSignDelegationAuthorization(params);

      const [payload] = chromeRuntimeMock.sendMessage.mock.calls[0];
      expect(payload).toEqual({
        action: LedgerAction.signDelegationAuthorization,
        target: OffscreenCommunicationTarget.ledgerOffscreen,
        params,
      });

      respond({ success: true, payload: expected });
      await expect(promise).resolves.toEqual(expected);
    });
  });

  describe('success response unwrapping', () => {
    it('resolves with payload when present', async () => {
      const bridge = new LedgerOffscreenBridge();
      const promise = bridge.getAppConfiguration();
      respond({ success: true, payload: { version: '1.0.0' } });
      await expect(promise).resolves.toEqual({ version: '1.0.0' });
    });

    it('falls back to response.success when payload is missing', async () => {
      const bridge = new LedgerOffscreenBridge();
      const promise = bridge.attemptMakeApp();
      respond({ success: true });
      await expect(promise).resolves.toBe(true);
    });
  });

  describe('chrome.runtime.lastError', () => {
    it('rejects with the chrome error message', async () => {
      const bridge = new LedgerOffscreenBridge();
      chromeRuntimeMock.lastError = { message: 'port closed' };

      const promise = bridge.attemptMakeApp();
      respond(undefined);

      await expect(promise).rejects.toThrow('port closed');
      // lastError must be cleared so subsequent tests do not leak it.
      chromeRuntimeMock.lastError = undefined;
    });
  });

  describe('error response classification', () => {
    it('rejects with HardwareWalletError when the shape matches', async () => {
      const bridge = new LedgerOffscreenBridge();
      const promise = bridge.getPublicKey({ hdPath: "m/44'/60'/0'/0/0" });

      respond({
        success: false,
        payload: {
          error: {
            name: 'HardwareWalletError',
            message: 'boom',
            code: 2000,
            severity: Severity.Err,
            category: Category.UserAction,
            userMessage: 'user-facing',
          },
        },
      });

      await expect(promise).rejects.toMatchObject({
        name: 'HardwareWalletError',
        message: 'boom',
      });
      const rejection = await promise.catch((error: unknown) => error);
      expect(rejection).toBeInstanceOf(HardwareWalletError);
    });

    it('rejects with createLedgerError for known status codes', async () => {
      // 0x6985 -> user rejected action (mapped)
      const bridge = new LedgerOffscreenBridge();
      const promise = bridge.getPublicKey({ hdPath: "m/44'/60'/0'/0/0" });

      respond({
        success: false,
        payload: { error: { statusCode: 0x6985 } },
      });

      // createLedgerError() returns a HardwareWalletError with a numeric
      // `code` drawn from the ErrorCode enum and a stable message.
      await expect(promise).rejects.toMatchObject({
        name: 'HardwareWalletError',
        message: 'User rejected action on device',
      });
    });

    it('rejects with TransportStatusError for unknown status codes', async () => {
      const bridge = new LedgerOffscreenBridge();
      const promise = bridge.getPublicKey({ hdPath: "m/44'/60'/0'/0/0" });

      respond({
        success: false,
        payload: { error: { statusCode: 0x6fff } },
      });

      // TransportStatusError carries statusCode on the instance.
      await expect(promise).rejects.toMatchObject({
        statusCode: 0x6fff,
      });
    });

    it('rejects with Error(error.message) for plain error.message payloads', async () => {
      const bridge = new LedgerOffscreenBridge();
      const promise = bridge.getPublicKey({ hdPath: "m/44'/60'/0'/0/0" });

      respond({
        success: false,
        payload: { error: { message: 'device unplugged' } },
      });

      await expect(promise).rejects.toThrow('device unplugged');
    });

    it('rejects with a generic Error when payload shape is unrecognised', async () => {
      const bridge = new LedgerOffscreenBridge();
      const promise = bridge.getPublicKey({ hdPath: "m/44'/60'/0'/0/0" });

      respond({ success: false, payload: {} });

      await expect(promise).rejects.toThrow('Unknown Ledger error occurred');
    });
  });

  describe('timeout handling', () => {
    it('rejects with "Ledger iframe timeout" after the configured timeout', async () => {
      jest.useFakeTimers();
      const bridge = new LedgerOffscreenBridge();
      const promise = bridge.attemptMakeApp();

      jest.advanceTimersByTime(5000);

      await expect(promise).rejects.toThrow('Ledger iframe timeout');
    });
  });
});
