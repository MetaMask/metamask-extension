import { CameraPermissionState } from '../constants';
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
export const isCameraAvailable = jest.fn();
export const checkWebHidPermission = jest.fn();
export const checkWebUsbPermission = jest.fn();
export const checkCameraPermissionState = jest.fn();
export const checkCameraPermission = jest.fn();
export const checkHardwareWalletPermission = jest.fn();
export const requestWebHidPermission = jest.fn();
export const requestWebUsbPermission = jest.fn();
export const requestCameraPermission = jest.fn();
export const requestHardwareWalletPermission = jest.fn();
export const getConnectedDevices = jest.fn();
export const subscribeToWebHidEvents = jest.fn();
export const subscribeToWebUsbEvents = jest.fn();
export const subscribeToHardwareWalletEvents = jest.fn();

// Default mock implementations
isWebHidAvailable.mockReturnValue(true);
isWebUsbAvailable.mockReturnValue(true);
isCameraAvailable.mockReturnValue(true);
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
      case HardwareWalletType.Qr:
        return Promise.resolve(HardwareConnectionPermissionState.Granted);
      default:
        return Promise.resolve(HardwareConnectionPermissionState.Denied);
    }
  },
);
checkCameraPermissionState.mockResolvedValue(
  HardwareConnectionPermissionState.Granted,
);
checkCameraPermission.mockResolvedValue(CameraPermissionState.Granted);
requestWebHidPermission.mockResolvedValue(true);
requestWebUsbPermission.mockResolvedValue(true);
requestCameraPermission.mockResolvedValue(true);
requestHardwareWalletPermission.mockImplementation(
  (walletType: HardwareWalletType) => {
    switch (walletType) {
      case HardwareWalletType.Ledger:
      case HardwareWalletType.Trezor:
      case HardwareWalletType.Qr:
        return Promise.resolve(true);
      default:
        return Promise.resolve(false);
    }
  },
);
getConnectedDevices.mockResolvedValue([]);
subscribeToWebHidEvents.mockReturnValue(jest.fn());
subscribeToWebUsbEvents.mockReturnValue(jest.fn());
subscribeToHardwareWalletEvents.mockReturnValue(jest.fn());

// Reset all mocks to defaults
export const resetwebConnectionUtilsMocks = () => {
  isWebHidAvailable.mockReturnValue(true);
  isWebUsbAvailable.mockReturnValue(true);
  isCameraAvailable.mockReturnValue(true);
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
        case HardwareWalletType.Qr:
          return Promise.resolve(HardwareConnectionPermissionState.Granted);
        default:
          return Promise.resolve(HardwareConnectionPermissionState.Denied);
      }
    },
  );
  checkCameraPermissionState.mockResolvedValue(
    HardwareConnectionPermissionState.Granted,
  );
  checkCameraPermission.mockResolvedValue(CameraPermissionState.Granted);
  requestWebHidPermission.mockResolvedValue(true);
  requestWebUsbPermission.mockResolvedValue(true);
  requestCameraPermission.mockResolvedValue(true);
  requestHardwareWalletPermission.mockImplementation(
    (walletType: HardwareWalletType) => {
      switch (walletType) {
        case HardwareWalletType.Ledger:
        case HardwareWalletType.Trezor:
        case HardwareWalletType.Qr:
          return Promise.resolve(true);
        default:
          return Promise.resolve(false);
      }
    },
  );
  getConnectedDevices.mockResolvedValue([]);
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
  checkCameraPermissionState.mockResolvedValue(
    HardwareConnectionPermissionState.Denied,
  );
  checkCameraPermission.mockResolvedValue(CameraPermissionState.Denied);
  checkHardwareWalletPermission.mockResolvedValue(
    HardwareConnectionPermissionState.Denied,
  );
  requestWebHidPermission.mockResolvedValue(false);
  requestWebUsbPermission.mockResolvedValue(false);
  requestCameraPermission.mockResolvedValue(false);
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
  checkCameraPermissionState.mockResolvedValue(
    HardwareConnectionPermissionState.Prompt,
  );
  checkCameraPermission.mockResolvedValue(CameraPermissionState.Prompt);
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
  getConnectedDevices.mockResolvedValue([]);
};
