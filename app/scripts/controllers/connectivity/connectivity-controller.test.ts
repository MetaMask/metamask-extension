import { Messenger } from '@metamask/messenger';
import { ConnectivityController } from './connectivity-controller';
import { PassiveConnectivityService } from './passive-connectivity-service';
import {
  ConnectivityStatus,
  controllerName,
  ConnectivityControllerActions,
  ConnectivityControllerEvents,
  ConnectivityControllerMessenger,
  ConnectivityService,
} from './types';

describe('ConnectivityController', () => {
  let controller: ConnectivityController;
  let messenger: ConnectivityControllerMessenger;

  beforeEach(() => {
    messenger = new Messenger<
      typeof controllerName,
      ConnectivityControllerActions,
      ConnectivityControllerEvents
    >({
      namespace: controllerName,
    });
  });

  afterEach(() => {
    controller?.destroy();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('uses service initial state when online', () => {
      const mockService: ConnectivityService = {
        isOnline: jest.fn().mockReturnValue(true),
        onConnectivityChange: jest.fn(),
        destroy: jest.fn(),
      };

      controller = new ConnectivityController({
        messenger,
        connectivityService: mockService,
      });

      expect(controller.state.connectivityStatus).toBe(
        ConnectivityStatus.Online,
      );
      expect(mockService.isOnline).toHaveBeenCalled();
    });

    it('uses service initial state when offline', () => {
      const mockService: ConnectivityService = {
        isOnline: jest.fn().mockReturnValue(false),
        onConnectivityChange: jest.fn(),
        destroy: jest.fn(),
      };

      controller = new ConnectivityController({
        messenger,
        connectivityService: mockService,
      });

      expect(controller.state.connectivityStatus).toBe(
        ConnectivityStatus.Offline,
      );
    });

    it('subscribes to service connectivity changes', () => {
      const mockService: ConnectivityService = {
        isOnline: jest.fn().mockReturnValue(true),
        onConnectivityChange: jest.fn(),
        destroy: jest.fn(),
      };

      controller = new ConnectivityController({
        messenger,
        connectivityService: mockService,
      });

      expect(mockService.onConnectivityChange).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it('has correct name property', () => {
      const mockService: ConnectivityService = {
        isOnline: jest.fn().mockReturnValue(true),
        onConnectivityChange: jest.fn(),
        destroy: jest.fn(),
      };

      controller = new ConnectivityController({
        messenger,
        connectivityService: mockService,
      });

      expect(controller.name).toBe(controllerName);
    });
  });

  describe('service callbacks', () => {
    it('updates state when service reports offline', () => {
      const mockOnConnectivityChange = jest.fn();
      const mockService: ConnectivityService = {
        isOnline: jest.fn().mockReturnValue(true),
        onConnectivityChange: mockOnConnectivityChange,
        destroy: jest.fn(),
      };

      controller = new ConnectivityController({
        messenger,
        connectivityService: mockService,
      });

      expect(controller.state.connectivityStatus).toBe(
        ConnectivityStatus.Online,
      );

      // Get the callback that was passed to onConnectivityChange
      const capturedCallback = mockOnConnectivityChange.mock.calls[0]?.[0] as
        | ((isOnline: boolean) => void)
        | undefined;
      expect(capturedCallback).toBeDefined();

      // Simulate service reporting offline
      capturedCallback?.(false);

      expect(controller.state.connectivityStatus).toBe(
        ConnectivityStatus.Offline,
      );
    });

    it('updates state when service reports online', () => {
      const mockOnConnectivityChange = jest.fn();
      const mockService: ConnectivityService = {
        isOnline: jest.fn().mockReturnValue(false),
        onConnectivityChange: mockOnConnectivityChange,
        destroy: jest.fn(),
      };

      controller = new ConnectivityController({
        messenger,
        connectivityService: mockService,
      });

      expect(controller.state.connectivityStatus).toBe(
        ConnectivityStatus.Offline,
      );

      // Get the callback that was passed to onConnectivityChange
      const capturedCallback = mockOnConnectivityChange.mock.calls[0]?.[0] as
        | ((isOnline: boolean) => void)
        | undefined;
      expect(capturedCallback).toBeDefined();

      // Simulate service reporting online
      capturedCallback?.(true);

      expect(controller.state.connectivityStatus).toBe(
        ConnectivityStatus.Online,
      );
    });

    it('emits stateChange event when status changes', () => {
      const mockOnConnectivityChange = jest.fn();
      const mockService: ConnectivityService = {
        isOnline: jest.fn().mockReturnValue(true),
        onConnectivityChange: mockOnConnectivityChange,
        destroy: jest.fn(),
      };

      controller = new ConnectivityController({
        messenger,
        connectivityService: mockService,
      });

      const eventHandler = jest.fn();
      messenger.subscribe(`${controllerName}:stateChange`, eventHandler);

      // Get the callback that was passed to onConnectivityChange
      const capturedCallback = mockOnConnectivityChange.mock.calls[0]?.[0] as
        | ((isOnline: boolean) => void)
        | undefined;
      expect(capturedCallback).toBeDefined();

      capturedCallback?.(false);

      expect(eventHandler).toHaveBeenCalledWith(
        { connectivityStatus: ConnectivityStatus.Offline },
        expect.any(Array),
      );
    });

    it('does not emit event when status does not change', () => {
      const mockOnConnectivityChange = jest.fn();
      const mockService: ConnectivityService = {
        isOnline: jest.fn().mockReturnValue(true),
        onConnectivityChange: mockOnConnectivityChange,
        destroy: jest.fn(),
      };

      controller = new ConnectivityController({
        messenger,
        connectivityService: mockService,
      });

      const eventHandler = jest.fn();
      messenger.subscribe(`${controllerName}:stateChange`, eventHandler);

      // Get the callback that was passed to onConnectivityChange
      const capturedCallback = mockOnConnectivityChange.mock.calls[0]?.[0] as
        | ((isOnline: boolean) => void)
        | undefined;
      expect(capturedCallback).toBeDefined();

      // Report online when already online
      capturedCallback?.(true);

      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  describe('with PassiveConnectivityService', () => {
    it('updates state when service.setStatus is called', () => {
      const service = new PassiveConnectivityService();

      controller = new ConnectivityController({
        messenger,
        connectivityService: service,
      });

      expect(controller.state.connectivityStatus).toBe(
        ConnectivityStatus.Online,
      );

      service.setStatus(false);

      expect(controller.state.connectivityStatus).toBe(
        ConnectivityStatus.Offline,
      );
    });
  });

  describe('destroy', () => {
    it('calls service destroy', () => {
      const mockService: ConnectivityService = {
        isOnline: jest.fn().mockReturnValue(true),
        onConnectivityChange: jest.fn(),
        destroy: jest.fn(),
      };

      controller = new ConnectivityController({
        messenger,
        connectivityService: mockService,
      });

      controller.destroy();

      expect(mockService.destroy).toHaveBeenCalled();
    });
  });
});
