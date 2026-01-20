import { DeviceEvent, type HardwareWalletAdapterOptions } from '../types';
import { ErrorCode, HardwareWalletError } from '../errors';
import * as actions from '../../../store/actions';
import { QRAdapter } from './QRAdapter';

// Mock the store actions
jest.mock('../../../store/actions', () => ({
  getHdPathForHardwareKeyring: jest.fn(),
}));

describe('[QRAdapter]', () => {
  let adapter: QRAdapter;
  let mockOptions: HardwareWalletAdapterOptions;

  beforeEach(() => {
    // Setup mock options
    mockOptions = {
      onDisconnect: jest.fn(),
      onAwaitingConfirmation: jest.fn(),
      onDeviceLocked: jest.fn(),
      onAppNotOpen: jest.fn(),
      onDeviceEvent: jest.fn(),
    };

    // Mock HD path
    jest
      .spyOn(actions, 'getHdPathForHardwareKeyring')
      .mockResolvedValue("m/44'/60'/0'/0");

    adapter = new QRAdapter(mockOptions);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should successfully connect to QR device', async () => {
      await adapter.connect('qr-device-1');

      expect(adapter.isConnected()).toBe(true);
      expect(adapter.isSynced()).toBe(false);
      expect(adapter.getDeviceId()).toBe('qr-device-1');
    });

    it('should not be synced immediately after connection', async () => {
      await adapter.connect('qr-device-1');

      expect(adapter.isConnected()).toBe(true);
      expect(adapter.isSynced()).toBe(false);
    });

    it('should handle multiple connect calls', async () => {
      await adapter.connect('qr-device-1');
      await adapter.connect('qr-device-2');

      expect(adapter.isConnected()).toBe(true);
      expect(adapter.getDeviceId()).toBe('qr-device-2');
    });
  });

  describe('disconnect', () => {
    it('should successfully disconnect from QR device', async () => {
      await adapter.connect('qr-device-1');
      await adapter.disconnect();

      expect(adapter.isConnected()).toBe(false);
      expect(adapter.isSynced()).toBe(false);
      expect(adapter.getDeviceId()).toBeNull();
      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith({
        event: DeviceEvent.Disconnected,
      });
    });

    it('should reset sync state on disconnect', async () => {
      await adapter.connect('qr-device-1');
      adapter.markSynced();
      expect(adapter.isSynced()).toBe(true);

      await adapter.disconnect();

      expect(adapter.isSynced()).toBe(false);
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      expect(adapter.isConnected()).toBe(false);
    });

    it('should return true when connected', async () => {
      await adapter.connect('qr-device-1');
      expect(adapter.isConnected()).toBe(true);
    });

    it('should return false after disconnect', async () => {
      await adapter.connect('qr-device-1');
      await adapter.disconnect();
      expect(adapter.isConnected()).toBe(false);
    });
  });

  describe('isSynced and markSynced', () => {
    it('should return false when not synced', () => {
      expect(adapter.isSynced()).toBe(false);
    });

    it('should return true after markSynced is called', async () => {
      await adapter.connect('qr-device-1');
      adapter.markSynced();

      expect(adapter.isSynced()).toBe(true);
    });

    it('should allow marking as synced only when connected', async () => {
      await adapter.connect('qr-device-1');
      adapter.markSynced();

      expect(adapter.isConnected()).toBe(true);
      expect(adapter.isSynced()).toBe(true);
    });
  });

  describe('verifyDeviceReady', () => {
    it('should throw error when device is not connected', async () => {
      await expect(adapter.verifyDeviceReady('qr-device-1')).rejects.toThrow();
    });

    it('should throw error when device is connected but not synced', async () => {
      await adapter.connect('qr-device-1');

      await expect(adapter.verifyDeviceReady('qr-device-1')).rejects.toThrow(
        HardwareWalletError,
      );

      await expect(
        adapter.verifyDeviceReady('qr-device-1'),
      ).rejects.toMatchObject({
        code: ErrorCode.DEVICE_STATE_001,
        message: expect.stringContaining('scan the QR code'),
      });
    });

    it('should succeed when device is connected and synced', async () => {
      await adapter.connect('qr-device-1');
      adapter.markSynced();

      await expect(adapter.verifyDeviceReady('qr-device-1')).resolves.toBe(
        true,
      );
    });

    it('should emit CONNECTION_FAILED event when not synced', async () => {
      await adapter.connect('qr-device-1');

      try {
        await adapter.verifyDeviceReady('qr-device-1');
      } catch {
        // Expected to throw
      }

      expect(mockOptions.onDeviceEvent).toHaveBeenCalledWith({
        event: DeviceEvent.ConnectionFailed,
        error: expect.any(Error),
      });
    });

    it('should auto-connect if not connected', async () => {
      // Should auto-connect but still require sync
      await expect(adapter.verifyDeviceReady('qr-device-1')).rejects.toThrow(
        'scan the QR code',
      );

      expect(adapter.isConnected()).toBe(true);
      expect(adapter.isSynced()).toBe(false);

      // After marking as synced, should succeed
      adapter.markSynced();
      await expect(adapter.verifyDeviceReady('qr-device-1')).resolves.toBe(
        true,
      );
    });
  });

  describe('setPendingOperation', () => {
    it('should set pending operation state', () => {
      adapter.setPendingOperation(true);
      // No public getter, but should not throw
      adapter.setPendingOperation(false);
    });
  });

  describe('destroy', () => {
    it('should clean up all state', async () => {
      await adapter.connect('qr-device-1');
      adapter.markSynced();
      adapter.setPendingOperation(true);

      adapter.destroy();

      expect(adapter.isConnected()).toBe(false);
      expect(adapter.isSynced()).toBe(false);
      expect(adapter.getDeviceId()).toBeNull();
    });

    it('should be safe to call multiple times', async () => {
      await adapter.connect('qr-device-1');

      adapter.destroy();
      adapter.destroy();

      expect(adapter.isConnected()).toBe(false);
    });
  });

  describe('getDeviceId', () => {
    it('should return null when not connected', () => {
      expect(adapter.getDeviceId()).toBeNull();
    });

    it('should return device ID when connected', async () => {
      await adapter.connect('qr-device-1');
      expect(adapter.getDeviceId()).toBe('qr-device-1');
    });

    it('should return null after disconnect', async () => {
      await adapter.connect('qr-device-1');
      await adapter.disconnect();
      expect(adapter.getDeviceId()).toBeNull();
    });
  });

  describe('QR-specific workflow', () => {
    it('should follow complete QR wallet connection flow', async () => {
      // Step 1: Connect (no physical device check)
      await adapter.connect('keystone-wallet-1');
      expect(adapter.isConnected()).toBe(true);
      expect(adapter.isSynced()).toBe(false);

      // Step 2: Attempt operation before sync - should fail
      await expect(
        adapter.verifyDeviceReady('keystone-wallet-1'),
      ).rejects.toThrow('scan the QR code');

      // Step 3: User scans QR code
      adapter.markSynced();
      expect(adapter.isSynced()).toBe(true);

      // Step 4: Verify device ready - should succeed
      await expect(
        adapter.verifyDeviceReady('keystone-wallet-1'),
      ).resolves.toBe(true);

      // Step 5: Disconnect
      await adapter.disconnect();
      expect(adapter.isConnected()).toBe(false);
      expect(adapter.isSynced()).toBe(false);
    });

    it('should handle re-sync after disconnect', async () => {
      // First connection
      await adapter.connect('qr-device-1');
      adapter.markSynced();
      expect(adapter.isSynced()).toBe(true);

      // Disconnect
      await adapter.disconnect();
      expect(adapter.isSynced()).toBe(false);

      // Reconnect - should require sync again
      await adapter.connect('qr-device-1');
      expect(adapter.isSynced()).toBe(false);

      await expect(adapter.verifyDeviceReady('qr-device-1')).rejects.toThrow();

      // Re-sync
      adapter.markSynced();
      await expect(adapter.verifyDeviceReady('qr-device-1')).resolves.toBe(
        true,
      );
    });

    it('should handle switching between different QR devices', async () => {
      // Connect to first device
      await adapter.connect('keystone-1');
      adapter.markSynced();
      expect(adapter.getDeviceId()).toBe('keystone-1');

      // Switch to second device
      await adapter.disconnect();
      await adapter.connect('airgap-1');
      expect(adapter.getDeviceId()).toBe('airgap-1');
      expect(adapter.isSynced()).toBe(false); // Needs re-sync

      // Sync second device
      adapter.markSynced();
      await expect(adapter.verifyDeviceReady('airgap-1')).resolves.toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle errors with proper HardwareWalletError type', async () => {
      await adapter.connect('qr-device-1');

      try {
        await adapter.verifyDeviceReady('qr-device-1');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(HardwareWalletError);
        expect((error as HardwareWalletError).code).toBe(
          ErrorCode.DEVICE_STATE_001,
        );
        expect((error as HardwareWalletError).userActionable).toBe(true);
      }
    });

    it('should preserve error details through reconstruction', async () => {
      await adapter.connect('qr-device-1');

      try {
        await adapter.verifyDeviceReady('qr-device-1');
      } catch (error) {
        const hwError = error as HardwareWalletError;
        expect(hwError.code).toBe(ErrorCode.DEVICE_STATE_001);
        expect(hwError.userMessage).toBeTruthy();
        expect(hwError.retryStrategy).toBeTruthy();
      }
    });
  });

  describe('comparison with USB adapters', () => {
    it('should not perform physical device checks like Ledger/Trezor', async () => {
      // QR adapter should succeed without any WebHID/WebUSB checks
      await expect(adapter.connect('qr-device-1')).resolves.toBeUndefined();

      // No need for device to be physically connected
      expect(adapter.isConnected()).toBe(true);
    });

    it('should have sync requirement instead of app check', async () => {
      await adapter.connect('qr-device-1');

      // QR wallets check sync state, not app state
      await expect(adapter.verifyDeviceReady('qr-device-1')).rejects.toThrow(
        'scan the QR code',
      );

      // After sync, should be ready
      adapter.markSynced();
      await expect(adapter.verifyDeviceReady('qr-device-1')).resolves.toBe(
        true,
      );
    });
  });
});
