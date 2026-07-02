import type { RawHardwareAccount } from '../../../../ui/pages/create-account/connect-hardware/types';
import {
  KNOWN_PUBLIC_KEY_ADDRESSES,
  KNOWN_QR_ACCOUNTS,
} from '../../../stub/keyring-bridge';

/** Real Ethereum addresses reused from hardware wallet and send test fixtures. */
const MOCK_HARDWARE_WALLET_ADDRESSES = [
  ...KNOWN_PUBLIC_KEY_ADDRESSES.map(({ address }) => address),
  ...KNOWN_QR_ACCOUNTS.map(({ address }) => address),
  '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
  '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
] as const;

/** Five raw hardware accounts returned by a full connectHardware page fetch. */
export const MOCK_RAW_HARDWARE_ACCOUNTS: RawHardwareAccount[] =
  MOCK_HARDWARE_WALLET_ADDRESSES.slice(0, 5).map((address, index) => ({
    address,
    index,
  }));

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
    const address = MOCK_HARDWARE_WALLET_ADDRESSES[index];

    if (!address) {
      throw new Error(
        `Not enough mock hardware wallet addresses for index ${index}`,
      );
    }

    return {
      address,
      index,
    };
  });
}
