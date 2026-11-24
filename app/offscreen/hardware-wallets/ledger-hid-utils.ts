import { LEDGER_USB_VENDOR_ID } from '../../../shared/constants/hardware-wallets';
import type { ConnectedLedgerDeviceInfo } from '../../../shared/constants/offscreen-communication';

const connectionIds = new WeakMap<HIDDevice, number>();
let nextConnectionId = 1;

/**
 * WebHID hands out one `HIDDevice` instance per granted physical device, so
 * instance identity is the only handle on a connection: distinct devices never
 * share an id, and a replug normally surfaces a new instance (hence a new id).
 *
 * @param device - The connected HID device.
 * @returns A stable id for as long as that instance stays connected.
 */
function getConnectionId(device: HIDDevice): number {
  let id = connectionIds.get(device);
  if (id === undefined) {
    id = nextConnectionId;
    nextConnectionId += 1;
    connectionIds.set(device, id);
  }
  return id;
}

/**
 * Returns the currently connected (permitted) Ledger HID devices.
 *
 * Mirrors the UI helper's vendor-only filter
 * (`ui/contexts/hardware-wallets/webConnectionUtils.ts`). `navigator.hid`
 * only reports devices this origin has been granted, so "connected" here
 * means "permitted and present". Counting/dedupe semantics belong to the
 * background gate, not this util.
 *
 * @returns The connected Ledger devices. Propagates rejection — the caller
 * decides fail-open.
 */
export async function getConnectedLedgerHidDevices(): Promise<HIDDevice[]> {
  const devices = await navigator.hid.getDevices();
  return devices.filter(
    (device) => device.vendorId === Number(LEDGER_USB_VENDOR_ID),
  );
}

/**
 * Describes the currently connected (permitted) Ledger devices for the
 * background gate.
 *
 * @returns One descriptor per connected device. Propagates rejection — the
 * caller decides fail-open.
 */
export async function getConnectedLedgerDeviceInfo(): Promise<
  ConnectedLedgerDeviceInfo[]
> {
  const devices = await getConnectedLedgerHidDevices();
  return devices.map((device) => ({
    vendorId: device.vendorId,
    productId: device.productId,
    productName: device.productName,
    connectionId: getConnectionId(device),
  }));
}
