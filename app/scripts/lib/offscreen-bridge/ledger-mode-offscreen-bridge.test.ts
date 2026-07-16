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
  },
}));

let mockIsManifestV3 = true;

jest.mock('../../../../shared/lib/mv3.utils', () => ({
  get isManifestV3() {
    return mockIsManifestV3;
  },
}));

describe('ledger-mode-offscreen-bridge', () => {
  const sendMessageMock = browser.runtime.sendMessage as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
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
  });

  describe('setupLedgerModeOffscreenBridge', () => {
    it('does nothing on MV2', () => {
      mockIsManifestV3 = false;

      const getLedgerMode = jest.fn();
      const subscribe = jest.fn();

      setupLedgerModeOffscreenBridge({
        getLedgerMode,
        controllerMessenger: { subscribe },
      });

      expect(getLedgerMode).not.toHaveBeenCalled();
      expect(subscribe).not.toHaveBeenCalled();
      expect(sendMessageMock).not.toHaveBeenCalled();
    });

    it('pushes the initial ledger mode and subscribes to flag changes', () => {
      const getLedgerMode = jest.fn().mockReturnValue(LedgerHandlerMode.Legacy);
      const subscribe = jest.fn();

      setupLedgerModeOffscreenBridge({
        getLedgerMode,
        controllerMessenger: { subscribe },
      });

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

    it('sends DMK mode when the subscribed selector reports enabled', () => {
      const getLedgerMode = jest.fn().mockReturnValue(LedgerHandlerMode.Legacy);
      let handler: ((isDmkEnabled: boolean) => void) | undefined;
      const subscribe = jest.fn(
        (
          _event: string,
          nextHandler: (isDmkEnabled: boolean) => void,
          _selector: (state: unknown) => boolean,
        ) => {
          handler = nextHandler;
        },
      );

      setupLedgerModeOffscreenBridge({
        getLedgerMode,
        controllerMessenger: { subscribe },
      });

      sendMessageMock.mockClear();
      handler?.(true);

      expect(sendMessageMock).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.switchLedgerMode,
        mode: LedgerHandlerMode.DMK,
      });
    });

    it('sends Legacy mode when the subscribed selector reports disabled', () => {
      const getLedgerMode = jest.fn().mockReturnValue(LedgerHandlerMode.DMK);
      let handler: ((isDmkEnabled: boolean) => void) | undefined;
      const subscribe = jest.fn(
        (
          _event: string,
          nextHandler: (isDmkEnabled: boolean) => void,
          _selector: (state: unknown) => boolean,
        ) => {
          handler = nextHandler;
        },
      );

      setupLedgerModeOffscreenBridge({
        getLedgerMode,
        controllerMessenger: { subscribe },
      });

      sendMessageMock.mockClear();
      handler?.(false);

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

      setupLedgerModeOffscreenBridge({
        getLedgerMode: jest.fn().mockReturnValue(LedgerHandlerMode.Legacy),
        controllerMessenger: { subscribe },
      });

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

      setupLedgerModeOffscreenBridge({
        getLedgerMode: jest.fn().mockReturnValue(LedgerHandlerMode.Legacy),
        controllerMessenger: { subscribe },
      });

      expect(selector?.({ remoteFeatureFlags: {} })).toBe(false);
      expect(selector?.({})).toBe(false);
    });
  });
});
