import type { RawHardwareAccount } from '../../../../ui/pages/create-account/connect-hardware/types';

/** Five raw hardware accounts returned by a full connectHardware page fetch. */
export const MOCK_RAW_HARDWARE_ACCOUNTS: RawHardwareAccount[] = [
  { address: '0xAddress1', index: 0 },
  { address: '0xAddress2', index: 1 },
  { address: '0xAddress3', index: 2 },
  { address: '0xAddress4', index: 3 },
  { address: '0xAddress5', index: 4 },
];

/**
 * Creates raw hardware account fixtures for connect-hardware tests.
 *
 * @param count - Number of accounts to create.
 * @param startIndex - Hardware account index for the first fixture.
 */
export function createMockRawHardwareAccounts(
  count: number,
  startIndex = 0,
): RawHardwareAccount[] {
  return Array.from({ length: count }, (_, offset) => {
    const index = startIndex + offset;
    return {
      address: `0xAddress${index + 1}`,
      index,
    };
  });
}
