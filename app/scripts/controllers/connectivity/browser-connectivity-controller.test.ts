import { Messenger } from '@metamask/messenger';
import { BrowserConnectivityController } from './browser-connectivity-controller';
import {
  ConnectivityStatus,
  CONTROLLER_NAME,
  BrowserConnectivityControllerActions,
  BrowserConnectivityControllerEvents,
  BrowserConnectivityControllerMessenger,
} from './types';

describe('BrowserConnectivityController', () => {
  let controller: BrowserConnectivityController;
  let messenger: BrowserConnectivityControllerMessenger;
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;
  let originalNavigator: typeof globalThis.navigator;

  beforeEach(() => {
    // Save original navigator
    originalNavigator = globalThis.navigator;

    // Mock navigator.onLine
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: true },
      writable: true,
      configurable: true,
    });

    // Mock addEventListener and removeEventListener
    addEventListenerSpy = jest.spyOn(globalThis, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(globalThis, 'removeEventListener');

    // Create messenger
    messenger = new Messenger<
      typeof CONTROLLER_NAME,
      BrowserConnectivityControllerActions,
      BrowserConnectivityControllerEvents
    >({
      namespace: CONTROLLER_NAME,
    });
  });

  afterEach(() => {
    controller?.destroy();
    jest.restoreAllMocks();

    // Restore original navigator
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  describe('constructor', () => {
    it('initializes with online status when navigator.onLine is true', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { onLine: true },
        writable: true,
        configurable: true,
      });

      controller = new BrowserConnectivityController({ messenger });

      expect(controller.state.status).toBe(ConnectivityStatus.Online);
    });

    it('initializes with offline status when navigator.onLine is false', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { onLine: false },
        writable: true,
        configurable: true,
      });

      controller = new BrowserConnectivityController({ messenger });

      expect(controller.state.status).toBe(ConnectivityStatus.Offline);
    });

    it('registers online and offline event listeners', () => {
      controller = new BrowserConnectivityController({ messenger });

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'online',
        expect.any(Function),
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'offline',
        expect.any(Function),
      );
    });

    it('uses provided initial state over navigator.onLine', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { onLine: true },
        writable: true,
        configurable: true,
      });

      controller = new BrowserConnectivityController({
        messenger,
        state: { status: ConnectivityStatus.Offline },
      });

      expect(controller.state.status).toBe(ConnectivityStatus.Offline);
    });
  });

  describe('state changes', () => {
    it('updates state when going offline', () => {
      controller = new BrowserConnectivityController({ messenger });

      // Simulate offline event
      const offlineHandler = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'offline',
      )?.[1];
      offlineHandler?.();

      expect(controller.state.status).toBe(ConnectivityStatus.Offline);
    });

    it('updates state when going online', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { onLine: false },
        writable: true,
        configurable: true,
      });

      controller = new BrowserConnectivityController({ messenger });

      // Simulate online event
      const onlineHandler = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'online',
      )?.[1];
      onlineHandler?.();

      expect(controller.state.status).toBe(ConnectivityStatus.Online);
    });

    it('emits stateChange event when status changes', () => {
      controller = new BrowserConnectivityController({ messenger });

      const eventHandler = jest.fn();
      messenger.subscribe(`${CONTROLLER_NAME}:stateChange`, eventHandler);

      // Simulate offline event
      const offlineHandler = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'offline',
      )?.[1];
      offlineHandler?.();

      expect(eventHandler).toHaveBeenCalledWith(
        { status: ConnectivityStatus.Offline },
        expect.any(Array),
      );
    });

    it('does not emit event when status does not change', () => {
      controller = new BrowserConnectivityController({ messenger });

      const eventHandler = jest.fn();
      messenger.subscribe(`${CONTROLLER_NAME}:stateChange`, eventHandler);

      // Simulate online event when already online
      const onlineHandler = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'online',
      )?.[1];
      onlineHandler?.();

      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('removes event listeners when destroyed', () => {
      controller = new BrowserConnectivityController({ messenger });

      controller.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'online',
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'offline',
        expect.any(Function),
      );
    });
  });

  describe('controller properties', () => {
    it('has correct name property', () => {
      controller = new BrowserConnectivityController({ messenger });

      expect(controller.name).toBe(CONTROLLER_NAME);
    });
  });
});
