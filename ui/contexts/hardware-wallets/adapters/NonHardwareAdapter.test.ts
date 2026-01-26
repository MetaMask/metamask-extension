import { NonHardwareAdapter } from './NonHardwareAdapter';
import type { HardwareWalletAdapterOptions } from '../types';

describe('NonHardwareAdapter', () => {
  const mockOptions: HardwareWalletAdapterOptions = {
    onDisconnect: jest.fn(),
    onAwaitingConfirmation: jest.fn(),
    onDeviceLocked: jest.fn(),
    onAppNotOpen: jest.fn(),
    onDeviceEvent: jest.fn(),
  };

  let adapter: NonHardwareAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new NonHardwareAdapter(mockOptions);
  });

  describe('connect', () => {
    it('resolves successfully without calling any callbacks', async () => {
      await expect(adapter.connect('test-device-id')).resolves.toBeUndefined();

      expect(mockOptions.onDisconnect).not.toHaveBeenCalled();
      expect(mockOptions.onAwaitingConfirmation).not.toHaveBeenCalled();
      expect(mockOptions.onDeviceLocked).not.toHaveBeenCalled();
      expect(mockOptions.onAppNotOpen).not.toHaveBeenCalled();
      expect(mockOptions.onDeviceEvent).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('resolves successfully without calling any callbacks', async () => {
      await expect(adapter.disconnect()).resolves.toBeUndefined();

      expect(mockOptions.onDisconnect).not.toHaveBeenCalled();
      expect(mockOptions.onAwaitingConfirmation).not.toHaveBeenCalled();
      expect(mockOptions.onDeviceLocked).not.toHaveBeenCalled();
      expect(mockOptions.onAppNotOpen).not.toHaveBeenCalled();
      expect(mockOptions.onDeviceEvent).not.toHaveBeenCalled();
    });
  });

  describe('isConnected', () => {
    it('returns true', () => {
      expect(adapter.isConnected()).toBe(true);
    });
  });

  describe('destroy', () => {
    it('does not throw', () => {
      expect(() => adapter.destroy()).not.toThrow();
    });
  });

  describe('ensureDeviceReady', () => {
    it('resolves to true', async () => {
      await expect(
        adapter.ensureDeviceReady('test-device-id'),
      ).resolves.toBe(true);
    });

    it('does not call any callbacks', async () => {
      await adapter.ensureDeviceReady('test-device-id');

      expect(mockOptions.onDisconnect).not.toHaveBeenCalled();
      expect(mockOptions.onAwaitingConfirmation).not.toHaveBeenCalled();
      expect(mockOptions.onDeviceLocked).not.toHaveBeenCalled();
      expect(mockOptions.onAppNotOpen).not.toHaveBeenCalled();
      expect(mockOptions.onDeviceEvent).not.toHaveBeenCalled();
    });
  });
});

