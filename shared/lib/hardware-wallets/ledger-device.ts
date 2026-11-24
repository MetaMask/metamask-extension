/**
 * Normalizes a Ledger WebHID productId into a stable model key.
 *
 * Newer firmware exposes one HID interface per entry with
 * `productId = model << 8 | interfaceIndex`, while older firmware reports
 * the bare model. The low byte is an interface index, not part of the model,
 * so it is stripped — the same rule DMK's `WebHidTransport.getDeviceModel`
 * uses (`usbProductId === productId >> 8`).
 *
 * @param productId - The HID productId of the Ledger device.
 * @returns The normalized model key (e.g. '4' for a Nano X under either
 * convention).
 */
export function getLedgerModelKey(productId: number): string {
  // The shift strips the per-interface index byte (see JSDoc).
  // eslint-disable-next-line no-bitwise
  return productId >= 0x100 ? String(productId >> 8) : String(productId);
}
