import {
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
  TrezorAction,
} from '../../../shared/constants/offscreen-communication';
import init from './trezor';

const mockOn = jest.fn();
const mockInit = jest.fn();
const mockDispose = jest.fn();
const mockGetPublicKey = jest.fn();
const mockEthereumSignTransaction = jest.fn();
const mockEthereumSignMessage = jest.fn();
const mockEthereumSignTypedData = jest.fn();
const mockGetFeatures = jest.fn();
const mockCancel = jest.fn();

jest.mock('@trezor/connect-web', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: {
    on: (...args: unknown[]) => mockOn(...args),
    init: (...args: unknown[]) => mockInit(...args),
    dispose: (...args: unknown[]) => mockDispose(...args),
    getPublicKey: (...args: unknown[]) => mockGetPublicKey(...args),
    ethereumSignTransaction: (...args: unknown[]) =>
      mockEthereumSignTransaction(...args),
    ethereumSignMessage: (...args: unknown[]) =>
      mockEthereumSignMessage(...args),
    ethereumSignTypedData: (...args: unknown[]) =>
      mockEthereumSignTypedData(...args),
    getFeatures: (...args: unknown[]) => mockGetFeatures(...args),
    cancel: (...args: unknown[]) => mockCancel(...args),
  },
  DEVICE: { CONNECT: 'device-connect' },
  DEVICE_EVENT: 'DEVICE_EVENT',
}));

type MessageListener = (
  msg: {
    target: string;
    action?: TrezorAction;
    params?: Record<string, unknown>;
  },
  sender: unknown,
  sendResponse: (response?: unknown) => void,
) => boolean;

describe('Trezor Offscreen', () => {
  let capturedMessageListener: MessageListener;
  let mockSendMessage: jest.Mock;
  let mockAddListener: jest.Mock;

  // The init handler chains several promises (dispose -> init -> respond);
  // a macrotask turn drains all pending microtasks so the chain settles.
  const flush = () =>
    new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

  beforeEach(() => {
    jest.clearAllMocks();

    mockInit.mockResolvedValue(undefined);
    mockDispose.mockResolvedValue(undefined);

    mockSendMessage = jest.fn();
    mockAddListener = jest.fn((callback: MessageListener) => {
      capturedMessageListener = callback;
    });

    Object.defineProperty(globalThis, 'chrome', {
      value: {
        runtime: {
          sendMessage: mockSendMessage,
          onMessage: {
            addListener: mockAddListener,
          },
        },
      },
      writable: true,
      configurable: true,
    });

    init();
  });

  const sendInit = (params?: Record<string, unknown>) => {
    const sendResponse = jest.fn();
    capturedMessageListener(
      {
        target: OffscreenCommunicationTarget.trezorOffscreen,
        action: TrezorAction.init,
        params,
      },
      undefined,
      sendResponse,
    );
    return sendResponse;
  };

  it('registers a single message listener', () => {
    expect(mockAddListener).toHaveBeenCalledTimes(1);
    expect(mockAddListener).toHaveBeenCalledWith(expect.any(Function));
  });

  it('ignores messages that do not target the Trezor offscreen', () => {
    const sendResponse = jest.fn();

    const result = capturedMessageListener(
      { target: 'some-other-target', action: TrezorAction.getPublicKey },
      undefined,
      sendResponse,
    );

    expect(result).toBeUndefined();
    expect(mockGetPublicKey).not.toHaveBeenCalled();
    expect(sendResponse).not.toHaveBeenCalled();
  });

  describe('init', () => {
    it('disposes any stale connection before re-initializing', async () => {
      const params = { manifest: { appName: 'MetaMask', email: 'x@y.z' } };

      const sendResponse = sendInit(params);
      await flush();

      expect(mockDispose).toHaveBeenCalledTimes(1);
      expect(mockInit).toHaveBeenCalledWith(
        expect.objectContaining({
          ...params,
          env: 'webextension',
        }),
      );
      // dispose must happen before init so a stale connection is torn down first.
      expect(mockDispose.mock.invocationCallOrder[0]).toBeLessThan(
        mockInit.mock.invocationCallOrder[0],
      );
      expect(sendResponse).toHaveBeenCalledWith();
    });

    it('does not hardcode the core mode so both Suite Desktop and iframe work', async () => {
      sendInit();
      await flush();

      const initSettings = mockInit.mock.calls[0][0];
      expect(initSettings.coreMode).toBeUndefined();
    });

    it('forwards a caller-provided core mode unchanged', async () => {
      sendInit({ coreMode: 'suite-desktop' });
      await flush();

      const initSettings = mockInit.mock.calls[0][0];
      expect(initSettings.coreMode).toBe('suite-desktop');
    });

    it('re-opens the iframe on a second connection without hanging', async () => {
      await flush();
      sendInit();
      await flush();

      // Simulate the SDK throwing Init_AlreadyInitialized if the previous
      // iframe were not disposed first.
      mockInit.mockImplementationOnce(() => {
        throw Object.assign(new Error('Init_AlreadyInitialized'), {
          code: 'Init_AlreadyInitialized',
        });
      });

      const secondSendResponse = sendInit();
      await flush();

      // The second connection still resolves the bridge (no hang) and the
      // stale connection was disposed on each init.
      expect(mockDispose).toHaveBeenCalledTimes(2);
      expect(secondSendResponse).toHaveBeenCalledWith();
    });

    it('resolves the bridge even when init rejects', async () => {
      mockInit.mockRejectedValueOnce(new Error('boom'));

      const sendResponse = sendInit();
      await flush();

      expect(sendResponse).toHaveBeenCalledWith();
    });

    it('registers the device-connect listener', async () => {
      sendInit();
      await flush();

      expect(mockOn).toHaveBeenCalledWith('DEVICE_EVENT', expect.any(Function));
    });

    it('forwards a connected Trezor device to the extension', async () => {
      sendInit();
      await flush();

      const deviceEventCallback = mockOn.mock.calls[0][1];
      deviceEventCallback({
        type: 'device-connect',
        payload: {
          features: {
            model: 'T',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            minor_version: 2,
          },
        },
      });

      expect(mockSendMessage).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.trezorDeviceConnect,
        payload: { model: 'T', minorVersion: 2 },
      });
    });

    it('ignores non-connect device events', async () => {
      sendInit();
      await flush();

      const deviceEventCallback = mockOn.mock.calls[0][1];
      deviceEventCallback({ type: 'device-changed', payload: {} });

      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('getPublicKey', () => {
    it('passes through the SDK response', async () => {
      const sdkResult = {
        success: true,
        payload: { publicKey: 'abc', chainCode: 'def' },
      };
      mockGetPublicKey.mockResolvedValue(sdkResult);
      const sendResponse = jest.fn();
      const params = { path: "m/44'/60'/0'/0", coin: 'ETH' };

      capturedMessageListener(
        {
          target: OffscreenCommunicationTarget.trezorOffscreen,
          action: TrezorAction.getPublicKey,
          params,
        },
        undefined,
        sendResponse,
      );
      await flush();

      expect(mockGetPublicKey).toHaveBeenCalledWith(params);
      expect(sendResponse).toHaveBeenCalledWith(sdkResult);
    });
  });

  describe('dispose', () => {
    it('disposes the Trezor connection', () => {
      const sendResponse = jest.fn();

      capturedMessageListener(
        {
          target: OffscreenCommunicationTarget.trezorOffscreen,
          action: TrezorAction.dispose,
        },
        undefined,
        sendResponse,
      );

      expect(mockDispose).toHaveBeenCalledTimes(1);
      expect(sendResponse).toHaveBeenCalledWith();
    });
  });

  describe('cancel', () => {
    it('cancels the in-flight Trezor connection', () => {
      const sendResponse = jest.fn();

      capturedMessageListener(
        {
          target: OffscreenCommunicationTarget.trezorOffscreen,
          action: TrezorAction.cancel,
        },
        undefined,
        sendResponse,
      );

      expect(mockCancel).toHaveBeenCalledTimes(1);
      expect(sendResponse).toHaveBeenCalledWith();
    });
  });

  describe('unsupported action', () => {
    it('responds with an error payload', () => {
      const sendResponse = jest.fn();

      capturedMessageListener(
        {
          target: OffscreenCommunicationTarget.trezorOffscreen,
          action: 'not-a-real-action' as TrezorAction,
        },
        undefined,
        sendResponse,
      );

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        payload: { error: 'Trezor action not supported' },
      });
    });
  });
});
