import {
  LEDGER_USB_VENDOR_ID,
  TREZOR_USB_VENDOR_IDS,
} from '../../../shared/constants/hardware-wallets';
import { HardwareWalletType, HardwareConnectionPermissionState } from './types';
import {
  isWebHidAvailable,
  isWebUsbAvailable,
  checkHardwareWalletPermission,
  checkWebHidPermission,
  checkWebUsbPermission,
  requestHardwareWalletPermission,
  requestWebHidPermission,
  requestWebUsbPermission,
  getConnectedLedgerDevices,
  getConnectedTrezorDevices,
  getConnectedDevices,
  isDeviceConnected,
  isHardwareWalletConnected,
  getDeviceId,
  getHardwareWalletDeviceId,
  subscribeToWebHidEvents,
  subscribeToWebUsbEvents,
} from './webConnectionUtils';

// Default device IDs for testing
const DEFAULT_LEDGER_VENDOR_ID = Number(LEDGER_USB_VENDOR_ID);
const DEFAULT_TREZOR_VENDOR_ID = TREZOR_USB_VENDOR_IDS[0].vendorId;
const DEFAULT_TREZOR_PRODUCT_ID = TREZOR_USB_VENDOR_IDS[0].productId;

// Mock device interface that allows property assignment
type MockHIDDevice = Partial<HIDDevice> & {
  productId: number;
  vendorId: number;
  productName: string;
  deviceName: string;
  opened: boolean;
};

// Event handler type for mocked addEventListener
type MockEventHandler = (event: { device: HIDDevice | USBDevice }) => void;

describe('webConnectionUtils', () => {
  // Save original navigator and window properties
  let originalNavigatorHid: HID | undefined;
  let originalNavigatorUsb: USB | undefined;
  let originalWindow: Window | undefined;

  // Helper functions for creating mock devices
  const createMockHIDDevice = (
    vendorId?: number,
    productId = 0x0001,
  ): MockHIDDevice =>
    ({
      vendorId: vendorId ?? DEFAULT_LEDGER_VENDOR_ID,
      productId,
      productName: 'Test Device',
      deviceName: 'Test Device',
      opened: true,
    }) as MockHIDDevice;

  const createMockUSBDevice = (vendorId?: number, productId?: number) =>
    ({
      vendorId: vendorId ?? DEFAULT_TREZOR_VENDOR_ID,
      productId: productId ?? DEFAULT_TREZOR_PRODUCT_ID,
      productName: 'Test Device',
      deviceName: 'Test Device',
      opened: true,
    }) as unknown as USBDevice;

  // Helper function to extract event handler from mock
  const getMockEventHandler = (
    mockCalls: [
      string,
      EventListenerOrEventListenerObject | null,
      (boolean | AddEventListenerOptions)?,
    ][],
    eventType: string,
  ): MockEventHandler => {
    const call = mockCalls.find((mockCall) => mockCall[0] === eventType);
    return call?.[1] as unknown as MockEventHandler;
  };

  // Helper function to setup default navigator mock
  const setupDefaultNavigator = () => {
    // Ensure window.navigator exists
    if (!window.navigator) {
      Object.defineProperty(window, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });
    }

    // Save originals
    originalNavigatorHid = window.navigator.hid;
    originalNavigatorUsb = window.navigator.usb;

    // Mock HID
    Object.defineProperty(window.navigator, 'hid', {
      value: {
        getDevices: jest.fn(),
        requestDevice: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
      configurable: true,
    });

    // Mock USB
    Object.defineProperty(window.navigator, 'usb', {
      value: {
        getDevices: jest.fn(),
        requestDevice: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
      configurable: true,
    });
  };

  // Helper function to restore navigator
  const restoreNavigator = () => {
    if (window.navigator && typeof window.navigator === 'object') {
      if (originalNavigatorHid !== undefined) {
        try {
          Object.defineProperty(window.navigator, 'hid', {
            value: originalNavigatorHid,
            configurable: true,
          });
        } catch (error) {
          // Ignore errors during restoration
        }
      }
      if (originalNavigatorUsb !== undefined) {
        try {
          Object.defineProperty(window.navigator, 'usb', {
            value: originalNavigatorUsb,
            configurable: true,
          });
        } catch (error) {
          // Ignore errors during restoration
        }
      }
    }
  };

  // Helper functions for window manipulation in tests
  const setupUndefinedWindow = () => {
    originalWindow = global.window;
    delete (globalThis as { window?: Window }).window;
  };

  const restoreWindow = () => {
    if (typeof originalWindow !== 'undefined') {
      (globalThis as { window?: Window }).window = originalWindow;
    }
  };

  // Helper functions to get properly typed mocked navigator objects
  const getMockedHid = (): jest.Mocked<HID> => {
    return window.navigator.hid as jest.Mocked<HID>;
  };

  const getMockedUsb = (): jest.Mocked<USB> => {
    return window.navigator.usb as jest.Mocked<USB>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultNavigator();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    restoreNavigator();
  });

  describe('isWebHidAvailable', () => {
    it('returns true when WebHID is available', () => {
      const result = isWebHidAvailable();

      expect(result).toBe(true);
    });

    it('returns false when window is undefined', () => {
      setupUndefinedWindow();

      const result = isWebHidAvailable();

      expect(result).toBe(false);

      restoreWindow();
    });

    it('returns false when navigator is undefined', () => {
      Object.defineProperty(window, 'navigator', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const result = isWebHidAvailable();

      expect(result).toBe(false);
    });

    it('returns false when hid property is not available', () => {
      // Temporarily remove hid property
      const originalHid = window.navigator.hid;
      delete (window.navigator as { hid?: HID }).hid;

      const result = isWebHidAvailable();

      expect(result).toBe(false);

      // Restore hid property
      Object.defineProperty(window.navigator, 'hid', {
        value: originalHid,
        configurable: true,
      });
    });
  });

  describe('isWebUsbAvailable', () => {
    it('returns true when WebUSB is available', () => {
      const result = isWebUsbAvailable();

      expect(result).toBe(true);
    });

    it('returns false when window is undefined', () => {
      setupUndefinedWindow();

      const result = isWebUsbAvailable();

      expect(result).toBe(false);

      restoreWindow();
    });

    it('returns false when navigator is undefined', () => {
      Object.defineProperty(window, 'navigator', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const result = isWebUsbAvailable();

      expect(result).toBe(false);
    });

    it('returns false when usb property is not available', () => {
      // Temporarily remove usb property
      const originalUsb = window.navigator.usb;
      delete (window.navigator as { usb?: USB }).usb;

      const result = isWebUsbAvailable();

      expect(result).toBe(false);

      // Restore usb property
      Object.defineProperty(window.navigator, 'usb', {
        value: originalUsb,
        configurable: true,
      });
    });
  });

  describe('checkHardwareWalletPermission', () => {
    it('returns Granted when Ledger devices are paired', async () => {
      (window.navigator.hid.getDevices as jest.Mock).mockResolvedValue([
        createMockHIDDevice(),
      ]);

      const result = await checkHardwareWalletPermission(
        HardwareWalletType.Ledger,
      );

      expect(result).toBe(HardwareConnectionPermissionState.Granted);
    });

    it('returns Granted when Trezor devices are paired', async () => {
      (window.navigator.usb.getDevices as jest.Mock).mockResolvedValue([
        createMockUSBDevice(),
      ]);

      const result = await checkHardwareWalletPermission(
        HardwareWalletType.Trezor,
      );

      expect(result).toBe(HardwareConnectionPermissionState.Granted);
    });

    it('returns Denied for unsupported wallet type', async () => {
      const result = await checkHardwareWalletPermission(
        'unsupported' as HardwareWalletType,
      );

      expect(result).toBe(HardwareConnectionPermissionState.Denied);
    });
  });

  describe('checkWebHidPermission', () => {
    it('returns Granted when paired Ledger devices exist', async () => {
      (window.navigator.hid.getDevices as jest.Mock).mockResolvedValue([
        createMockHIDDevice(),
      ]);

      const result = await checkWebHidPermission(HardwareWalletType.Ledger);

      expect(result).toBe(HardwareConnectionPermissionState.Granted);
      expect(window.navigator.hid.getDevices).toHaveBeenCalled();
    });

    it('returns Prompt when no paired Ledger devices exist', async () => {
      (window.navigator.hid.getDevices as jest.Mock).mockResolvedValue([]);

      const result = await checkWebHidPermission(HardwareWalletType.Ledger);

      expect(result).toBe(HardwareConnectionPermissionState.Prompt);
      expect(window.navigator.hid.getDevices).toHaveBeenCalled();
    });

    it('returns Prompt when paired devices exist but are not Ledger', async () => {
      getMockedHid().getDevices.mockResolvedValue([
        createMockHIDDevice(0x1234) as HIDDevice, // Wrong vendor ID
      ]);

      const result = await checkWebHidPermission(HardwareWalletType.Ledger);

      expect(result).toBe(HardwareConnectionPermissionState.Prompt);
      expect(getMockedHid().getDevices).toHaveBeenCalled();
    });

    it('returns Denied when WebHID is not available', async () => {
      // Temporarily remove hid property
      const originalHid = window.navigator.hid;
      delete (window.navigator as { hid?: HID }).hid;

      const result = await checkWebHidPermission(HardwareWalletType.Ledger);

      expect(result).toBe(HardwareConnectionPermissionState.Denied);

      // Restore hid property
      Object.defineProperty(window.navigator, 'hid', {
        value: originalHid,
        configurable: true,
      });
    });

    it('returns Unknown when getDevices throws error', async () => {
      const error = new Error('Permission denied');
      getMockedHid().getDevices.mockRejectedValue(error);

      const result = await checkWebHidPermission(HardwareWalletType.Ledger);

      expect(result).toBe(HardwareConnectionPermissionState.Unknown);
    });
  });

  describe('checkWebUsbPermission', () => {
    it('returns Granted when paired Trezor devices exist', async () => {
      getMockedUsb().getDevices.mockResolvedValue([createMockUSBDevice()]);

      const result = await checkWebUsbPermission(HardwareWalletType.Trezor);

      expect(result).toBe(HardwareConnectionPermissionState.Granted);
      expect(getMockedUsb().getDevices).toHaveBeenCalled();
    });

    it('returns Prompt when no paired Trezor devices exist', async () => {
      getMockedUsb().getDevices.mockResolvedValue([]);

      const result = await checkWebUsbPermission(HardwareWalletType.Trezor);

      expect(result).toBe(HardwareConnectionPermissionState.Prompt);
      expect(getMockedUsb().getDevices).toHaveBeenCalled();
    });

    it('returns Prompt when paired devices exist but are not Trezor', async () => {
      getMockedUsb().getDevices.mockResolvedValue([
        createMockUSBDevice(0x1234), // Wrong vendor ID
      ]);

      const result = await checkWebUsbPermission(HardwareWalletType.Trezor);

      expect(result).toBe(HardwareConnectionPermissionState.Prompt);
      expect(getMockedUsb().getDevices).toHaveBeenCalled();
    });

    it('returns Denied when WebUSB is not available', async () => {
      // Temporarily remove usb property
      const originalUsb = window.navigator.usb;
      delete (window.navigator as { usb?: USB }).usb;

      const result = await checkWebUsbPermission(HardwareWalletType.Trezor);

      expect(result).toBe(HardwareConnectionPermissionState.Denied);

      // Restore usb property
      Object.defineProperty(window.navigator, 'usb', {
        value: originalUsb,
        configurable: true,
      });
    });

    it('returns Unknown when getDevices throws error', async () => {
      const error = new Error('Permission denied');
      getMockedUsb().getDevices.mockRejectedValue(error);

      const result = await checkWebUsbPermission(HardwareWalletType.Trezor);

      expect(result).toBe(HardwareConnectionPermissionState.Unknown);
    });
  });

  describe('requestHardwareWalletPermission', () => {
    it('returns true when user selects Ledger device', async () => {
      const mockDevice = createMockHIDDevice() as HIDDevice;
      (window.navigator.hid.requestDevice as jest.Mock).mockResolvedValue([
        mockDevice,
      ]);

      const result = await requestHardwareWalletPermission(
        HardwareWalletType.Ledger,
      );

      expect(result).toBe(true);
    });

    it('returns true when user selects Trezor device', async () => {
      const mockDevice = createMockUSBDevice();
      (window.navigator.usb.requestDevice as jest.Mock).mockResolvedValue(
        mockDevice,
      );

      const result = await requestHardwareWalletPermission(
        HardwareWalletType.Trezor,
      );

      expect(result).toBe(true);
    });

    it('returns false for unsupported wallet type', async () => {
      const result = await requestHardwareWalletPermission(
        'unsupported' as HardwareWalletType,
      );

      expect(result).toBe(false);
    });
  });

  describe('requestWebHidPermission', () => {
    it('returns true when user selects Ledger device', async () => {
      const mockDevice = createMockHIDDevice() as HIDDevice;
      getMockedHid().requestDevice.mockResolvedValue([mockDevice]);

      const result = await requestWebHidPermission(HardwareWalletType.Ledger);

      expect(result).toBe(true);
      expect(getMockedHid().requestDevice).toHaveBeenCalledWith({
        filters: [{ vendorId: Number(LEDGER_USB_VENDOR_ID) }],
      });
    });

    it('returns false when user selects non-Ledger device', async () => {
      const mockDevice = createMockHIDDevice(0x1234) as HIDDevice; // Wrong vendor ID
      getMockedHid().requestDevice.mockResolvedValue([mockDevice]);

      const result = await requestWebHidPermission(HardwareWalletType.Ledger);

      expect(result).toBe(false);
      expect(getMockedHid().requestDevice).toHaveBeenCalledWith({
        filters: [{ vendorId: Number(LEDGER_USB_VENDOR_ID) }],
      });
    });

    it('returns false when user cancels dialog', async () => {
      const error = new Error('User cancelled the requestDevice() chooser.');
      getMockedHid().requestDevice.mockRejectedValue(error);

      const result = await requestWebHidPermission(HardwareWalletType.Ledger);

      expect(result).toBe(false);
    });

    it('returns false when user denies permission', async () => {
      const error = new Error('Permission denied');
      getMockedHid().requestDevice.mockRejectedValue(error);

      const result = await requestWebHidPermission(HardwareWalletType.Ledger);

      expect(result).toBe(false);
    });

    it('returns false and logs error when requestDevice throws non-user-cancellation error', async () => {
      const error = new Error('Unexpected error');
      getMockedHid().requestDevice.mockRejectedValue(error);

      const result = await requestWebHidPermission(HardwareWalletType.Ledger);

      expect(result).toBe(false);
    });

    it('returns false when WebHID is not available', async () => {
      Object.defineProperty(window.navigator, 'hid', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const result = await requestWebHidPermission(HardwareWalletType.Ledger);

      expect(result).toBe(false);
    });
  });

  describe('requestWebUsbPermission', () => {
    it('returns true when user selects Trezor device', async () => {
      const mockDevice = createMockUSBDevice();
      getMockedUsb().requestDevice.mockResolvedValue(mockDevice);

      const result = await requestWebUsbPermission(HardwareWalletType.Trezor);

      expect(result).toBe(true);
      expect(getMockedUsb().requestDevice).toHaveBeenCalledWith({
        filters: TREZOR_USB_VENDOR_IDS,
      });
    });

    it('returns false when user selects non-Trezor device', async () => {
      const mockDevice = createMockUSBDevice(0x1234); // Wrong vendor ID
      getMockedUsb().requestDevice.mockResolvedValue(mockDevice);

      const result = await requestWebUsbPermission(HardwareWalletType.Trezor);

      expect(result).toBe(false);
      expect(getMockedUsb().requestDevice).toHaveBeenCalledWith({
        filters: TREZOR_USB_VENDOR_IDS,
      });
    });

    it('returns false when user cancels dialog', async () => {
      const error = new Error('User cancelled the requestDevice() chooser.');
      getMockedUsb().requestDevice.mockRejectedValue(error);

      const result = await requestWebUsbPermission(HardwareWalletType.Trezor);

      expect(result).toBe(false);
    });

    it('returns false when user denies permission', async () => {
      const error = new Error('Permission denied');
      getMockedUsb().requestDevice.mockRejectedValue(error);

      const result = await requestWebUsbPermission(HardwareWalletType.Trezor);

      expect(result).toBe(false);
    });

    it('returns false and logs error when requestDevice throws non-user-cancellation error', async () => {
      const error = new Error('Unexpected error');
      getMockedUsb().requestDevice.mockRejectedValue(error);

      const result = await requestWebUsbPermission(HardwareWalletType.Trezor);

      expect(result).toBe(false);
    });

    it('returns false when WebUSB is not available', async () => {
      Object.defineProperty(window.navigator, 'usb', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const result = await requestWebUsbPermission(HardwareWalletType.Trezor);

      expect(result).toBe(false);
    });
  });

  describe('getConnectedLedgerDevices', () => {
    it('returns filtered Ledger devices from getDevices', async () => {
      const ledgerDevice = createMockHIDDevice() as HIDDevice;
      const otherDevice = createMockHIDDevice(0x1234) as HIDDevice;
      getMockedHid().getDevices.mockResolvedValue([ledgerDevice, otherDevice]);

      const result = await getConnectedLedgerDevices();

      expect(result).toEqual([ledgerDevice]);
      expect(getMockedHid().getDevices).toHaveBeenCalled();
    });

    it('returns empty array when no Ledger devices are connected', async () => {
      getMockedHid().getDevices.mockResolvedValue([]);

      const result = await getConnectedLedgerDevices();

      expect(result).toEqual([]);
      expect(getMockedHid().getDevices).toHaveBeenCalled();
    });

    it('returns empty array when WebHID is not available', async () => {
      Object.defineProperty(window.navigator, 'hid', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const result = await getConnectedLedgerDevices();

      expect(result).toEqual([]);
    });

    it('returns empty array and logs error when getDevices throws', async () => {
      const error = new Error('Device access error');
      getMockedHid().getDevices.mockRejectedValue(error);

      const result = await getConnectedLedgerDevices();

      expect(result).toEqual([]);
    });
  });

  describe('getConnectedTrezorDevices', () => {
    it('returns filtered Trezor devices from getDevices', async () => {
      const trezorDevice = createMockUSBDevice();
      const otherDevice = createMockUSBDevice(0x1234);
      getMockedUsb().getDevices.mockResolvedValue([trezorDevice, otherDevice]);

      const result = await getConnectedTrezorDevices();

      expect(result).toEqual([trezorDevice]);
      expect(getMockedUsb().getDevices).toHaveBeenCalled();
    });

    it('returns empty array when no Trezor devices are connected', async () => {
      getMockedUsb().getDevices.mockResolvedValue([]);

      const result = await getConnectedTrezorDevices();

      expect(result).toEqual([]);
      expect(getMockedUsb().getDevices).toHaveBeenCalled();
    });

    it('returns empty array when WebUSB is not available', async () => {
      Object.defineProperty(window.navigator, 'usb', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const result = await getConnectedTrezorDevices();

      expect(result).toEqual([]);
    });

    it('returns empty array and logs error when getDevices throws', async () => {
      const error = new Error('Device access error');
      getMockedUsb().getDevices.mockRejectedValue(error);

      const result = await getConnectedTrezorDevices();

      expect(result).toEqual([]);
    });
  });

  describe('getConnectedDevices', () => {
    it('returns Ledger devices for Ledger wallet type', async () => {
      const ledgerDevice = createMockHIDDevice();
      (window.navigator.hid.getDevices as jest.Mock).mockResolvedValue([
        ledgerDevice,
      ]);

      const result = await getConnectedDevices(HardwareWalletType.Ledger);

      expect(result).toEqual([ledgerDevice]);
    });

    it('returns Trezor devices for Trezor wallet type', async () => {
      const trezorDevice = createMockUSBDevice();
      (window.navigator.usb.getDevices as jest.Mock).mockResolvedValue([
        trezorDevice,
      ]);

      const result = await getConnectedDevices(HardwareWalletType.Trezor);

      expect(result).toEqual([trezorDevice]);
    });

    it('returns empty array for unsupported wallet type', async () => {
      const result = await getConnectedDevices(
        'unsupported' as HardwareWalletType,
      );

      expect(result).toEqual([]);
    });
  });

  describe('isDeviceConnected', () => {
    it('returns true when Ledger devices are connected and no specific device ID is provided', async () => {
      (window.navigator.hid.getDevices as jest.Mock).mockResolvedValue([
        createMockHIDDevice(),
      ]);

      const result = await isDeviceConnected();

      expect(result).toBe(true);
    });

    it('returns false when no Ledger devices are connected and no specific device ID is provided', async () => {
      (window.navigator.hid.getDevices as jest.Mock).mockResolvedValue([]);

      const result = await isDeviceConnected();

      expect(result).toBe(false);
    });

    it('returns true when specific device ID matches connected device', async () => {
      const deviceId = '1';
      const device: MockHIDDevice = createMockHIDDevice();
      device.productId = Number(deviceId);
      (window.navigator.hid.getDevices as jest.Mock).mockResolvedValue([
        device,
      ]);

      const result = await isDeviceConnected(deviceId);

      expect(result).toBe(true);
    });

    it('returns false when specific device ID does not match any connected device', async () => {
      const deviceId = '999';
      const device: MockHIDDevice = createMockHIDDevice();
      device.productId = 1;
      (window.navigator.hid.getDevices as jest.Mock).mockResolvedValue([
        device,
      ]);

      const result = await isDeviceConnected(deviceId);

      expect(result).toBe(false);
    });
  });

  describe('isHardwareWalletConnected', () => {
    it('returns true when devices are connected and no specific device ID is provided', async () => {
      (window.navigator.hid.getDevices as jest.Mock).mockResolvedValue([
        createMockHIDDevice(),
      ]);

      const result = await isHardwareWalletConnected(HardwareWalletType.Ledger);

      expect(result).toBe(true);
    });

    it('returns false when no devices are connected and no specific device ID is provided', async () => {
      (window.navigator.hid.getDevices as jest.Mock).mockResolvedValue([]);

      const result = await isHardwareWalletConnected(HardwareWalletType.Ledger);

      expect(result).toBe(false);
    });

    it('returns true when specific device ID matches connected device', async () => {
      const deviceId = '1';
      const device: MockHIDDevice = createMockHIDDevice();
      device.productId = Number(deviceId);
      (window.navigator.hid.getDevices as jest.Mock).mockResolvedValue([
        device,
      ]);

      const result = await isHardwareWalletConnected(
        HardwareWalletType.Ledger,
        deviceId,
      );

      expect(result).toBe(true);
    });

    it('returns false when specific device ID does not match any connected device', async () => {
      const deviceId = '999';
      const device: MockHIDDevice = createMockHIDDevice();
      device.productId = 1;
      (window.navigator.hid.getDevices as jest.Mock).mockResolvedValue([
        device,
      ]);

      const result = await isHardwareWalletConnected(
        HardwareWalletType.Ledger,
        deviceId,
      );

      expect(result).toBe(false);
    });
  });

  describe('getDeviceId', () => {
    it('returns product ID of first connected Ledger device', async () => {
      const device: MockHIDDevice = createMockHIDDevice();
      device.productId = 123;
      (window.navigator.hid.getDevices as jest.Mock).mockResolvedValue([
        device,
      ]);

      const result = await getDeviceId();

      expect(result).toBe('123');
    });

    it('returns null when no Ledger devices are connected', async () => {
      (window.navigator.hid.getDevices as jest.Mock).mockResolvedValue([]);

      const result = await getDeviceId();

      expect(result).toBe(null);
    });
  });

  describe('getHardwareWalletDeviceId', () => {
    it('returns product ID of first connected device for wallet type', async () => {
      const device: MockHIDDevice = createMockHIDDevice();
      device.productId = 456;
      (window.navigator.hid.getDevices as jest.Mock).mockResolvedValue([
        device,
      ]);

      const result = await getHardwareWalletDeviceId(HardwareWalletType.Ledger);

      expect(result).toBe('456');
    });

    it('returns null when no devices are connected for wallet type', async () => {
      (window.navigator.hid.getDevices as jest.Mock).mockResolvedValue([]);

      const result = await getHardwareWalletDeviceId(HardwareWalletType.Ledger);

      expect(result).toBe(null);
    });
  });

  describe('subscribeToWebHidEvents', () => {
    let mockOnConnect: jest.Mock;
    let mockOnDisconnect: jest.Mock;
    let unsubscribe: () => void;

    beforeEach(() => {
      mockOnConnect = jest.fn();
      mockOnDisconnect = jest.fn();
    });

    afterEach(() => {
      if (unsubscribe) {
        unsubscribe();
      }
    });

    it('returns unsubscribe function when WebHID is available', () => {
      unsubscribe = subscribeToWebHidEvents(
        HardwareWalletType.Ledger,
        mockOnConnect,
        mockOnDisconnect,
      );

      expect(typeof unsubscribe).toBe('function');
      expect(getMockedHid().addEventListener).toHaveBeenCalledWith(
        'connect',
        expect.any(Function),
      );
      expect(getMockedHid().addEventListener).toHaveBeenCalledWith(
        'disconnect',
        expect.any(Function),
      );
    });

    it('calls onConnect callback when Ledger device connects', () => {
      unsubscribe = subscribeToWebHidEvents(
        HardwareWalletType.Ledger,
        mockOnConnect,
        mockOnDisconnect,
      );
      const ledgerDevice = createMockHIDDevice() as HIDDevice;

      // Get the connect event handler that was registered
      const connectHandler = getMockEventHandler(
        getMockedHid().addEventListener.mock.calls,
        'connect',
      );

      // Simulate a connect event
      connectHandler({ device: ledgerDevice });

      expect(mockOnConnect).toHaveBeenCalledWith(ledgerDevice);
      expect(mockOnConnect).toHaveBeenCalledTimes(1);
    });

    it('ignores non-Ledger devices on connect', () => {
      unsubscribe = subscribeToWebHidEvents(
        HardwareWalletType.Ledger,
        mockOnConnect,
        mockOnDisconnect,
      );
      const nonLedgerDevice = createMockHIDDevice(0x1234) as HIDDevice;

      const connectHandler = getMockEventHandler(
        getMockedHid().addEventListener.mock.calls,
        'connect',
      );

      connectHandler({ device: nonLedgerDevice });

      expect(mockOnConnect).not.toHaveBeenCalled();
    });

    it('calls onDisconnect callback when Ledger device disconnects', () => {
      unsubscribe = subscribeToWebHidEvents(
        HardwareWalletType.Ledger,
        mockOnConnect,
        mockOnDisconnect,
      );
      const ledgerDevice = createMockHIDDevice() as HIDDevice;

      const disconnectHandler = getMockEventHandler(
        getMockedHid().addEventListener.mock.calls,
        'disconnect',
      );

      disconnectHandler({ device: ledgerDevice });

      expect(mockOnDisconnect).toHaveBeenCalledWith(ledgerDevice);
      expect(mockOnDisconnect).toHaveBeenCalledTimes(1);
    });

    it('ignores non-Ledger devices on disconnect', () => {
      unsubscribe = subscribeToWebHidEvents(
        HardwareWalletType.Ledger,
        mockOnConnect,
        mockOnDisconnect,
      );
      const nonLedgerDevice = createMockHIDDevice(0x1234) as HIDDevice;

      const disconnectHandler = getMockEventHandler(
        getMockedHid().addEventListener.mock.calls,
        'disconnect',
      );

      disconnectHandler({ device: nonLedgerDevice });

      expect(mockOnDisconnect).not.toHaveBeenCalled();
    });

    it('handles multiple Ledger devices correctly', () => {
      unsubscribe = subscribeToWebHidEvents(
        HardwareWalletType.Ledger,
        mockOnConnect,
        mockOnDisconnect,
      );
      const ledgerDevice1 = createMockHIDDevice(
        DEFAULT_LEDGER_VENDOR_ID,
        0x0001,
      ) as HIDDevice;
      const ledgerDevice2 = createMockHIDDevice(
        DEFAULT_LEDGER_VENDOR_ID,
        0x0002,
      ) as HIDDevice;

      const connectHandler = getMockEventHandler(
        getMockedHid().addEventListener.mock.calls,
        'connect',
      );

      connectHandler({ device: ledgerDevice1 });
      connectHandler({ device: ledgerDevice2 });

      expect(mockOnConnect).toHaveBeenCalledWith(ledgerDevice1);
      expect(mockOnConnect).toHaveBeenCalledWith(ledgerDevice2);
      expect(mockOnConnect).toHaveBeenCalledTimes(2);
    });

    it('returns no-op function when WebHID is not available', () => {
      // Temporarily remove hid property
      const originalHid = window.navigator.hid;
      delete (window.navigator as { hid?: HID }).hid;

      unsubscribe = subscribeToWebHidEvents(
        HardwareWalletType.Ledger,
        mockOnConnect,
        mockOnDisconnect,
      );

      expect(typeof unsubscribe).toBe('function');

      // Should not have called addEventListener since HID is not available
      expect(
        (originalHid as jest.Mocked<HID>).addEventListener,
      ).not.toHaveBeenCalled();

      // Restore hid property
      Object.defineProperty(window.navigator, 'hid', {
        value: originalHid,
        configurable: true,
      });
    });

    it('unsubscribes by removing event listeners', () => {
      unsubscribe = subscribeToWebHidEvents(
        HardwareWalletType.Ledger,
        mockOnConnect,
        mockOnDisconnect,
      );

      unsubscribe();

      expect(getMockedHid().removeEventListener).toHaveBeenCalledWith(
        'connect',
        expect.any(Function),
      );
      expect(getMockedHid().removeEventListener).toHaveBeenCalledWith(
        'disconnect',
        expect.any(Function),
      );
    });

    it('unsubscribe removes the correct event listeners', () => {
      unsubscribe = subscribeToWebHidEvents(
        HardwareWalletType.Ledger,
        mockOnConnect,
        mockOnDisconnect,
      );

      // Get the handlers that were added
      const connectHandler = getMockEventHandler(
        getMockedHid().addEventListener.mock.calls,
        'connect',
      );
      const disconnectHandler = getMockEventHandler(
        getMockedHid().addEventListener.mock.calls,
        'disconnect',
      );

      unsubscribe();

      // Verify that removeEventListener was called with the same handlers
      expect(getMockedHid().removeEventListener).toHaveBeenCalledWith(
        'connect',
        connectHandler,
      );
      expect(getMockedHid().removeEventListener).toHaveBeenCalledWith(
        'disconnect',
        disconnectHandler,
      );
    });
  });

  describe('subscribeToWebUsbEvents', () => {
    let mockOnConnect: jest.Mock;
    let mockOnDisconnect: jest.Mock;
    let unsubscribe: () => void;

    beforeEach(() => {
      mockOnConnect = jest.fn();
      mockOnDisconnect = jest.fn();
    });

    afterEach(() => {
      if (unsubscribe) {
        unsubscribe();
      }
    });

    it('returns unsubscribe function when WebUSB is available', () => {
      unsubscribe = subscribeToWebUsbEvents(
        HardwareWalletType.Trezor,
        mockOnConnect,
        mockOnDisconnect,
      );

      expect(typeof unsubscribe).toBe('function');
      expect(getMockedUsb().addEventListener).toHaveBeenCalledWith(
        'connect',
        expect.any(Function),
      );
      expect(getMockedUsb().addEventListener).toHaveBeenCalledWith(
        'disconnect',
        expect.any(Function),
      );
    });

    it('calls onConnect callback when Trezor device connects', () => {
      unsubscribe = subscribeToWebUsbEvents(
        HardwareWalletType.Trezor,
        mockOnConnect,
        mockOnDisconnect,
      );
      const trezorDevice = createMockUSBDevice() as USBDevice;

      const connectHandler = getMockEventHandler(
        getMockedUsb().addEventListener.mock.calls,
        'connect',
      );

      connectHandler({ device: trezorDevice });

      expect(mockOnConnect).toHaveBeenCalledWith(trezorDevice);
      expect(mockOnConnect).toHaveBeenCalledTimes(1);
    });

    it('ignores non-Trezor devices on connect', () => {
      unsubscribe = subscribeToWebUsbEvents(
        HardwareWalletType.Trezor,
        mockOnConnect,
        mockOnDisconnect,
      );
      const nonTrezorDevice = createMockUSBDevice(0x1234);

      const connectHandler = getMockEventHandler(
        getMockedUsb().addEventListener.mock.calls,
        'connect',
      );

      connectHandler({ device: nonTrezorDevice });

      expect(mockOnConnect).not.toHaveBeenCalled();
    });

    it('calls onDisconnect callback when Trezor device disconnects', () => {
      unsubscribe = subscribeToWebUsbEvents(
        HardwareWalletType.Trezor,
        mockOnConnect,
        mockOnDisconnect,
      );
      const trezorDevice = createMockUSBDevice() as USBDevice;

      const disconnectHandler = getMockEventHandler(
        getMockedUsb().addEventListener.mock.calls,
        'disconnect',
      );

      disconnectHandler({ device: trezorDevice });

      expect(mockOnDisconnect).toHaveBeenCalledWith(trezorDevice);
      expect(mockOnDisconnect).toHaveBeenCalledTimes(1);
    });

    it('ignores non-Trezor devices on disconnect', () => {
      unsubscribe = subscribeToWebUsbEvents(
        HardwareWalletType.Trezor,
        mockOnConnect,
        mockOnDisconnect,
      );
      const nonTrezorDevice = createMockUSBDevice(0x1234);

      const disconnectHandler = getMockEventHandler(
        getMockedUsb().addEventListener.mock.calls,
        'disconnect',
      );

      disconnectHandler({ device: nonTrezorDevice });

      expect(mockOnDisconnect).not.toHaveBeenCalled();
    });

    it('handles multiple Trezor devices correctly', () => {
      unsubscribe = subscribeToWebUsbEvents(
        HardwareWalletType.Trezor,
        mockOnConnect,
        mockOnDisconnect,
      );
      const trezorDevice1 = createMockUSBDevice();
      const trezorDevice2 = createMockUSBDevice(
        TREZOR_USB_VENDOR_IDS[1].vendorId,
        TREZOR_USB_VENDOR_IDS[1].productId,
      );

      const connectHandler = getMockEventHandler(
        getMockedUsb().addEventListener.mock.calls,
        'connect',
      );

      connectHandler({ device: trezorDevice1 });
      connectHandler({ device: trezorDevice2 });

      expect(mockOnConnect).toHaveBeenCalledWith(trezorDevice1);
      expect(mockOnConnect).toHaveBeenCalledWith(trezorDevice2);
      expect(mockOnConnect).toHaveBeenCalledTimes(2);
    });

    it('returns no-op function when WebUSB is not available', () => {
      // Temporarily remove usb property
      const originalUsb = window.navigator.usb;
      delete (window.navigator as { usb?: USB }).usb;

      unsubscribe = subscribeToWebUsbEvents(
        HardwareWalletType.Trezor,
        mockOnConnect,
        mockOnDisconnect,
      );

      expect(typeof unsubscribe).toBe('function');

      // Should not have called addEventListener since USB is not available
      expect(
        (originalUsb as jest.Mocked<USB>).addEventListener,
      ).not.toHaveBeenCalled();

      // Restore usb property
      Object.defineProperty(window.navigator, 'usb', {
        value: originalUsb,
        configurable: true,
      });
    });

    it('unsubscribes by removing event listeners', () => {
      unsubscribe = subscribeToWebUsbEvents(
        HardwareWalletType.Trezor,
        mockOnConnect,
        mockOnDisconnect,
      );

      unsubscribe();

      expect(getMockedUsb().removeEventListener).toHaveBeenCalledWith(
        'connect',
        expect.any(Function),
      );
      expect(getMockedUsb().removeEventListener).toHaveBeenCalledWith(
        'disconnect',
        expect.any(Function),
      );
    });

    it('unsubscribe removes the correct event listeners', () => {
      unsubscribe = subscribeToWebUsbEvents(
        HardwareWalletType.Trezor,
        mockOnConnect,
        mockOnDisconnect,
      );

      const connectHandler = getMockEventHandler(
        getMockedUsb().addEventListener.mock.calls,
        'connect',
      );
      const disconnectHandler = getMockEventHandler(
        getMockedUsb().addEventListener.mock.calls,
        'disconnect',
      );

      unsubscribe();

      expect(getMockedUsb().removeEventListener).toHaveBeenCalledWith(
        'connect',
        connectHandler,
      );
      expect(getMockedUsb().removeEventListener).toHaveBeenCalledWith(
        'disconnect',
        disconnectHandler,
      );
    });
  });

  describe('getConnectedLedgerDevices', () => {
    it('filters Ledger devices correctly in getConnectedLedgerDevices', async () => {
      const ledgerDevice = createMockHIDDevice() as HIDDevice;
      const nonLedgerDevice = createMockHIDDevice(0x1234) as HIDDevice;
      const anotherLedgerDevice = createMockHIDDevice(
        Number(LEDGER_USB_VENDOR_ID),
        0x0002,
      ) as HIDDevice;
      getMockedHid().getDevices.mockResolvedValue([
        ledgerDevice,
        nonLedgerDevice,
        anotherLedgerDevice,
      ]);

      const result = await getConnectedLedgerDevices();

      expect(result).toEqual([ledgerDevice, anotherLedgerDevice]);
      expect(getMockedHid().getDevices).toHaveBeenCalled();
    });

    it('filters Trezor devices correctly in getConnectedTrezorDevices', async () => {
      const trezorDevice1 = createMockUSBDevice();
      const trezorDevice2 = createMockUSBDevice(
        TREZOR_USB_VENDOR_IDS[1].vendorId,
        TREZOR_USB_VENDOR_IDS[1].productId,
      );
      const nonTrezorDevice = createMockUSBDevice(0x1234);
      getMockedUsb().getDevices.mockResolvedValue([
        trezorDevice1,
        nonTrezorDevice,
        trezorDevice2,
      ]);

      const result = await getConnectedTrezorDevices();

      expect(result).toEqual([trezorDevice1, trezorDevice2]);
      expect(getMockedUsb().getDevices).toHaveBeenCalled();
    });

    it('matches Trezor devices with correct vendor and product IDs', async () => {
      // Test multiple Trezor models
      const trezorOne = createMockUSBDevice();
      const trezorT = createMockUSBDevice(
        TREZOR_USB_VENDOR_IDS[1].vendorId,
        TREZOR_USB_VENDOR_IDS[1].productId,
      );

      getMockedUsb().getDevices.mockResolvedValue([trezorOne, trezorT]);

      const result = await getConnectedTrezorDevices();

      expect(result).toEqual([trezorOne, trezorT]);
      expect(getMockedUsb().getDevices).toHaveBeenCalled();
    });

    it('rejects Trezor devices with matching vendor but wrong product ID', async () => {
      const fakeTrezorDevice = createMockUSBDevice(
        TREZOR_USB_VENDOR_IDS[0].vendorId,
        0x9999, // Wrong product ID
      );
      getMockedUsb().getDevices.mockResolvedValue([fakeTrezorDevice]);

      const result = await getConnectedTrezorDevices();

      expect(result).toEqual([]);
      expect(getMockedUsb().getDevices).toHaveBeenCalled();
    });
  });

  describe('requestWebHidPermission - additional error handling', () => {
    it('handles error message with "denied" substring', async () => {
      const error = new Error('Permission request was denied by user');
      getMockedHid().requestDevice.mockRejectedValue(error);

      const result = await requestWebHidPermission(HardwareWalletType.Ledger);

      expect(result).toBe(false);
    });

    it('handles various cancellation error message formats', async () => {
      const cancellationMessages = [
        'User cancelled the requestDevice() chooser.',
        'The user cancelled the dialog',
        'Request cancelled',
        'cancelled',
      ];

      for (const message of cancellationMessages) {
        const error = new Error(message);
        getMockedHid().requestDevice.mockRejectedValue(error);

        const result = await requestWebHidPermission(HardwareWalletType.Ledger);

        expect(result).toBe(false);
      }
    });
  });

  describe('requestWebUsbPermission - additional error handling', () => {
    it('handles error message with "denied" substring', async () => {
      const error = new Error('Permission request was denied by user');
      getMockedUsb().requestDevice.mockRejectedValue(error);

      const result = await requestWebUsbPermission(HardwareWalletType.Trezor);

      expect(result).toBe(false);
    });

    it('handles various cancellation error message formats', async () => {
      const cancellationMessages = [
        'User cancelled the requestDevice() chooser.',
        'The user cancelled the dialog',
        'Request cancelled',
        'cancelled',
      ];

      for (const message of cancellationMessages) {
        const error = new Error(message);
        getMockedUsb().requestDevice.mockRejectedValue(error);

        const result = await requestWebUsbPermission(HardwareWalletType.Trezor);

        expect(result).toBe(false);
      }
    });
  });

  describe('edge cases and additional coverage', () => {
    it('handles multiple Ledger devices with different product IDs', async () => {
      const ledgerDevice1 = createMockHIDDevice(undefined, 0x0001) as HIDDevice;
      const ledgerDevice2 = createMockHIDDevice(undefined, 0x0002) as HIDDevice;
      const ledgerDevice3 = createMockHIDDevice(undefined, 0x0003) as HIDDevice;
      getMockedHid().getDevices.mockResolvedValue([
        ledgerDevice1,
        ledgerDevice2,
        ledgerDevice3,
      ]);

      const result = await getConnectedLedgerDevices();

      expect(result).toEqual([ledgerDevice1, ledgerDevice2, ledgerDevice3]);
      expect(result).toHaveLength(3);
    });

    it('handles empty device arrays gracefully', async () => {
      getMockedHid().getDevices.mockResolvedValue([]);
      getMockedUsb().getDevices.mockResolvedValue([]);

      const ledgerResult = await getConnectedLedgerDevices();
      const trezorResult = await getConnectedTrezorDevices();

      expect(ledgerResult).toEqual([]);
      expect(trezorResult).toEqual([]);
    });

    it('handles mixed device arrays with multiple vendors', async () => {
      const devices = [
        createMockHIDDevice() as HIDDevice,
        createMockHIDDevice(0x05ac) as HIDDevice, // invalid vendor ID
        createMockHIDDevice(0x04b8) as HIDDevice, // invalid vendor ID
        createMockHIDDevice(0x046d) as HIDDevice, // invalid vendor ID
      ];
      getMockedHid().getDevices.mockResolvedValue(devices);

      const result = await getConnectedLedgerDevices();

      expect(result).toHaveLength(1);
      expect(result[0].vendorId).toBe(Number(LEDGER_USB_VENDOR_ID));
    });

    it('checkWebHidPermission returns Prompt when mixed devices exist but no Ledger', async () => {
      const nonLedgerDevices = [
        createMockHIDDevice(0x05ac) as HIDDevice, // invalid vendor ID
        createMockHIDDevice(0x04b8) as HIDDevice, // invalid vendor ID
      ];
      getMockedHid().getDevices.mockResolvedValue(nonLedgerDevices);

      const result = await checkWebHidPermission(HardwareWalletType.Ledger);

      expect(result).toBe(HardwareConnectionPermissionState.Prompt);
    });

    it('checkWebUsbPermission returns Prompt when mixed devices exist but no Trezor', async () => {
      const nonTrezorDevices = [
        createMockUSBDevice(0x05ac), // invalid vendor ID
        createMockUSBDevice(0x04b8), // invalid vendor ID
      ];
      getMockedUsb().getDevices.mockResolvedValue(nonTrezorDevices);

      const result = await checkWebUsbPermission(HardwareWalletType.Trezor);

      expect(result).toBe(HardwareConnectionPermissionState.Prompt);
    });
  });
});
