import type { Mockttp } from 'mockttp';
import { MONEY_ACCOUNT_ADDRESS } from './constants';
import { getMoneyAccountDepositConfig } from './helpers';

/**
 * Vault withdrawable balance, matching the mobile Money Account withdraw
 * specs ($500, so 25% is $125 and Max is $500). Raw mUSD base units (6dp).
 */
export const WITHDRAWABLE_MUSD_BASE_UNITS = '500000000';
export const WITHDRAWABLE_USD = 500;

const POSITIONS_URL =
  /https:\/\/money\.api\.cx\.metamask\.io\/v1\/positions\/0x[0-9a-f]+$/iu;

/**
 * Serves the Money API positions response the withdrawable balance is read
 * from. The whole balance sits in the vault (`vmusd_value_in_musd`); the
 * loose mUSD balance is zero, and the two must sum to `total_balance`.
 *
 * @param server - Mockttp server.
 */
async function mockMoneyAccountPositions(server: Mockttp): Promise<void> {
  const funded = WITHDRAWABLE_MUSD_BASE_UNITS;
  // The Money API speaks snake_case; the names are the response contract.
  /* eslint-disable @typescript-eslint/naming-convention */
  const body = {
    address: MONEY_ACCOUNT_ADDRESS,
    as_of_block: 1234568,
    as_of_timestamp: new Date().toISOString(),
    data_freshness: 'live',
    indexer_lag_seconds: 0,
    balance: {
      musd_balance: '0',
      vmusd_value_in_musd: funded,
      total_balance: funded,
    },
    positions: [
      {
        vault_address: '0xb4563bcD3B7764CCBf497f515585f70B6C3EA5Ae',
        shares_held: funded,
        current_rate: '1000000000000000000',
        current_value_assets: funded,
        current_value_usd: String(WITHDRAWABLE_USD),
        cost_basis_assets: funded,
        cost_basis_usd: String(WITHDRAWABLE_USD),
        realized_interest_usd: '0',
        unrealised_interest_usd: '0',
        lifetime_interest_usd: '0',
        current_apy: '0.05',
        effective_apy: '0.05',
      },
    ],
  };
  /* eslint-enable @typescript-eslint/naming-convention */

  await server.forGet(POSITIONS_URL).always().thenJson(200, body);
}

/**
 * `withFixtures` options for the Money Account withdraw specs.
 *
 * Builds on the deposit fixture (Anvil Mainnet, Money flags, Relay / Monad /
 * tx-sentinel mocks) and adds the vault balance the withdraw amount is taken
 * from, plus post-quote enabled so the receive token can be chosen.
 *
 * @param options - Config options.
 * @param options.title - Test title for debugging.
 * @returns Partial `withFixtures` config.
 */
export function getMoneyAccountWithdrawConfig({ title }: { title?: string }) {
  const base = getMoneyAccountDepositConfig({
    title,
    remoteFlagOverrides: {
      // RPC reads the vault on Monad and returns 0 here, which would hide the
      // mocked positions balance. API-only keeps the amount buttons on the
      // $500 vault balance from the positions mock.
      moneyAccountBalanceSource: 'api-only',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      confirmations_pay_post_quote: {
        default: {
          enabled: true,
          tokens: {
            '0x1': [
              '0x0000000000000000000000000000000000000000',
              '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            ],
          },
        },
      },
    },
  });

  return {
    ...base,
    testSpecificMock: async (server: Mockttp) => {
      await mockMoneyAccountPositions(server);
      await base.testSpecificMock(server);
    },
  };
}
