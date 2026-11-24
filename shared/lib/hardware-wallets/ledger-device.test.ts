import { getLedgerModelKey } from './ledger-device';

describe('getLedgerModelKey', () => {
  it('normalizes the old productId convention (model only)', () => {
    expect(getLedgerModelKey(0x0001)).toBe('1');
    expect(getLedgerModelKey(0x0004)).toBe('4');
  });

  it('strips the interface index from the new per-interface convention', () => {
    expect(getLedgerModelKey(0x0400)).toBe('4');
    expect(getLedgerModelKey(0x0401)).toBe('4');
  });

  it('collapses both conventions of the same model to one key', () => {
    // A Nano X reports 0x0004 on old firmware and 0x0400/0x0401 (one entry
    // per HID interface) on new firmware; all must bind to the same key.
    expect(getLedgerModelKey(0x0004)).toBe(getLedgerModelKey(0x0400));
    expect(getLedgerModelKey(0x0004)).toBe(getLedgerModelKey(0x0401));
  });

  it('is idempotent', () => {
    expect(
      getLedgerModelKey(getLedgerModelKey(0x0401) as unknown as number),
    ).toBe(getLedgerModelKey(0x0401));
  });
});
