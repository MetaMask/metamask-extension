import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { getCleanAppState, withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { completeImportSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { Driver } from '../../webdriver/driver';
import { MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME } from '../../../../shared/lib/money/feature-flags';

/**
 * The money account address derived from `E2E_SRP` at the fixed money
 * derivation path (`m/44'/4392018'/0'/0`). Mobile derives the same address
 * from the same SRP, so asserting this exact value pins cross-client
 * derivation, not just self-consistency.
 */
const MONEY_ACCOUNT_ADDRESS = '0xd5fe9b0579443e7025cf3309ba420977710e7183';

const HD_KEYRING_TYPE = 'HD Key Tree';
const MONEY_KEYRING_TYPE = 'Money Keyring';

type MoneyAccountRecord = {
  address: string;
  options: { entropy?: { id?: string } };
};

type KeyringRecord = {
  type: string;
  accounts: string[];
  metadata: { id: string };
};

describe('Money account', function (this: Suite) {
  it('is created on vault restore into a fresh profile and stays out of the account list', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
        manifestFlags: {
          remoteFeatureFlags: {
            [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: {
              enabled: true,
              minimumVersion: '0.0.0',
            },
          },
        },
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

        // Account creation runs asynchronously off the unlock event, so poll
        // rather than read once.
        let uiState: {
          metamask: {
            moneyAccounts: Record<string, MoneyAccountRecord>;
            keyrings: KeyringRecord[];
            internalAccounts: {
              accounts: Record<string, { address: string }>;
            };
          };
        };
        await driver.wait(async () => {
          uiState = await getCleanAppState(driver);
          return Object.keys(uiState?.metamask?.moneyAccounts ?? {}).length > 0;
        }, 10000);

        const { moneyAccounts, keyrings, internalAccounts } =
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          uiState!.metamask;

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
});
