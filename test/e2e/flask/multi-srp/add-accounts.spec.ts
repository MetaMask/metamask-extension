import { Suite } from 'mocha';
import { DEFAULT_FIXTURE_ACCOUNT_ID } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { importAdditionalSecretRecoveryPhrase } from '../../page-objects/flows/multi-srp.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HomePage from '../../page-objects/pages/home/homepage';
import { Driver } from '../../webdriver/driver';
import {
  MAINNET_NATIVE_ASSET_ID,
  LOCALHOST_NATIVE_ASSET_ID,
} from '../../tests/tokens/utils/mocks';
import { mockActiveNetworks } from './common-multi-srp';

const ZERO_UNIFIED_EVM_BALANCES = {
  mainnetNativeEthHuman: '0',
  localhostNativeEthHuman: '0',
  nativeBalance: '0',
} as const;

function buildAddAccountsFixture() {
  return new FixtureBuilderV2()
    .withAssetsController(
      {
        assetsBalance: {
          [DEFAULT_FIXTURE_ACCOUNT_ID]: {
            [MAINNET_NATIVE_ASSET_ID]: { amount: '0' },
            [LOCALHOST_NATIVE_ASSET_ID]: { amount: '0' },
          },
        },
      },
      { overwrite: true },
    )
    .build();
}

const addAccountToSrp = async (driver: Driver, srpIndex: number) => {
  // Dismiss any lingering toast so it cannot overlay the add-account button.
  await new HomePage(driver).dismissSrpAddedToast();

  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.openAccountMenu();

  const accountListPage = new AccountListPage(driver);
  await accountListPage.checkPageIsLoaded();

  // This will create 'Account 2'.
  await accountListPage.addMultichainAccount({
    srpIndex,
  });

  await accountListPage.closeMultichainAccountsPage();
  await accountListPage.checkAccountBelongsToSrp('Account 2', srpIndex + 1);
};

describe('Multi SRP - Add accounts', function (this: Suite) {
  it('adds a new account for the default srp', async function () {
    await withFixtures(
      {
        fixtures: buildAddAccountsFixture(),
        unifiedEvmAccountsApiBalances: ZERO_UNIFIED_EVM_BALANCES,
        title: this.test?.fullTitle(),
        testSpecificMock: mockActiveNetworks,
      },
      async ({ driver }) => {
        await login(driver, { expectedBalance: '0' });
        await importAdditionalSecretRecoveryPhrase(driver);
        await addAccountToSrp(driver, 0);
      },
    );
  });

  it('adds a new account for the new srp', async function () {
    await withFixtures(
      {
        fixtures: buildAddAccountsFixture(),
        unifiedEvmAccountsApiBalances: ZERO_UNIFIED_EVM_BALANCES,
        title: this.test?.fullTitle(),
        testSpecificMock: mockActiveNetworks,
      },
      async ({ driver }) => {
        await login(driver, { expectedBalance: '0' });
        await importAdditionalSecretRecoveryPhrase(driver);
        await addAccountToSrp(driver, 1);
      },
    );
  });
});
