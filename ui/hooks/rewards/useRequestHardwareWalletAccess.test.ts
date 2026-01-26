import { renderHook } from '@testing-library/react-hooks';
import log from 'loglevel';
import {
  HardwareKeyringType,
  LEDGER_USB_VENDOR_ID,
  LedgerTransportTypes,
} from '../../../shared/constants/hardware-wallets';

// Import after mocks
import { useRequestHardwareWalletAccess } from './useRequestHardwareWalletAccess';

// Mock the selectors
const mockIsHardwareWallet = jest.fn();
const mockGetHardwareWalletType = jest.fn();
const mockGetLedgerTransportType = jest.fn();

jest.mock('../../selectors', () => ({
  isHardwareWallet: (...args: unknown[]) => mockIsHardwareWallet(...args),
  getHardwareWalletType: (...args: unknown[]) =>
    mockGetHardwareWalletType(...args),
}));

jest.mock('../../ducks/metamask/metamask', () => ({
  getLedgerTransportType: (...args: unknown[]) =>
    mockGetLedgerTransportType(...args),
}));

// Mock loglevel
jest.mock('loglevel', () => ({
  error: jest.fn(),
}));

// Mock react-redux useSelector to call our mocked selectors
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn((selector) => {
    // Call the selector with a minimal state object
    return selector({});
  }),
}));

describe('useRequestHardwareWalletAccess', () => {
  let originalNavigatorHid: HID | undefined;
  let originalNavigatorUsb: USB | undefined;
  let mockRequestDeviceHid: jest.Mock;
  let mockRequestDeviceUsb: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Save original navigator properties
    originalNavigatorHid = window.navigator.hid;
    originalNavigatorUsb = window.navigator.usb;

    // Setup mock HID
    mockRequestDeviceHid = jest.fn();
    Object.defineProperty(window.navigator, 'hid', {
      value: {
        requestDevice: mockRequestDeviceHid,
      },
      writable: true,
      configurable: true,
    });

    // Setup mock USB
    mockRequestDeviceUsb = jest.fn();
    Object.defineProperty(window.navigator, 'usb', {
      value: {
        requestDevice: mockRequestDeviceUsb,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original navigator properties
    Object.defineProperty(window.navigator, 'hid', {
      value: originalNavigatorHid,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window.navigator, 'usb', {
      value: originalNavigatorUsb,
      writable: true,
      configurable: true,
    });
  });

  describe('isHardwareWalletAccount flag', () => {
    it('returns false when account is not a hardware wallet', () => {
      mockIsHardwareWallet.mockReturnValue(false);
      mockGetHardwareWalletType.mockReturnValue(null);
      mockGetLedgerTransportType.mockReturnValue(null);

      const { result } = renderHook(() => useRequestHardwareWalletAccess());

      expect(result.current.isHardwareWalletAccount).toBe(false);
    });

    it('returns true when account is a hardware wallet', () => {
      mockIsHardwareWallet.mockReturnValue(true);
      mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.ledger);
      mockGetLedgerTransportType.mockReturnValue(LedgerTransportTypes.webhid);

      const { result } = renderHook(() => useRequestHardwareWalletAccess());

      expect(result.current.isHardwareWalletAccount).toBe(true);
    });
  });

  describe('requestHardwareWalletAccess - non-hardware wallet', () => {
    it('returns true immediately when account is not a hardware wallet', async () => {
      mockIsHardwareWallet.mockReturnValue(false);
      mockGetHardwareWalletType.mockReturnValue(null);
      mockGetLedgerTransportType.mockReturnValue(null);

      const { result } = renderHook(() => useRequestHardwareWalletAccess());

      const accessGranted = await result.current.requestHardwareWalletAccess();

      expect(accessGranted).toBe(true);
      expect(mockRequestDeviceHid).not.toHaveBeenCalled();
      expect(mockRequestDeviceUsb).not.toHaveBeenCalled();
    });
  });

  describe('requestHardwareWalletAccess - Ledger with WebHID', () => {
    beforeEach(() => {
      mockIsHardwareWallet.mockReturnValue(true);
      mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.ledger);
      mockGetLedgerTransportType.mockReturnValue(LedgerTransportTypes.webhid);
    });

    it('returns true when Ledger device is connected with correct vendor ID', async () => {
      const mockDevice = {
        vendorId: Number(LEDGER_USB_VENDOR_ID),
        productId: 0x0001,
      } as HIDDevice;

      mockRequestDeviceHid.mockResolvedValue([mockDevice]);

      const { result } = renderHook(() => useRequestHardwareWalletAccess());

      const accessGranted = await result.current.requestHardwareWalletAccess();

      expect(accessGranted).toBe(true);
      expect(mockRequestDeviceHid).toHaveBeenCalledWith({
        filters: [{ vendorId: Number(LEDGER_USB_VENDOR_ID) }],
      });
    });

    it('returns false when no Ledger device is found', async () => {
      mockRequestDeviceHid.mockResolvedValue([]);

      const { result } = renderHook(() => useRequestHardwareWalletAccess());

      const accessGranted = await result.current.requestHardwareWalletAccess();

      expect(accessGranted).toBe(false);
      expect(mockRequestDeviceHid).toHaveBeenCalled();
    });

    it('returns false when connected device has wrong vendor ID', async () => {
      const mockDevice = {
        vendorId: 0x1234, // Wrong vendor ID
        productId: 0x0001,
      } as HIDDevice;

      mockRequestDeviceHid.mockResolvedValue([mockDevice]);

      const { result } = renderHook(() => useRequestHardwareWalletAccess());

      const accessGranted = await result.current.requestHardwareWalletAccess();

      expect(accessGranted).toBe(false);
    });

    it('returns true when multiple devices are returned and at least one has correct vendor ID', async () => {
      const mockDevice1 = {
        vendorId: 0x1234, // Wrong vendor ID
        productId: 0x0001,
      } as HIDDevice;
      const mockDevice2 = {
        vendorId: Number(LEDGER_USB_VENDOR_ID), // Correct vendor ID
        productId: 0x0001,
      } as HIDDevice;

      mockRequestDeviceHid.mockResolvedValue([mockDevice1, mockDevice2]);

      const { result } = renderHook(() => useRequestHardwareWalletAccess());

      const accessGranted = await result.current.requestHardwareWalletAccess();

      expect(accessGranted).toBe(true);
    });

    it('returns false when user cancels device selection', async () => {
      const error = new Error('No device selected');
      mockRequestDeviceHid.mockRejectedValue(error);

      const { result } = renderHook(() => useRequestHardwareWalletAccess());

      const accessGranted = await result.current.requestHardwareWalletAccess();

      expect(accessGranted).toBe(false);
      expect(log.error).not.toHaveBeenCalled();
    });

    it('returns false and logs error when requestDevice throws non-cancellation error', async () => {
      const error = new Error('Permission denied');
      mockRequestDeviceHid.mockRejectedValue(error);

      const { result } = renderHook(() => useRequestHardwareWalletAccess());

      const accessGranted = await result.current.requestHardwareWalletAccess();

      expect(accessGranted).toBe(false);
      expect(log.error).toHaveBeenCalledWith(
        'Hardware wallet access request failed:',
        error,
      );
    });

    it('handles string error messages', async () => {
      const error = 'Some string error';
      mockRequestDeviceHid.mockRejectedValue(error);

      const { result } = renderHook(() => useRequestHardwareWalletAccess());

      const accessGranted = await result.current.requestHardwareWalletAccess();

      expect(accessGranted).toBe(false);
      expect(log.error).toHaveBeenCalledWith(
        'Hardware wallet access request failed:',
        error,
      );
    });
  });

  describe('requestHardwareWalletAccess - Trezor with WebUSB', () => {
    beforeEach(() => {
      mockIsHardwareWallet.mockReturnValue(true);
      mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.trezor);
      mockGetLedgerTransportType.mockReturnValue(null);
    });

    it('returns true when Trezor device access is granted', async () => {
      mockRequestDeviceUsb.mockResolvedValue({});

      const { result } = renderHook(() => useRequestHardwareWalletAccess());

      const accessGranted = await result.current.requestHardwareWalletAccess();

      expect(accessGranted).toBe(true);
      expect(mockRequestDeviceUsb).toHaveBeenCalledWith({
        filters: [
          { vendorId: 0x534c, productId: 0x0001 }, // Trezor One
          { vendorId: 0x1209, productId: 0x53c0 }, // Trezor Model T
          { vendorId: 0x1209, productId: 0x53c1 }, // Trezor Safe 3
        ],
      });
    });

    it('returns false when user cancels device selection', async () => {
      const error = new Error('No device selected');
      mockRequestDeviceUsb.mockRejectedValue(error);

      const { result } = renderHook(() => useRequestHardwareWalletAccess());

      const accessGranted = await result.current.requestHardwareWalletAccess();

      expect(accessGranted).toBe(false);
      expect(log.error).not.toHaveBeenCalled();
    });

    it('returns false and logs error when requestDevice throws non-cancellation error', async () => {
      const error = new Error('Permission denied');
      mockRequestDeviceUsb.mockRejectedValue(error);

      const { result } = renderHook(() => useRequestHardwareWalletAccess());

      const accessGranted = await result.current.requestHardwareWalletAccess();

      expect(accessGranted).toBe(false);
      expect(log.error).toHaveBeenCalledWith(
        'Hardware wallet access request failed:',
        error,
      );
    });

    it('returns false when WebUSB is not available', async () => {
      Object.defineProperty(window.navigator, 'usb', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useRequestHardwareWalletAccess());

      const accessGranted = await result.current.requestHardwareWalletAccess();

      expect(accessGranted).toBe(false);
      expect(mockRequestDeviceUsb).not.toHaveBeenCalled();
    });
  });

  describe('requestHardwareWalletAccess - Lattice', () => {
    beforeEach(() => {
      mockIsHardwareWallet.mockReturnValue(true);
      mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.lattice);
      mockGetLedgerTransportType.mockReturnValue(null);
    });

    it('returns true without requesting device access', async () => {
      const { result } = renderHook(() => useRequestHardwareWalletAccess());

      const accessGranted = await result.current.requestHardwareWalletAccess();

      expect(accessGranted).toBe(true);
      expect(mockRequestDeviceHid).not.toHaveBeenCalled();
      expect(mockRequestDeviceUsb).not.toHaveBeenCalled();
    });
  });

  describe('requestHardwareWalletAccess - QR hardware wallet', () => {
    beforeEach(() => {
      mockIsHardwareWallet.mockReturnValue(true);
      mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.qr);
      mockGetLedgerTransportType.mockReturnValue(null);
    });

    it('returns true without requesting device access', async () => {
      const { result } = renderHook(() => useRequestHardwareWalletAccess());

      const accessGranted = await result.current.requestHardwareWalletAccess();

      expect(accessGranted).toBe(true);
      expect(mockRequestDeviceHid).not.toHaveBeenCalled();
      expect(mockRequestDeviceUsb).not.toHaveBeenCalled();
    });
  });

  describe('requestHardwareWalletAccess - Ledger with non-WebHID transport', () => {
    beforeEach(() => {
      mockIsHardwareWallet.mockReturnValue(true);
      mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.ledger);
      mockGetLedgerTransportType.mockReturnValue(LedgerTransportTypes.u2f);
    });

    it('returns false when Ledger uses U2F transport (not WebHID)', async () => {
      // When ledgerTransportType is not webhid, the hook should fall through
      // to the Lattice/QR check, which will return false since hardwareWalletType is ledger
      const { result } = renderHook(() => useRequestHardwareWalletAccess());

      const accessGranted = await result.current.requestHardwareWalletAccess();

      expect(accessGranted).toBe(false);
      expect(mockRequestDeviceHid).not.toHaveBeenCalled();
      expect(mockRequestDeviceUsb).not.toHaveBeenCalled();
    });
  });

  describe('requestHardwareWalletAccess - callback memoization', () => {
    it('returns stable function reference when dependencies do not change', () => {
      mockIsHardwareWallet.mockReturnValue(true);
      mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.ledger);
      mockGetLedgerTransportType.mockReturnValue(LedgerTransportTypes.webhid);

      const { result, rerender } = renderHook(() =>
        useRequestHardwareWalletAccess(),
      );

      const firstFunction = result.current.requestHardwareWalletAccess;
      rerender();
      const secondFunction = result.current.requestHardwareWalletAccess;

      expect(firstFunction).toBe(secondFunction);
    });

    it('returns new function reference when isHardwareWalletAccount changes', () => {
      mockIsHardwareWallet.mockReturnValue(false);
      mockGetHardwareWalletType.mockReturnValue(null);
      mockGetLedgerTransportType.mockReturnValue(null);

      const { result, rerender } = renderHook(() =>
        useRequestHardwareWalletAccess(),
      );

      const firstFunction = result.current.requestHardwareWalletAccess;

      mockIsHardwareWallet.mockReturnValue(true);
      mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.ledger);
      mockGetLedgerTransportType.mockReturnValue(LedgerTransportTypes.webhid);
      rerender();

      const secondFunction = result.current.requestHardwareWalletAccess;

      expect(firstFunction).not.toBe(secondFunction);
    });

    it('returns new function reference when hardwareWalletType changes', () => {
      mockIsHardwareWallet.mockReturnValue(true);
      mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.ledger);
      mockGetLedgerTransportType.mockReturnValue(LedgerTransportTypes.webhid);

      const { result, rerender } = renderHook(() =>
        useRequestHardwareWalletAccess(),
      );

      const firstFunction = result.current.requestHardwareWalletAccess;

      mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.trezor);
      rerender();

      const secondFunction = result.current.requestHardwareWalletAccess;

      expect(firstFunction).not.toBe(secondFunction);
    });

    it('returns new function reference when ledgerTransportType changes', () => {
      mockIsHardwareWallet.mockReturnValue(true);
      mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.ledger);
      mockGetLedgerTransportType.mockReturnValue(LedgerTransportTypes.webhid);

      const { result, rerender } = renderHook(() =>
        useRequestHardwareWalletAccess(),
      );

      const firstFunction = result.current.requestHardwareWalletAccess;

      mockGetLedgerTransportType.mockReturnValue(LedgerTransportTypes.u2f);
      rerender();

      const secondFunction = result.current.requestHardwareWalletAccess;

      expect(firstFunction).not.toBe(secondFunction);
    });
  });

  describe('requestHardwareWalletAccess - return type structure', () => {
    it('returns correct shape with requestHardwareWalletAccess and isHardwareWalletAccount', () => {
      mockIsHardwareWallet.mockReturnValue(false);
      mockGetHardwareWalletType.mockReturnValue(null);
      mockGetLedgerTransportType.mockReturnValue(null);

      const { result } = renderHook(() => useRequestHardwareWalletAccess());

      expect(result.current).toHaveProperty('requestHardwareWalletAccess');
      expect(result.current).toHaveProperty('isHardwareWalletAccount');
      expect(typeof result.current.requestHardwareWalletAccess).toBe(
        'function',
      );
      expect(typeof result.current.isHardwareWalletAccount).toBe('boolean');
    });
  });
});
