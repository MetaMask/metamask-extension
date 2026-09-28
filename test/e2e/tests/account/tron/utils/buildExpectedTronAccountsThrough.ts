import { EXPECTED_TRON_ADDRESSES_BY_INDEX } from '../../../../constants';

/**
 * Builds `{ accountLabel, expectedAddress }` pairs for HD accounts 1..total, pairing
 * each standard account label with its expected derived Tron address, ready
 * for the generic `assertAccountNetworkAddresses` flow.
 *
 * @param total - The number of accounts (HD indexes 0..total-1).
 */
export function buildExpectedTronAccountsThrough(total: number): {
  accountLabel: string;
  expectedAddress: string;
}[] {
  return EXPECTED_TRON_ADDRESSES_BY_INDEX.slice(0, total).map(
    (expectedAddress, index) => ({
      accountLabel: `Account ${index + 1}`,
      expectedAddress,
    }),
  );
}
