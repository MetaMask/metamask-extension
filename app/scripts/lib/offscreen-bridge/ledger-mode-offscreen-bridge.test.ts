import browser from 'webextension-polyfill';
import {
  LedgerHandlerMode,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../../../shared/constants/offscreen-communication';
import { ENABLE_DMK_FEATURE_FLAG } from '../../../../shared/lib/hardware-wallets/feature-flags';
import {
  sendSwitchLedgerModeMessage,
  setupLedgerModeOffscreenBridge,
} from './ledger-mode-offscreen-bridge';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
  },
}));

let mockIsManifestV3 = true;
const neverReady = new Promise<void>(() => undefined);

jest.mock('../../../../shared/lib/mv3.utils', () => ({
  get isManifestV3() {
    return mockIsManifestV3;
  },
}));

describe('ledger-mode-offscreen-bridge', () => {
  const sendMessageMock = browser.runtime.sendMessage as jest.Mock;
  const addListenerMock = browser.runtime.onMessage.addListener as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    sendMessageMock.mockResolvedValue(undefined);
    mockIsManifestV3 = true;
  });

  describe('sendSwitchLedgerModeMessage', () => {
    it('sends a switchLedgerMode message with the given mode', () => {
      sendSwitchLedgerModeMessage(LedgerHandlerMode.DMK);

      expect(sendMessageMock).toHaveBeenCalledTimes(1);
      expect(sendMessageMock).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.switchLedgerMode,
        mode: LedgerHandlerMode.DMK,
      });
    });

    it('swallows errors when sendMessage throws', () => {
      sendMessageMock.mockImplementationOnce(() => {
        throw new Error('offscreen not ready');
      });

      expect(() =>
        sendSwitchLedgerModeMessage(LedgerHandlerMode.Legacy),
      ).not.toThrow();
    });

    it('swallows errors when sendMessage rejects', async () => {
      sendMessageMock.mockRejectedValueOnce(new Error('offscreen not ready'));

      sendSwitchLedgerModeMessage(LedgerHandlerMode.Legacy);

      await expect(Promise.resolve()).resolves.toBeUndefined();
    });
  });

  describe('setupLedgerModeOffscreenBridge', () => {
    it('does nothing on MV2', () => {
      mockIsManifestV3 = false;

      const getLedgerMode = jest.fn();
      const subscribe = jest.fn();

      setupLedgerModeOffscreenBridge(
        {
          getLedgerMode,
          controllerMessenger: { subscribe },
        },
        null,
      );

      expect(getLedgerMode).not.toHaveBeenCalled();
      expect(subscribe).not.toHaveBeenCalled();
      expect(addListenerMock).not.toHaveBeenCalled();
      expect(sendMessageMock).not.toHaveBeenCalled();
    });

    it('pushes the initial ledger mode after the offscreen is ready and subscribes to flag changes', async () => {
      const getLedgerMode = jest.fn().mockReturnValue(LedgerHandlerMode.Legacy);
      const subscribe = jest.fn();
      let markOffscreenReady: (() => void) | undefined;
      const offscreenReady = new Promise<void>((resolve) => {
        markOffscreenReady = resolve;
      });

      setupLedgerModeOffscreenBridge(
        {
          getLedgerMode,
          controllerMessenger: { subscribe },
        },
        offscreenReady,
      );

      expect(getLedgerMode).not.toHaveBeenCalled();
      expect(sendMessageMock).not.toHaveBeenCalled();
      markOffscreenReady?.();
      await offscreenReady;
      await Promise.resolve();

      expect(getLedgerMode).toHaveBeenCalledTimes(1);
      expect(sendMessageMock).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.switchLedgerMode,
        mode: LedgerHandlerMode.Legacy,
      });
      expect(subscribe).toHaveBeenCalledTimes(1);
      expect(subscribe).toHaveBeenCalledWith(
        'RemoteFeatureFlagController:stateChange',
        expect.any(Function),
        expect.any(Function),
      );
    });

    it('resends the current mode when the offscreen router reports ready', () => {
      const getLedgerMode = jest.fn().mockReturnValue(LedgerHandlerMode.DMK);

      setupLedgerModeOffscreenBridge(
        {
          getLedgerMode,
          controllerMessenger: { subscribe: jest.fn() },
        },
        neverReady,
      );

      const listener = addListenerMock.mock.calls[0][0];
      listener({
        target: OffscreenCommunicationTarget.extensionMain,
        event: OffscreenCommunicationEvents.ledgerModeReady,
      });

      expect(getLedgerMode).toHaveBeenCalledTimes(1);
      expect(sendMessageMock).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.switchLedgerMode,
        mode: LedgerHandlerMode.DMK,
      });
    });

    it('uses the controller-resolved DMK mode when the remote flag is disabled', () => {
      const getLedgerMode = jest.fn().mockReturnValue(LedgerHandlerMode.DMK);
      let handler: ((isDmkEnabled: boolean) => void) | undefined;
      const subscribe = jest.fn(
        (
          _event: string,
          nextHandler: (isDmkEnabled: boolean) => void,
          _selector: (state: {
            remoteFeatureFlags?: Record<string, unknown>;
          }) => boolean,
        ) => {
          handler = nextHandler;
        },
      );

      setupLedgerModeOffscreenBridge(
        {
          getLedgerMode,
          controllerMessenger: { subscribe },
        },
        neverReady,
      );

      sendMessageMock.mockClear();
      handler?.(false);

      expect(sendMessageMock).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.switchLedgerMode,
        mode: LedgerHandlerMode.DMK,
      });
    });

    it('uses the controller-resolved Legacy mode when the remote flag is enabled', () => {
      const getLedgerMode = jest.fn().mockReturnValue(LedgerHandlerMode.Legacy);
      let handler: ((isDmkEnabled: boolean) => void) | undefined;
      const subscribe = jest.fn(
        (
          _event: string,
          nextHandler: (isDmkEnabled: boolean) => void,
          _selector: (state: {
            remoteFeatureFlags?: Record<string, unknown>;
          }) => boolean,
        ) => {
          handler = nextHandler;
        },
      );

      setupLedgerModeOffscreenBridge(
        {
          getLedgerMode,
          controllerMessenger: { subscribe },
        },
        neverReady,
      );

      sendMessageMock.mockClear();
      handler?.(true);

      expect(sendMessageMock).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.switchLedgerMode,
        mode: LedgerHandlerMode.Legacy,
      });
    });

    it('selector returns true when ledgerDmk flag is enabled', () => {
      let selector:
        | ((state: { remoteFeatureFlags?: Record<string, unknown> }) => boolean)
        | undefined;
      const subscribe = jest.fn(
        (
          _event: string,
          _handler: (isDmkEnabled: boolean) => void,
          nextSelector: (state: {
            remoteFeatureFlags?: Record<string, unknown>;
          }) => boolean,
        ) => {
          selector = nextSelector;
        },
      );

      setupLedgerModeOffscreenBridge(
        {
          getLedgerMode: jest.fn().mockReturnValue(LedgerHandlerMode.Legacy),
          controllerMessenger: { subscribe },
        },
        neverReady,
      );

      expect(
        selector?.({
          remoteFeatureFlags: {
            [ENABLE_DMK_FEATURE_FLAG]: true,
          },
        }),
      ).toBe(true);
    });

    it('selector returns false when ledgerDmk flag is missing', () => {
      let selector:
        | ((state: { remoteFeatureFlags?: Record<string, unknown> }) => boolean)
        | undefined;
      const subscribe = jest.fn(
        (
          _event: string,
          _handler: (isDmkEnabled: boolean) => void,
          nextSelector: (state: {
            remoteFeatureFlags?: Record<string, unknown>;
          }) => boolean,
        ) => {
          selector = nextSelector;
        },
      );

      setupLedgerModeOffscreenBridge(
        {
          getLedgerMode: jest.fn().mockReturnValue(LedgerHandlerMode.Legacy),
          controllerMessenger: { subscribe },
        },
        neverReady,
      );

      expect(selector?.({ remoteFeatureFlags: {} })).toBe(false);
      expect(selector?.({})).toBe(false);
    });
  });
});
