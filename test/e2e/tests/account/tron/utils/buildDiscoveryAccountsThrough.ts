import { EXPECTED_TRON_ADDRESSES_BY_INDEX } from '../../../../constants';
import { TRX } from '../../../tron/fixtures/tokens';
import { SUN_PER_TRX, TRX_TO_USD_RATE } from '../../../tron/mocks/common-tron';
import { createDiscoveryTronTransaction } from './createDiscoveryTronTransaction';

/**
 * Builds seeded Tron accounts for indexes 0..total-1, each holding TRX and a
 * discovery transaction, so the wallet discovers them automatically.
 *
 * @param total - The number of accounts to seed (indexes 0..total-1).
 * @returns The seeded Tron account fixtures.
 */
export function buildDiscoveryAccountsThrough(total: number) {
  return EXPECTED_TRON_ADDRESSES_BY_INDEX.slice(0, total).map((address) => ({
    address,
    assets: [{ ...TRX, balance: SUN_PER_TRX, priceUsd: TRX_TO_USD_RATE }],
    transactions: {
      raw: [createDiscoveryTronTransaction(address)],
      trc20: [],
    },
  }));
}
