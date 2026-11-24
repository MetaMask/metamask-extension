import { LEDGER_USB_VENDOR_ID } from '../../../shared/constants/hardware-wallets';
import {
  getConnectedLedgerDeviceInfo,
  getConnectedLedgerHidDevices,
} from './ledger-hid-utils';

describe('getConnectedLedgerHidDevices', () => {
  const mockGetDevices = jest.fn();

  const createDevice = (vendorId: number, productId = 0x0001): HIDDevice =>
    ({
      vendorId,
      productId,
      productName: 'Ledger Nano X',
    }) as HIDDevice;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(globalThis, 'navigator', {
      value: { hid: { getDevices: mockGetDevices } },
      writable: true,
      configurable: true,
    });
  });

  it('returns only Ledger-vendor devices', async () => {
    const ledgerDevice = createDevice(Number(LEDGER_USB_VENDOR_ID));
    const otherDevice = createDevice(0x1234);

    mockGetDevices.mockResolvedValue([ledgerDevice, otherDevice]);

    await expect(getConnectedLedgerHidDevices()).resolves.toStrictEqual([
      ledgerDevice,
    ]);
  });

  it('resolves to an empty array when none are connected', async () => {
    mockGetDevices.mockResolvedValue([createDevice(0x1234)]);

    await expect(getConnectedLedgerHidDevices()).resolves.toStrictEqual([]);
  });

  it('propagates rejection (the caller decides fail-open)', async () => {
    mockGetDevices.mockRejectedValue(new Error('HID unavailable'));

    await expect(getConnectedLedgerHidDevices()).rejects.toThrow(
      'HID unavailable',
    );
  });
});

describe('getConnectedLedgerDeviceInfo', () => {
  const mockGetDevices = jest.fn();

  const createDevice = (productId = 0x0400): HIDDevice =>
    ({
      vendorId: Number(LEDGER_USB_VENDOR_ID),
      productId,
      productName: 'Ledger Nano X',
    }) as HIDDevice;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(globalThis, 'navigator', {
      value: { hid: { getDevices: mockGetDevices } },
      writable: true,
      configurable: true,
    });
  });

  it('describes each connected Ledger device with an opaque connection id', async () => {
    mockGetDevices.mockResolvedValue([createDevice()]);

    const [info] = await getConnectedLedgerDeviceInfo();

    expect(info).toStrictEqual({
      vendorId: Number(LEDGER_USB_VENDOR_ID),
      productId: 0x0400,
      productName: 'Ledger Nano X',
      connectionId: expect.any(Number),
    });
  });

  it('keeps the connection id stable across queries for one device', async () => {
    const device = createDevice();
    mockGetDevices.mockResolvedValue([device]);

    const [first] = await getConnectedLedgerDeviceInfo();
    const [second] = await getConnectedLedgerDeviceInfo();

    expect(second.connectionId).toBe(first.connectionId);
  });

  it('gives a new id when the device object changes', async () => {
    mockGetDevices.mockResolvedValue([createDevice()]);
    const [before] = await getConnectedLedgerDeviceInfo();

    // A new connection surfaces as a new HIDDevice instance.
    mockGetDevices.mockResolvedValue([createDevice()]);
    const [after] = await getConnectedLedgerDeviceInfo();

    expect(after.connectionId).not.toBe(before.connectionId);
  });

  it('gives distinct ids to devices connected at the same time', async () => {
    mockGetDevices.mockResolvedValue([
      createDevice(0x0400),
      createDevice(0x0001),
    ]);

    const [first, second] = await getConnectedLedgerDeviceInfo();

    expect(first.connectionId).not.toBe(second.connectionId);
  });
});
