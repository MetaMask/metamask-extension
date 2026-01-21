import {
  HardwareWalletType,
  HardwareConnectionPermissionState,
} from '../types';

/**
 * Mock implementation of webConnectionUtils for testing
 */

// Mock functions
export const isWebHidAvailable = jest.fn();
export const isWebUsbAvailable = jest.fn();
export const checkWebHidPermission = jest.fn();
export const checkWebUsbPermission = jest.fn();
export const checkHardwareWalletPermission = jest.fn();
export const requestWebHidPermission = jest.fn();
export const requestWebUsbPermission = jest.fn();
export const requestHardwareWalletPermission = jest.fn();
export const getDeviceId = jest.fn();
export const getHardwareWalletDeviceId = jest.fn();
export const subscribeToWebHidEvents = jest.fn();
export const subscribeToWebUsbEvents = jest.fn();
export const subscribeToHardwareWalletEvents = jest.fn();

// Default mock implementations
isWebHidAvailable.mockReturnValue(true);
isWebUsbAvailable.mockReturnValue(true);
checkWebHidPermission.mockResolvedValue(
  HardwareConnectionPermissionState.Granted,
);
checkWebUsbPermission.mockResolvedValue(
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
requestWebHidPermission.mockResolvedValue(true);
requestWebUsbPermission.mockResolvedValue(true);
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
subscribeToWebHidEvents.mockReturnValue(jest.fn());
subscribeToWebUsbEvents.mockReturnValue(jest.fn());
subscribeToHardwareWalletEvents.mockReturnValue(jest.fn());

// Reset all mocks to defaults
export const resetwebConnectionUtilsMocks = () => {
  isWebHidAvailable.mockReturnValue(true);
  isWebUsbAvailable.mockReturnValue(true);
  checkWebHidPermission.mockResolvedValue(
    HardwareConnectionPermissionState.Granted,
  );
  checkWebUsbPermission.mockResolvedValue(
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
  requestWebHidPermission.mockResolvedValue(true);
  requestWebUsbPermission.mockResolvedValue(true);
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
  subscribeToWebHidEvents.mockReturnValue(jest.fn());
  subscribeToWebUsbEvents.mockReturnValue(jest.fn());
  subscribeToHardwareWalletEvents.mockReturnValue(jest.fn());
};

// Helper to setup common test scenarios
export const setupWebConnectionUtilsMocks = () => {
  resetwebConnectionUtilsMocks();
};

// Helper to mock permission denied scenarios
export const mockPermissionsDenied = () => {
  checkWebHidPermission.mockResolvedValue(
    HardwareConnectionPermissionState.Denied,
  );
  checkWebUsbPermission.mockResolvedValue(
    HardwareConnectionPermissionState.Denied,
  );
  checkHardwareWalletPermission.mockResolvedValue(
    HardwareConnectionPermissionState.Denied,
  );
  requestWebHidPermission.mockResolvedValue(false);
  requestWebUsbPermission.mockResolvedValue(false);
  requestHardwareWalletPermission.mockResolvedValue(false);
};

// Helper to mock permission prompt scenarios
export const mockPermissionsPrompt = () => {
  checkWebHidPermission.mockResolvedValue(
    HardwareConnectionPermissionState.Prompt,
  );
  checkWebUsbPermission.mockResolvedValue(
    HardwareConnectionPermissionState.Prompt,
  );
  checkHardwareWalletPermission.mockResolvedValue(
    HardwareConnectionPermissionState.Prompt,
  );
};

// Helper to mock API unavailability
export const mockWebHidUnavailable = () => {
  isWebHidAvailable.mockReturnValue(false);
  checkWebHidPermission.mockResolvedValue(
    HardwareConnectionPermissionState.Denied,
  );
  requestWebHidPermission.mockResolvedValue(false);
};

export const mockWebUsbUnavailable = () => {
  isWebUsbAvailable.mockReturnValue(false);
  checkWebUsbPermission.mockResolvedValue(
    HardwareConnectionPermissionState.Denied,
  );
  requestWebUsbPermission.mockResolvedValue(false);
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
