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

function createControllerMessenger({
  mode = LedgerHandlerMode.Legacy,
  subscribe = jest.fn(),
}: {
  mode?: LedgerHandlerMode;
  subscribe?: jest.Mock;
} = {}) {
  const call = jest.fn().mockReturnValue(mode);
  return { call, subscribe };
}

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

    it('swallows errors when sendMessage rejects', async () => {
      sendMessageMock.mockRejectedValueOnce(new Error('offscreen not ready'));

      expect(() =>
        sendSwitchLedgerModeMessage(LedgerHandlerMode.Legacy),
      ).not.toThrow();

      // Flush the rejected sendMessage microtask attached via .catch().
      await expect(Promise.resolve()).resolves.toBeUndefined();
    });
  });

  describe('setupLedgerModeOffscreenBridge', () => {
    it('does nothing on MV2', () => {
      mockIsManifestV3 = false;

      const controllerMessenger = createControllerMessenger();

      setupLedgerModeOffscreenBridge({ controllerMessenger }, null);

      expect(controllerMessenger.call).not.toHaveBeenCalled();
      expect(controllerMessenger.subscribe).not.toHaveBeenCalled();
      expect(addListenerMock).not.toHaveBeenCalled();
      expect(sendMessageMock).not.toHaveBeenCalled();
    });

    it('pushes the initial ledger mode after the offscreen is ready and subscribes to flag changes', async () => {
      const controllerMessenger = createControllerMessenger({
        mode: LedgerHandlerMode.Legacy,
      });
      let markOffscreenReady: (() => void) | undefined;
      const offscreenReady = new Promise<void>((resolve) => {
        markOffscreenReady = resolve;
      });

      setupLedgerModeOffscreenBridge({ controllerMessenger }, offscreenReady);

      expect(controllerMessenger.call).not.toHaveBeenCalled();
      expect(sendMessageMock).not.toHaveBeenCalled();
      markOffscreenReady?.();
      await offscreenReady;
      await Promise.resolve();

      expect(controllerMessenger.call).toHaveBeenCalledTimes(1);
      expect(controllerMessenger.call).toHaveBeenCalledWith(
        'LegacyBackgroundApiService:getLedgerMode',
      );
      expect(sendMessageMock).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.switchLedgerMode,
        mode: LedgerHandlerMode.Legacy,
      });
      expect(controllerMessenger.subscribe).toHaveBeenCalledTimes(1);
      expect(controllerMessenger.subscribe).toHaveBeenCalledWith(
        'RemoteFeatureFlagController:stateChange',
        expect.any(Function),
        expect.any(Function),
      );
    });

    it('resends the current mode when the offscreen router reports ready', () => {
      const controllerMessenger = createControllerMessenger({
        mode: LedgerHandlerMode.DMK,
      });

      setupLedgerModeOffscreenBridge({ controllerMessenger }, neverReady);

      const listener = addListenerMock.mock.calls[0][0];
      listener({
        target: OffscreenCommunicationTarget.extensionMain,
        event: OffscreenCommunicationEvents.ledgerModeReady,
      });

      expect(controllerMessenger.call).toHaveBeenCalledTimes(1);
      expect(controllerMessenger.call).toHaveBeenCalledWith(
        'LegacyBackgroundApiService:getLedgerMode',
      );
      expect(sendMessageMock).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.switchLedgerMode,
        mode: LedgerHandlerMode.DMK,
      });
    });

    it('ignores runtime messages that are not ledgerModeReady for the extension', () => {
      const controllerMessenger = createControllerMessenger({
        mode: LedgerHandlerMode.DMK,
      });

      setupLedgerModeOffscreenBridge({ controllerMessenger }, neverReady);

      const listener = addListenerMock.mock.calls[0][0];
      sendMessageMock.mockClear();
      controllerMessenger.call.mockClear();

      listener({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.ledgerModeReady,
      });
      listener({
        target: OffscreenCommunicationTarget.extensionMain,
        event: OffscreenCommunicationEvents.switchLedgerMode,
      });
      listener({
        target: OffscreenCommunicationTarget.extensionMain,
        event: OffscreenCommunicationEvents.metamaskBackgroundReady,
      });
      listener({});

      expect(controllerMessenger.call).not.toHaveBeenCalled();
      expect(sendMessageMock).not.toHaveBeenCalled();
    });

    it('pushes the current mode immediately when offscreenReady is null', async () => {
      const controllerMessenger = createControllerMessenger({
        mode: LedgerHandlerMode.DMK,
      });

      setupLedgerModeOffscreenBridge({ controllerMessenger }, null);

      await Promise.resolve();

      expect(controllerMessenger.call).toHaveBeenCalledTimes(1);
      expect(controllerMessenger.call).toHaveBeenCalledWith(
        'LegacyBackgroundApiService:getLedgerMode',
      );
      expect(sendMessageMock).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.switchLedgerMode,
        mode: LedgerHandlerMode.DMK,
      });
    });

    it('does not push a mode when offscreenReady rejects', async () => {
      const controllerMessenger = createControllerMessenger({
        mode: LedgerHandlerMode.DMK,
      });
      const offscreenReady = Promise.reject(new Error('offscreen unavailable'));

      setupLedgerModeOffscreenBridge({ controllerMessenger }, offscreenReady);

      await expect(offscreenReady).rejects.toThrow('offscreen unavailable');
      await Promise.resolve();

      expect(controllerMessenger.call).not.toHaveBeenCalled();
      expect(sendMessageMock).not.toHaveBeenCalled();
    });

    it('uses the service-resolved DMK mode when the remote flag is disabled', () => {
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
      const controllerMessenger = createControllerMessenger({
        mode: LedgerHandlerMode.DMK,
        subscribe,
      });

      setupLedgerModeOffscreenBridge({ controllerMessenger }, neverReady);

      sendMessageMock.mockClear();
      handler?.(false);

      expect(controllerMessenger.call).toHaveBeenCalledWith(
        'LegacyBackgroundApiService:getLedgerMode',
      );
      expect(sendMessageMock).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.switchLedgerMode,
        mode: LedgerHandlerMode.DMK,
      });
    });

    it('uses the service-resolved Legacy mode when the remote flag is enabled', () => {
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
      const controllerMessenger = createControllerMessenger({
        mode: LedgerHandlerMode.Legacy,
        subscribe,
      });

      setupLedgerModeOffscreenBridge({ controllerMessenger }, neverReady);

      sendMessageMock.mockClear();
      handler?.(true);

      expect(controllerMessenger.call).toHaveBeenCalledWith(
        'LegacyBackgroundApiService:getLedgerMode',
      );
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
          controllerMessenger: createControllerMessenger({ subscribe }),
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
          controllerMessenger: createControllerMessenger({ subscribe }),
        },
        neverReady,
      );

      expect(selector?.({ remoteFeatureFlags: {} })).toBe(false);
      expect(selector?.({})).toBe(false);
    });

    it('selector returns true for a version-gated ledgerDmk flag that meets minimumVersion', () => {
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
          controllerMessenger: createControllerMessenger({ subscribe }),
        },
        neverReady,
      );

      expect(
        selector?.({
          remoteFeatureFlags: {
            [ENABLE_DMK_FEATURE_FLAG]: {
              enabled: true,
              featureVersion: '13.0.0',
              minimumVersion: '13.0.0',
            },
          },
        }),
      ).toBe(true);
    });

    it('selector returns false for a version-gated ledgerDmk flag with unmet minimumVersion', () => {
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
          controllerMessenger: createControllerMessenger({ subscribe }),
        },
        neverReady,
      );

      expect(
        selector?.({
          remoteFeatureFlags: {
            [ENABLE_DMK_FEATURE_FLAG]: {
              enabled: true,
              featureVersion: '100.0.0',
              minimumVersion: '100.0.0',
            },
          },
        }),
      ).toBe(false);
    });
  });
});
