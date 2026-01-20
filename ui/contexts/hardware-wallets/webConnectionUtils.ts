import {
  LEDGER_USB_VENDOR_ID,
  TREZOR_USB_VENDOR_IDS,
} from '../../../shared/constants/hardware-wallets';
import { HardwareWalletType, HardwareConnectionPermissionState } from './types';

/**
 * Check if WebHID is available in the current browser
 */
export function isWebHidAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.navigator !== 'undefined' &&
    'hid' in window.navigator
  );
}

/**
 * Check if WebUSB is available in the current browser
 */
export function isWebUsbAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.navigator !== 'undefined' &&
    'usb' in window.navigator
  );
}

/**
 * Check if a device matches the vendor filters for a specific hardware wallet type
 *
 * @param device - The device to check (HIDDevice or USBDevice)
 * @param walletType - The hardware wallet type to match against
 * @returns true if the device matches the filters for the specified wallet type
 */
function isHardwareWalletDevice(
  device: HIDDevice | USBDevice,
  walletType: HardwareWalletType,
): boolean {
  switch (walletType) {
    case HardwareWalletType.Ledger:
      return device.vendorId === Number(LEDGER_USB_VENDOR_ID);
    case HardwareWalletType.Trezor:
      return TREZOR_USB_VENDOR_IDS.some(
        (filter) =>
          device.vendorId === filter.vendorId &&
          device.productId === filter.productId,
      );
    default:
      return false;
  }
}

/**
 * Get the device filters for a specific hardware wallet type
 *
 * @param walletType - The hardware wallet type to get filters for
 * @returns Device filters for WebHID or WebUSB
 */
function getDeviceFilters(
  walletType: HardwareWalletType,
): HIDDeviceFilter[] | USBDeviceFilter[] {
  switch (walletType) {
    case HardwareWalletType.Ledger:
      return [{ vendorId: Number(LEDGER_USB_VENDOR_ID) }];
    case HardwareWalletType.Trezor:
      return TREZOR_USB_VENDOR_IDS;
    default:
      return [];
  }
}

/**
 * Check hardware wallet permission based on wallet type
 *
 * @param walletType - The type of hardware wallet (Ledger uses WebHID, Trezor uses WebUSB)
 * @returns Permission state for the specified wallet type
 */
export async function checkHardwareWalletPermission(
  walletType: HardwareWalletType,
): Promise<HardwareConnectionPermissionState> {
  switch (walletType) {
    case HardwareWalletType.Ledger:
      return await checkWebHidPermission(walletType);
    case HardwareWalletType.Trezor:
      return await checkWebUsbPermission(walletType);
    default:
      return HardwareConnectionPermissionState.Denied;
  }
}

/**
 * Check if WebHID permission is granted by checking for paired devices
 *
 * @param walletType - The hardware wallet type to check for
 */
export async function checkWebHidPermission(
  walletType: HardwareWalletType,
): Promise<HardwareConnectionPermissionState> {
  if (!isWebHidAvailable()) {
    return HardwareConnectionPermissionState.Denied;
  }

  try {
    const devices = await window.navigator.hid.getDevices();

    // Check if any devices matching the wallet type are paired
    const hasDevice = devices.some((device) =>
      isHardwareWalletDevice(device, walletType),
    );

    if (hasDevice) {
      return HardwareConnectionPermissionState.Granted;
    }

    // No paired devices means we need to request permission
    return HardwareConnectionPermissionState.Prompt;
  } catch (error) {
    return HardwareConnectionPermissionState.Unknown;
  }
}

/**
 * Check if WebUSB permission is granted by checking for paired devices
 *
 * @param walletType - The hardware wallet type to check for
 */
export async function checkWebUsbPermission(
  walletType: HardwareWalletType,
): Promise<HardwareConnectionPermissionState> {
  if (!isWebUsbAvailable()) {
    return HardwareConnectionPermissionState.Denied;
  }

  try {
    const devices = await window.navigator.usb.getDevices();

    // Check if any devices matching the wallet type are paired
    const hasDevice = devices.some((device) =>
      isHardwareWalletDevice(device, walletType),
    );

    if (hasDevice) {
      return HardwareConnectionPermissionState.Granted;
    }

    // No paired devices means we need to request permission
    return HardwareConnectionPermissionState.Prompt;
  } catch (error) {
    return HardwareConnectionPermissionState.Unknown;
  }
}

/**
 * Request hardware wallet permission based on wallet type
 *
 * @param walletType - The type of hardware wallet (Ledger uses WebHID, Trezor uses WebUSB)
 * @returns true if permission was granted
 */
export async function requestHardwareWalletPermission(
  walletType: HardwareWalletType,
): Promise<boolean> {
  switch (walletType) {
    case HardwareWalletType.Ledger:
      return requestWebHidPermission(walletType);
    case HardwareWalletType.Trezor:
      return requestWebUsbPermission(walletType);
    default:
      return false;
  }
}

/**
 * Request WebHID permission from the user
 * This will show the browser's device selection dialog
 *
 * @param walletType - The hardware wallet type to request permission for
 */
export async function requestWebHidPermission(
  walletType: HardwareWalletType,
): Promise<boolean> {
  if (!isWebHidAvailable()) {
    return false;
  }

  try {
    const devices = await window.navigator.hid.requestDevice({
      filters: getDeviceFilters(walletType) as HIDDeviceFilter[],
    });

    // Check if user selected a device matching the wallet type
    const hasDevice = devices.some((device) =>
      isHardwareWalletDevice(device, walletType),
    );

    return hasDevice;
  } catch {
    return false;
  }
}

/**
 * Request WebUSB permission from the user
 * This will show the browser's device selection dialog
 *
 * @param walletType - The hardware wallet type to request permission for
 */
export async function requestWebUsbPermission(
  walletType: HardwareWalletType,
): Promise<boolean> {
  if (!isWebUsbAvailable()) {
    return false;
  }

  try {
    const device = await window.navigator.usb.requestDevice({
      filters: getDeviceFilters(walletType) as USBDeviceFilter[],
    });

    const hasDevice = isHardwareWalletDevice(device, walletType);

    return hasDevice;
  } catch {
    return false;
  }
}

/**
 * Get list of connected Ledger devices (WebHID)
 */
export async function getConnectedLedgerDevices(): Promise<HIDDevice[]> {
  if (!isWebHidAvailable()) {
    return [];
  }

  try {
    const devices = await window.navigator.hid.getDevices();
    return devices.filter((device) =>
      isHardwareWalletDevice(device, HardwareWalletType.Ledger),
    );
  } catch (error) {
    return [];
  }
}

/**
 * Get list of connected Trezor devices (WebUSB)
 */
export async function getConnectedTrezorDevices(): Promise<USBDevice[]> {
  if (!isWebUsbAvailable()) {
    return [];
  }

  try {
    const devices = await window.navigator.usb.getDevices();
    return devices.filter((device) =>
      isHardwareWalletDevice(device, HardwareWalletType.Trezor),
    );
  } catch {
    return [];
  }
}

/**
 * Get list of connected devices for a specific hardware wallet type
 *
 * @param walletType - The type of hardware wallet
 * @returns Array of connected devices (HIDDevice[] for Ledger, USBDevice[] for Trezor)
 */
export async function getConnectedDevices(
  walletType: HardwareWalletType,
): Promise<HIDDevice[] | USBDevice[]> {
  switch (walletType) {
    case HardwareWalletType.Ledger:
      return getConnectedLedgerDevices();
    case HardwareWalletType.Trezor:
      return getConnectedTrezorDevices();
    default:
      return [];
  }
}

/**
 * Check if a specific device is connected (Ledger-specific, for backward compatibility)
 *
 * @param deviceId - Optional device ID to check for a specific device
 * @returns true if the device is connected
 */
export async function isDeviceConnected(deviceId?: string): Promise<boolean> {
  const devices = await getConnectedLedgerDevices();

  if (!deviceId) {
    // If no specific device ID, just check if any Ledger is connected
    return devices.length > 0;
  }

  // Check for specific device
  return devices.some((device) => device.productId.toString() === deviceId);
}

/**
 * Check if a hardware wallet is connected
 *
 * @param walletType - The type of hardware wallet to check
 * @param deviceId - Optional specific device ID to check
 * @returns true if the device is connected
 */
export async function isHardwareWalletConnected(
  walletType: HardwareWalletType,
  deviceId?: string,
): Promise<boolean> {
  const devices = await getConnectedDevices(walletType);

  if (!deviceId) {
    return devices.length > 0;
  }

  return devices.some((device) => device.productId.toString() === deviceId);
}

/**
 * Get a device ID from a connected device (returns product ID)
 * Ledger-specific for backward compatibility
 */
export async function getDeviceId(): Promise<string | null> {
  const devices = await getConnectedLedgerDevices();

  if (devices.length === 0) {
    return null;
  }

  // Return the product ID of the first device
  return devices[0].productId.toString();
}

/**
 * Get a device ID for a specific hardware wallet type
 *
 * @param walletType - The type of hardware wallet
 * @returns Device ID (product ID as string) or null if no device found
 */
export async function getHardwareWalletDeviceId(
  walletType: HardwareWalletType,
): Promise<string | null> {
  const devices = await getConnectedDevices(walletType);

  if (devices.length === 0) {
    return null;
  }

  // Return the product ID of the first device
  return devices[0].productId.toString();
}

/**
 * Subscribe to native WebHID connect/disconnect events
 *
 * @param walletType - The hardware wallet type to filter events for
 * @param onConnect - Callback when a device is connected
 * @param onDisconnect - Callback when a device is disconnected
 * @returns Unsubscribe function to clean up event listeners
 */
export function subscribeToWebHidEvents(
  walletType: HardwareWalletType,
  onConnect: (device: HIDDevice) => void,
  onDisconnect: (device: HIDDevice) => void,
): () => void {
  if (!isWebHidAvailable()) {
    return () => {
      // No-op cleanup
    };
  }

  const handleConnect = (event: HIDConnectionEvent) => {
    // Only notify for devices matching the wallet type
    if (isHardwareWalletDevice(event.device, walletType)) {
      onConnect(event.device);
    }
  };

  const handleDisconnect = (event: HIDConnectionEvent) => {
    // Only notify for devices matching the wallet type
    if (isHardwareWalletDevice(event.device, walletType)) {
      onDisconnect(event.device);
    }
  };

  navigator.hid.addEventListener('connect', handleConnect);
  navigator.hid.addEventListener('disconnect', handleDisconnect);

  // Return cleanup function
  return () => {
    navigator.hid.removeEventListener('connect', handleConnect);
    navigator.hid.removeEventListener('disconnect', handleDisconnect);
  };
}

/**
 * Subscribe to native WebUSB connect/disconnect events
 *
 * @param walletType - The hardware wallet type to filter events for
 * @param onConnect - Callback when a device is connected
 * @param onDisconnect - Callback when a device is disconnected
 * @returns Unsubscribe function to clean up event listeners
 */
export function subscribeToWebUsbEvents(
  walletType: HardwareWalletType,
  onConnect: (device: USBDevice) => void,
  onDisconnect: (device: USBDevice) => void,
): () => void {
  if (!isWebUsbAvailable()) {
    return () => {
      // No-op cleanup
    };
  }

  const handleConnect = (event: USBConnectionEvent) => {
    // Only notify for devices matching the wallet type
    if (isHardwareWalletDevice(event.device, walletType)) {
      onConnect(event.device);
    }
  };

  const handleDisconnect = (event: USBConnectionEvent) => {
    // Only notify for devices matching the wallet type
    if (isHardwareWalletDevice(event.device, walletType)) {
      onDisconnect(event.device);
    }
  };

  navigator.usb.addEventListener('connect', handleConnect);
  navigator.usb.addEventListener('disconnect', handleDisconnect);

  // Return cleanup function
  return () => {
    navigator.usb.removeEventListener('connect', handleConnect);
    navigator.usb.removeEventListener('disconnect', handleDisconnect);
  };
}

/**
 * Subscribe to hardware wallet connect/disconnect events based on wallet type
 *
 * @param walletType - The type of hardware wallet to subscribe to
 * @param onConnect - Callback for device connection
 * @param onDisconnect - Callback for device disconnection
 * @returns Unsubscribe function to clean up event listeners
 */
export function subscribeToHardwareWalletEvents(
  walletType: HardwareWalletType,
  onConnect: (device: HIDDevice | USBDevice) => void,
  onDisconnect: (device: HIDDevice | USBDevice) => void,
): () => void {
  switch (walletType) {
    case HardwareWalletType.Ledger:
      return subscribeToWebHidEvents(walletType, onConnect, onDisconnect);
    case HardwareWalletType.Trezor:
      return subscribeToWebUsbEvents(walletType, onConnect, onDisconnect);
    default:
      return () => {
        // No-op cleanup
      };
  }
}
