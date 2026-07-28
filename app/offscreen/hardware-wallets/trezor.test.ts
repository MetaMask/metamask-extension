import {
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
  TrezorAction,
} from '../../../shared/constants/offscreen-communication';
import type initType from './trezor';

const mockOn = jest.fn();
const mockInit = jest.fn();
const mockDispose = jest.fn();
const mockGetPublicKey = jest.fn();
const mockEthereumSignTransaction = jest.fn();
const mockEthereumSignMessage = jest.fn();
const mockEthereumSignTypedData = jest.fn();
const mockGetFeatures = jest.fn();

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
  },
  DEVICE: {
    CONNECT: 'device-connect',
    CHANGED: 'device-changed',
    DISCONNECT: 'device-disconnect',
  },
  DEVICE_EVENT: 'DEVICE_EVENT',
  DeviceUniquePath: (path: string) => path,
}));

type MessageListener = (
  msg: {
    target: string;
    action?: TrezorAction;
    deviceId?: string;
    params?: Record<string, unknown>;
  },
  sender: unknown,
  sendResponse: (response?: unknown) => void,
) => boolean;

describe('Trezor Offscreen', () => {
  let capturedMessageListener: MessageListener;
  let mockSendMessage: jest.Mock;
  let mockAddListener: jest.Mock;

  // The init handler chains several promises; a macrotask turn drains all
  // pending microtasks so the chain settles.
  const flush = () =>
    new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

  const featuresFixture = (
    deviceId: string,
    overrides: Record<string, unknown> = {},
  ) => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    device_id: deviceId,
    model: 'T',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    minor_version: 2,
    label: null,
    ...overrides,
  });

  const connectDevice = (
    deviceId: string,
    path: string,
    overrides: Record<string, unknown> = {},
  ) => {
    const deviceEventCallback = mockOn.mock.calls[0][1];
    deviceEventCallback({
      type: 'device-connect',
      payload: { features: featuresFixture(deviceId, overrides), path },
    });
  };

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

    // `trezor.ts` intentionally keeps module-level state (the device
    // registry, the shared init promise, the active-keyring count) for the
    // lifetime of the offscreen document, since that is what lets it
    // survive multiple keyrings pairing/disposing independently. Reset the
    // module registry so each test starts from a fresh "offscreen document
    // just loaded" state instead of leaking state across tests.
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const init: typeof initType = require('./trezor').default;
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

  const sendDispose = () => {
    const sendResponse = jest.fn();
    capturedMessageListener(
      {
        target: OffscreenCommunicationTarget.trezorOffscreen,
        action: TrezorAction.dispose,
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
    it('initializes the SDK with the caller-provided settings', async () => {
      const params = { manifest: { appName: 'MetaMask', email: 'x@y.z' } };

      const sendResponse = sendInit(params);
      await flush();

      expect(mockInit).toHaveBeenCalledTimes(1);
      expect(mockInit).toHaveBeenCalledWith(
        expect.objectContaining({
          ...params,
          env: 'webextension',
        }),
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

    it('does not re-initialize or dispose the shared SDK for a second keyring', async () => {
      const firstResponse = sendInit();
      await flush();

      const secondResponse = sendInit();
      await flush();

      // Two Trezor/OneKey keyrings sharing this offscreen document must not
      // tear down or duplicate each other's session: the SDK singleton is
      // initialized exactly once regardless of how many keyrings call
      // `init`.
      expect(mockInit).toHaveBeenCalledTimes(1);
      expect(mockDispose).not.toHaveBeenCalled();
      expect(firstResponse).toHaveBeenCalledWith();
      expect(secondResponse).toHaveBeenCalledWith();
    });

    it('allows a retry after a hard init failure', async () => {
      mockInit.mockRejectedValueOnce(new Error('boom'));
      sendInit();
      await flush();

      mockInit.mockResolvedValueOnce(undefined);
      const secondResponse = sendInit();
      await flush();

      expect(mockInit).toHaveBeenCalledTimes(2);
      expect(secondResponse).toHaveBeenCalledWith();
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

      connectDevice('device-a', '1', { label: 'My Trezor' });

      expect(mockSendMessage).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.trezorDeviceConnect,
        payload: {
          deviceId: 'device-a',
          path: '1',
          label: 'My Trezor',
          model: 'T',
          minorVersion: 2,
        },
      });
    });

    it('ignores connect events for a device with no device_id', async () => {
      sendInit();
      await flush();

      const deviceEventCallback = mockOn.mock.calls[0][1];
      deviceEventCallback({
        type: 'device-connect',
        payload: { features: {}, path: '1' },
      });

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('tracks a device reported via a CHANGED event the same as CONNECT', async () => {
      sendInit();
      await flush();

      const deviceEventCallback = mockOn.mock.calls[0][1];
      deviceEventCallback({
        type: 'device-changed',
        payload: { features: featuresFixture('device-a'), path: '1' },
      });

      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          event: OffscreenCommunicationEvents.trezorDeviceConnect,
        }),
      );
    });

    it('ignores unrelated device event types', async () => {
      sendInit();
      await flush();

      const deviceEventCallback = mockOn.mock.calls[0][1];
      deviceEventCallback({ type: 'button', payload: {} });

      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('listDevices', () => {
    it('returns an empty list before any device has connected', () => {
      const sendResponse = jest.fn();
      capturedMessageListener(
        {
          target: OffscreenCommunicationTarget.trezorOffscreen,
          action: TrezorAction.listDevices,
        },
        undefined,
        sendResponse,
      );

      expect(sendResponse).toHaveBeenCalledWith([]);
    });

    it('lists every currently-connected device', async () => {
      sendInit();
      await flush();
      connectDevice('device-a', '1');
      connectDevice('device-b', '2');

      const sendResponse = jest.fn();
      capturedMessageListener(
        {
          target: OffscreenCommunicationTarget.trezorOffscreen,
          action: TrezorAction.listDevices,
        },
        undefined,
        sendResponse,
      );

      expect(sendResponse).toHaveBeenCalledWith([
        expect.objectContaining({ deviceId: 'device-a', path: '1' }),
        expect.objectContaining({ deviceId: 'device-b', path: '2' }),
      ]);
    });

    it('removes a device on disconnect', async () => {
      sendInit();
      await flush();
      connectDevice('device-a', '1');

      const deviceEventCallback = mockOn.mock.calls[0][1];
      deviceEventCallback({
        type: 'device-disconnect',
        payload: { path: '1' },
      });

      const sendResponse = jest.fn();
      capturedMessageListener(
        {
          target: OffscreenCommunicationTarget.trezorOffscreen,
          action: TrezorAction.listDevices,
        },
        undefined,
        sendResponse,
      );

      expect(sendResponse).toHaveBeenCalledWith([]);
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

    it('targets a specific device once its deviceId is known', async () => {
      sendInit();
      await flush();
      connectDevice('device-a', '1');
      connectDevice('device-b', '2');

      mockGetPublicKey.mockResolvedValue({ success: true, payload: {} });
      const sendResponse = jest.fn();
      const params = { path: "m/44'/60'/0'/0", coin: 'ETH' };

      capturedMessageListener(
        {
          target: OffscreenCommunicationTarget.trezorOffscreen,
          action: TrezorAction.getPublicKey,
          deviceId: 'device-b',
          params,
        },
        undefined,
        sendResponse,
      );
      await flush();

      expect(mockGetPublicKey).toHaveBeenCalledWith({
        ...params,
        device: { path: '2' },
      });
    });

    it('omits the device param for an unknown deviceId', async () => {
      mockGetPublicKey.mockResolvedValue({ success: true, payload: {} });
      const sendResponse = jest.fn();
      const params = { path: "m/44'/60'/0'/0", coin: 'ETH' };

      capturedMessageListener(
        {
          target: OffscreenCommunicationTarget.trezorOffscreen,
          action: TrezorAction.getPublicKey,
          deviceId: 'unknown-device',
          params,
        },
        undefined,
        sendResponse,
      );
      await flush();

      expect(mockGetPublicKey).toHaveBeenCalledWith(params);
    });
  });

  describe('dispose', () => {
    it('disposes the Trezor connection when no keyring is active', () => {
      const sendResponse = sendDispose();

      expect(mockDispose).toHaveBeenCalledTimes(1);
      expect(sendResponse).toHaveBeenCalledWith();
    });

    it('does not dispose the shared SDK while another device is still active', async () => {
      sendInit();
      await flush();
      sendInit();
      await flush();

      // Only one of the two keyrings sharing this document disposes (e.g.
      // its device was forgotten); the other's session must survive.
      const sendResponse = sendDispose();

      expect(mockDispose).not.toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith();
    });

    it('disposes the shared SDK once every active keyring has disposed', async () => {
      sendInit();
      await flush();
      sendInit();
      await flush();

      sendDispose();
      const secondResponse = sendDispose();

      expect(mockDispose).toHaveBeenCalledTimes(1);
      expect(secondResponse).toHaveBeenCalledWith();
    });

    it('clears the tracked devices once fully disposed', async () => {
      sendInit();
      await flush();
      connectDevice('device-a', '1');

      sendDispose();

      const sendResponse = jest.fn();
      capturedMessageListener(
        {
          target: OffscreenCommunicationTarget.trezorOffscreen,
          action: TrezorAction.listDevices,
        },
        undefined,
        sendResponse,
      );
      expect(sendResponse).toHaveBeenCalledWith([]);
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
