import {
  HardwareWalletType,
  HardwareConnectionPermissionState,
} from '../types';

/**
 * Mock implementation of webHIDUtils for testing
 */

// Mock functions
export const isWebHIDAvailable = jest.fn();
export const isWebUSBAvailable = jest.fn();
export const checkWebHIDPermission = jest.fn();
export const checkWebUSBPermission = jest.fn();
export const checkHardwareWalletPermission = jest.fn();
export const requestWebHIDPermission = jest.fn();
export const requestWebUSBPermission = jest.fn();
export const requestHardwareWalletPermission = jest.fn();
export const getDeviceId = jest.fn();
export const getHardwareWalletDeviceId = jest.fn();
export const subscribeToWebHIDEvents = jest.fn();
export const subscribeToWebUSBEvents = jest.fn();
export const subscribeToHardwareWalletEvents = jest.fn();

// Default mock implementations
isWebHIDAvailable.mockReturnValue(true);
isWebUSBAvailable.mockReturnValue(true);
checkWebHIDPermission.mockResolvedValue(
  HardwareConnectionPermissionState.Granted,
);
checkWebUSBPermission.mockResolvedValue(
  HardwareConnectionPermissionState.Granted,
);
checkHardwareWalletPermission.mockImplementation(
  (walletType: HardwareWalletType) => {
    switch (walletType) {
      case HardwareWalletType.Ledger:
        return Promise.resolve(HardwareConnectionPermissionState.Granted);
      case HardwareWalletType.Trezor:
        return Promise.resolve(HardwareConnectionPermissionState.Granted);
      default:
        return Promise.resolve(HardwareConnectionPermissionState.Denied);
    }
  },
);
requestWebHIDPermission.mockResolvedValue(true);
requestWebUSBPermission.mockResolvedValue(true);
requestHardwareWalletPermission.mockImplementation(
  (walletType: HardwareWalletType) => {
    switch (walletType) {
      case HardwareWalletType.Ledger:
      case HardwareWalletType.Trezor:
        return Promise.resolve(true);
      default:
        return Promise.resolve(false);
    }
  },
);
getDeviceId.mockResolvedValue('test-device-id');
getHardwareWalletDeviceId.mockResolvedValue('test-device-id');
subscribeToWebHIDEvents.mockReturnValue(jest.fn());
subscribeToWebUSBEvents.mockReturnValue(jest.fn());
subscribeToHardwareWalletEvents.mockReturnValue(jest.fn());

// Reset all mocks to defaults
export const resetWebHIDUtilsMocks = () => {
  isWebHIDAvailable.mockReturnValue(true);
  isWebUSBAvailable.mockReturnValue(true);
  checkWebHIDPermission.mockResolvedValue(
    HardwareConnectionPermissionState.Granted,
  );
  checkWebUSBPermission.mockResolvedValue(
    HardwareConnectionPermissionState.Granted,
  );
  checkHardwareWalletPermission.mockImplementation(
    (walletType: HardwareWalletType) => {
      switch (walletType) {
        case HardwareWalletType.Ledger:
          return Promise.resolve(HardwareConnectionPermissionState.Granted);
        case HardwareWalletType.Trezor:
          return Promise.resolve(HardwareConnectionPermissionState.Granted);
        default:
          return Promise.resolve(HardwareConnectionPermissionState.Denied);
      }
    },
  );
  requestWebHIDPermission.mockResolvedValue(true);
  requestWebUSBPermission.mockResolvedValue(true);
  requestHardwareWalletPermission.mockImplementation(
    (walletType: HardwareWalletType) => {
      switch (walletType) {
        case HardwareWalletType.Ledger:
        case HardwareWalletType.Trezor:
          return Promise.resolve(true);
        default:
          return Promise.resolve(false);
      }
    },
  );
  getDeviceId.mockResolvedValue('test-device-id');
  getHardwareWalletDeviceId.mockResolvedValue('test-device-id');
  subscribeToWebHIDEvents.mockReturnValue(jest.fn());
  subscribeToWebUSBEvents.mockReturnValue(jest.fn());
  subscribeToHardwareWalletEvents.mockReturnValue(jest.fn());
};

// Helper to setup common test scenarios
export const setupWebHIDUtilsMocks = () => {
  resetWebHIDUtilsMocks();
};

// Helper to mock permission denied scenarios
export const mockPermissionsDenied = () => {
  checkWebHIDPermission.mockResolvedValue(
    HardwareConnectionPermissionState.Denied,
  );
  checkWebUSBPermission.mockResolvedValue(
    HardwareConnectionPermissionState.Denied,
  );
  checkHardwareWalletPermission.mockResolvedValue(
    HardwareConnectionPermissionState.Denied,
  );
  requestWebHIDPermission.mockResolvedValue(false);
  requestWebUSBPermission.mockResolvedValue(false);
  requestHardwareWalletPermission.mockResolvedValue(false);
};

// Helper to mock permission prompt scenarios
export const mockPermissionsPrompt = () => {
  checkWebHIDPermission.mockResolvedValue(
    HardwareConnectionPermissionState.Prompt,
  );
  checkWebUSBPermission.mockResolvedValue(
    HardwareConnectionPermissionState.Prompt,
  );
  checkHardwareWalletPermission.mockResolvedValue(
    HardwareConnectionPermissionState.Prompt,
  );
};

// Helper to mock API unavailability
export const mockWebHIDUnavailable = () => {
  isWebHIDAvailable.mockReturnValue(false);
  checkWebHIDPermission.mockResolvedValue(
    HardwareConnectionPermissionState.Denied,
  );
  requestWebHIDPermission.mockResolvedValue(false);
};

export const mockWebUSBUnavailable = () => {
  isWebUSBAvailable.mockReturnValue(false);
  checkWebUSBPermission.mockResolvedValue(
    HardwareConnectionPermissionState.Denied,
  );
  requestWebUSBPermission.mockResolvedValue(false);
};

// Helper to mock device discovery failures
export const mockNoDevicesFound = () => {
  getDeviceId.mockResolvedValue(null);
  getHardwareWalletDeviceId.mockResolvedValue(null);
};

// Helper to mock device discovery errors
export const mockDeviceDiscoveryError = () => {
  getDeviceId.mockRejectedValue(new Error('Device discovery failed'));
  getHardwareWalletDeviceId.mockRejectedValue(
    new Error('Device discovery failed'),
  );
};
