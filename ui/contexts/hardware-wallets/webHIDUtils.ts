import { LEDGER_USB_VENDOR_ID } from '../../../shared/constants/hardware-wallets';
import { WebHIDPermissionState } from './types';

const LOG_TAG = '[WebHIDUtils]';

/**
 * Check if WebHID is available in the current browser
 */
export function isWebHIDAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.navigator !== 'undefined' &&
    'hid' in window.navigator
  );
}

/**
 * Check if WebHID permission is granted by checking for paired devices
 */
export async function checkWebHIDPermission(): Promise<WebHIDPermissionState> {
  if (!isWebHIDAvailable()) {
    return WebHIDPermissionState.DENIED;
  }

  try {
    const devices = await window.navigator.hid.getDevices();

    // Check if any Ledger devices are paired
    const hasLedgerDevice = devices.some(
      (device) => device.vendorId === Number(LEDGER_USB_VENDOR_ID),
    );

    if (hasLedgerDevice) {
      return WebHIDPermissionState.GRANTED;
    }

    // No paired devices means we need to request permission
    return WebHIDPermissionState.PROMPT;
  } catch (error) {
    console.error(LOG_TAG, 'Error checking WebHID permission:', error);
    return WebHIDPermissionState.UNKNOWN;
  }
}

/**
 * Request WebHID permission from the user
 * This will show the browser's device selection dialog
 */
export async function requestWebHIDPermission(): Promise<boolean> {
  if (!isWebHIDAvailable()) {
    console.error(LOG_TAG, 'WebHID is not available');
    return false;
  }

  try {
    const devices = await window.navigator.hid.requestDevice({
      filters: [{ vendorId: LEDGER_USB_VENDOR_ID as unknown as number }],
    });

    // Check if user selected a Ledger device
    const hasLedgerDevice = devices.some(
      (device) => device.vendorId === Number(LEDGER_USB_VENDOR_ID),
    );

    return hasLedgerDevice;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // User cancelled the dialog
    if (errorMessage.includes('cancelled') || errorMessage.includes('denied')) {
      console.log(LOG_TAG, 'User denied WebHID permission');
      return false;
    }

    console.error(LOG_TAG, 'Error requesting WebHID permission:', error);
    return false;
  }
}

/**
 * Get list of connected Ledger devices
 */
export async function getConnectedLedgerDevices(): Promise<HIDDevice[]> {
  if (!isWebHIDAvailable()) {
    return [];
  }

  try {
    const devices = await window.navigator.hid.getDevices();
    return devices.filter(
      (device) => device.vendorId === Number(LEDGER_USB_VENDOR_ID),
    );
  } catch (error) {
    console.error(LOG_TAG, 'Error getting connected devices:', error);
    return [];
  }
}

/**
 * Check if a specific device is connected
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
 * Get a device ID from a connected device (returns product ID)
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
 * Subscribe to native WebHID connect/disconnect events
 * @returns Unsubscribe function to clean up event listeners
 */
export function subscribeToWebHIDEvents(
  onConnect: (device: HIDDevice) => void,
  onDisconnect: (device: HIDDevice) => void,
): () => void {
  if (!isWebHIDAvailable()) {
    console.warn(
      LOG_TAG,
      'WebHID is not available, cannot subscribe to events',
    );
    return () => {}; // No-op cleanup
  }

  const handleConnect = (event: HIDConnectionEvent) => {
    console.log(LOG_TAG, 'WebHID device connected:', event.device);
    // Only notify for Ledger devices
    if (event.device.vendorId === Number(LEDGER_USB_VENDOR_ID)) {
      onConnect(event.device);
    }
  };

  const handleDisconnect = (event: HIDConnectionEvent) => {
    console.log(LOG_TAG, 'WebHID device disconnected:', event.device);
    // Only notify for Ledger devices
    if (event.device.vendorId === Number(LEDGER_USB_VENDOR_ID)) {
      onDisconnect(event.device);
    }
  };

  navigator.hid.addEventListener('connect', handleConnect);
  navigator.hid.addEventListener('disconnect', handleDisconnect);

  console.log(LOG_TAG, 'Subscribed to WebHID events');

  // Return cleanup function
  return () => {
    navigator.hid.removeEventListener('connect', handleConnect);
    navigator.hid.removeEventListener('disconnect', handleDisconnect);
    console.log(LOG_TAG, 'Unsubscribed from WebHID events');
  };
}
