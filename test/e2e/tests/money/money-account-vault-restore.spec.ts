import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import type { Mockttp } from 'mockttp';
import { Browser } from 'selenium-webdriver';
import { getCleanAppState, withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { getProductionRemoteFlagApiResponse } from '../../feature-flags';
import { completeImportSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import {
  lockAndWaitForLoginPage,
  login,
} from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/accounts/list-page';
import LoginPage from '../../page-objects/pages/login-page';
import ResetPasswordPage from '../../page-objects/pages/reset-password-page';
import SetupPasskeyPage from '../../page-objects/pages/onboarding/setup-passkey-page';
import { Driver } from '../../webdriver/driver';
import { TEST_SEED_PHRASE } from '../../constants';
import { MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME } from '../../../../shared/lib/money/feature-flags';

/**
 * The money account address derived from `E2E_SRP` at the fixed money
 * derivation path (`m/44'/4392018'/0'/0`). Mobile derives the same address
 * from the same SRP, so asserting this exact value pins cross-client
 * derivation, not just self-consistency.
 */
const MONEY_ACCOUNT_ADDRESS = '0xd5fe9b0579443e7025cf3309ba420977710e7183';

/**
 * The money account address derived from `TEST_SEED_PHRASE` at the money
 * derivation path, used as the "different SRP" in the restore-over-existing
 * test so the replacement is observable as a changed address.
 */
const RESTORED_MONEY_ACCOUNT_ADDRESS =
  '0x192588eb047d4a2421ac43fa920bd9fc206b9b82';

const HD_KEYRING_TYPE = 'HD Key Tree';
const MONEY_KEYRING_TYPE = 'Money Keyring';

const MONEY_ACCOUNT_FLAG_VALUE = { enabled: true, minimumVersion: '0.0.0' };

/**
 * Serves the production remote flags plus the money-account flag from the
 * mock server. Seeding `RemoteFeatureFlagController` state alone is not
 * enough: the background controller refetches /v1/flags on load and would
 * overwrite the seeded flag with the mocked production defaults, which do
 * not include it — leaving the money account never created.
 *
 * @param server - The Mockttp server instance to register the mock on.
 */
async function mockMoneyAccountFlag(server: Mockttp): Promise<void> {
  await server
    .forGet('https://client-config.api.cx.metamask.io/v1/flags')
    .withQuery({ client: 'extension', distribution: 'main' })
    .thenCallback(() => ({
      ok: true,
      statusCode: 200,
      json: [
        ...getProductionRemoteFlagApiResponse(),
        { [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: MONEY_ACCOUNT_FLAG_VALUE },
      ],
    }));
}

type MoneyAccountRecord = {
  address: string;
  options: { entropy?: { id?: string } };
};

type KeyringRecord = {
  type: string;
  accounts: string[];
  metadata: { id: string };
};

type MoneyUiState = {
  metamask: {
    moneyAccounts: Record<string, MoneyAccountRecord>;
    keyrings: KeyringRecord[];
    internalAccounts: {
      accounts: Record<string, { address: string }>;
    };
  };
};

/**
 * Poll the background state until the money accounts satisfy `predicate`.
 * Account creation runs asynchronously off the unlock event, so a single read
 * would race it.
 *
 * @param driver - The webdriver instance.
 * @param predicate - Condition on the current list of money accounts.
 * @returns The background state from the read that satisfied the predicate.
 */
async function waitForMoneyAccounts(
  driver: Driver,
  predicate: (moneyAccounts: MoneyAccountRecord[]) => boolean,
): Promise<MoneyUiState['metamask']> {
  let uiState: MoneyUiState | undefined;
  await driver.wait(async () => {
    uiState = await getCleanAppState(driver);
    return predicate(Object.values(uiState?.metamask?.moneyAccounts ?? {}));
  }, 10000);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return uiState!.metamask;
}

describe('Money account', function (this: Suite) {
  it('is created on vault restore into a fresh profile and stays out of the account list', async function () {
    await withFixtures(
      {
        // `MoneyAccountControllerInit`'s enablement check reads
        // `RemoteFeatureFlagController` state directly (background code does
        // not honour manifest overrides), so the flag must be seeded there
        // rather than via `manifestFlags`. The mock below keeps the flag set
        // after the controller's own /v1/flags refetch replaces this state.
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withRemoteFeatureFlagController({
            remoteFeatureFlags: {
              [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: MONEY_ACCOUNT_FLAG_VALUE,
            },
          })
          .build(),
        testSpecificMock: mockMoneyAccountFlag,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // A fresh profile plus an SRP import is the vault-restore path: the
        // restored HD keyring gets a new metadata id, so a money account can
        // only appear if `MoneyAccountController.init()` genuinely creates one
        // for this keyring rather than finding a pre-existing record.
        await completeImportSRPOnboardingFlow({ driver });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const { moneyAccounts, keyrings, internalAccounts } =
          await waitForMoneyAccounts(driver, (accounts) => accounts.length > 0);

        const moneyAccountList = Object.values(moneyAccounts);
        assert.equal(
          moneyAccountList.length,
          1,
          `Expected exactly one money account, got ${moneyAccountList.length}`,
        );
        const [moneyAccount] = moneyAccountList;

        assert.equal(
          moneyAccount.address.toLowerCase(),
          MONEY_ACCOUNT_ADDRESS,
          'The money account address must match the cross-client derivation vector for E2E_SRP',
        );

        // The account must be recorded against the entropy source of the HD
        // keyring created by *this* restore — the same single-snapshot check
        // `selectPrimaryMoneyAccount` performs. If these ids diverge, the UI
        // cannot see a money account that exists in the vault.
        const hdKeyring = keyrings.find(
          (keyring) => keyring.type === HD_KEYRING_TYPE,
        );
        assert(hdKeyring, 'Expected an HD keyring after the SRP import');
        assert.equal(
          moneyAccount.options.entropy?.id,
          hdKeyring.metadata.id,
          'The money account entropy source must be the restored HD keyring',
        );

        // The keyring must genuinely be in the vault — without it the account
        // could not sign, and the deposit flow would fail only at signing time.
        const moneyKeyring = keyrings.find(
          (keyring) => keyring.type === MONEY_KEYRING_TYPE,
        );
        assert(moneyKeyring, 'Expected a Money keyring in the vault');
        assert.deepEqual(
          moneyKeyring.accounts.map((address) => address.toLowerCase()),
          [MONEY_ACCOUNT_ADDRESS],
          'The Money keyring must hold exactly the derived money account',
        );

        // The money account is internal plumbing: `accounts-controller`
        // excludes money keyrings from its sync paths, so the address must not
        // surface as an internal (listable, selectable) account.
        const internalAddresses = Object.values(internalAccounts.accounts).map(
          (account) => account.address.toLowerCase(),
        );
        assert(
          !internalAddresses.includes(MONEY_ACCOUNT_ADDRESS),
          'The money account must not appear among internal accounts',
        );

        // And the account list UI shows only the restored account.
        await new HeaderNavbar(driver).openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.checkAccountDisplayedInAccountList('Account 1');
        await accountListPage.checkNumberOfAvailableAccounts(1);
      },
    );
  });

  it('replaces stale money accounts when restoring a different SRP over an existing wallet', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withRemoteFeatureFlagController({
            remoteFeatureFlags: {
              [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: MONEY_ACCOUNT_FLAG_VALUE,
            },
          })
          .build(),
        testSpecificMock: mockMoneyAccountFlag,
        // Locking the wallet mid-test can cut off in-flight requests; these
        // are the same benign errors the forgot-password suite ignores.
        ignoredConsoleErrors: [
          'The snap "npm:@metamask/message-signing-snap" has been terminated during execution',
          'npm:@metamask/message-signing-snap was stopped and the request was cancelled. This is likely because the Snap crashed.',
          'Legacy syncing failed for wallet',
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        // The fixture wallet holds `E2E_SRP`, so unlocking creates its money
        // account — the record that must become stale after the restore.
        const { moneyAccounts: originalMoneyAccounts } =
          await waitForMoneyAccounts(driver, (accounts) => accounts.length > 0);
        const [originalMoneyAccount] = Object.values(originalMoneyAccounts);
        assert.equal(
          originalMoneyAccount.address.toLowerCase(),
          MONEY_ACCOUNT_ADDRESS,
        );

        // Restore a different SRP over the wallet via the forgot-password
        // flow. This replaces every keyring, orphaning the recorded money
        // account's entropy source.
        await lockAndWaitForLoginPage(driver);
        await new LoginPage(driver).gotoResetPasswordPage();

        const resetPasswordPage = new ResetPasswordPage(driver);
        await resetPasswordPage.checkPageIsLoaded();
        await resetPasswordPage.resetPassword(
          TEST_SEED_PHRASE,
          'this is the best password ever',
        );
        await resetPasswordPage.waitForPasswordInputToNotBeVisible();

        // Chrome offers passkey setup after the restore; Firefox does not
        // support the flow and skips straight to home.
        if (process.env.SELENIUM_BROWSER !== Browser.FIREFOX) {
          const setupPasskeyPage = new SetupPasskeyPage(driver);
          await setupPasskeyPage.checkPageIsLoaded();
          await setupPasskeyPage.skipPasskeySetup();
        }
        await new HomePage(driver).headerNavbar.checkPageIsLoaded();

        // The stale account must be replaced — not merely joined — by one for
        // the restored seed, so wait for the map to contain exactly the new
        // address and nothing else.
        const { moneyAccounts, keyrings } = await waitForMoneyAccounts(
          driver,
          (accounts) =>
            accounts.length === 1 &&
            accounts[0].address.toLowerCase() ===
              RESTORED_MONEY_ACCOUNT_ADDRESS,
        );

        // The surviving record must belong to the HD keyring created by this
        // restore, not to the pre-restore wallet.
        const [moneyAccount] = Object.values(moneyAccounts);
        const hdKeyring = keyrings.find(
          (keyring) => keyring.type === HD_KEYRING_TYPE,
        );
        assert(hdKeyring, 'Expected an HD keyring after the restore');
        assert.equal(
          moneyAccount.options.entropy?.id,
          hdKeyring.metadata.id,
          'The money account entropy source must be the restored HD keyring',
        );

        // The vault keyring must hold only the new derivation: the old money
        // address belongs to a seed this wallet no longer controls.
        const moneyKeyrings = keyrings.filter(
          (keyring) => keyring.type === MONEY_KEYRING_TYPE,
        );
        assert.deepEqual(
          moneyKeyrings.flatMap((keyring) =>
            keyring.accounts.map((address) => address.toLowerCase()),
          ),
          [RESTORED_MONEY_ACCOUNT_ADDRESS],
          'The Money keyring must hold exactly the restored money account',
        );
      },
    );
  });
});
