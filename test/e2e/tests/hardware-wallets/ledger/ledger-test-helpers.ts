import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../../stub/keyring-bridge';
import { mockEmptyPrices } from '../../tokens/utils/mocks';
import { mockAccountsApiV5ForLedgerAccount } from './ledger-accounts-api';
import { withLedgerUnifiedAssetsBalance } from './ledger-unified-assets-fixture';

export const LEDGER_ADDRESS = KNOWN_PUBLIC_KEY_ADDRESSES[0].address;

export const LEDGER_LOGIN_EXPECTED_BALANCE = '1.21M';

export function buildLedgerFixtures() {
  return withLedgerUnifiedAssetsBalance(
    new FixtureBuilderV2().withLedgerAccount(),
  ).build();
}

export function buildLedgerDappFixtures() {
  return withLedgerUnifiedAssetsBalance(
    new FixtureBuilderV2().withLedgerAccount(),
  )
    .withPermissionControllerConnectedToTestDapp({
      account: LEDGER_ADDRESS,
    })
    .build();
}

export async function mockLedgerHardwareEndpoints(mockServer: Mockttp) {
  return [
    mockAccountsApiV5ForLedgerAccount(mockServer),
    await mockEmptyPrices(mockServer),
  ];
}

export async function seedLedgerAccountBalance(
  localNodes:
    | { setAccountBalance: (address: string, balance: string) => Promise<unknown> }[]
    | undefined,
) {
  (await localNodes?.[0]?.setAccountBalance(
    LEDGER_ADDRESS,
    '0x100000000000000000000',
  )) ?? console.error('localNodes is undefined or empty');
}
