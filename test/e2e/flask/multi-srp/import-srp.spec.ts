import * as assert from 'assert';
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { withFixtures, WALLET_PASSWORD as testPassword } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HomePage from '../../page-objects/pages/home/homepage';
import MultichainAccountDetailsPage from '../../page-objects/pages/multichain/multichain-account-details-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import {
  SECOND_TEST_E2E_SRP,
  mockActiveNetworks,
  withMultiSrp,
} from './common-multi-srp';

const TEST_SRP_WORDS_FOR_UI_TEST = [
  'ghost',
  'label',
  'absorb',
  'waste',
  'chief',
  'faculty',
  'truth',
  'crystal',
  'belief',
  'actress',
  'season',
  'square',
];

describe('Multi SRP - Import SRP', function (this: Suite) {
  it('successfully imports a new srp', async function () {
    await withMultiSrp(
      {
        title: this.test?.fullTitle(),
        testSpecificMock: mockActiveNetworks,
      },
      async (driver: Driver) => {
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkAccountBelongsToSrp('Account 2', 2);
      },
    );
  });

  it('successfully imports a new srp and it matches the srp imported', async function () {
    await withMultiSrp(
      {
        title: this.test?.fullTitle(),
        testSpecificMock: mockActiveNetworks,
      },
      async (driver: Driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.openAccountDetailsModal('Account 2');

        const accountDetailsPage = new MultichainAccountDetailsPage(driver);
        await accountDetailsPage.checkPageIsLoaded();
        await accountDetailsPage.clickSecretRecoveryPhraseRow();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.completeRevealSrpQuiz();
        await privacySettings.fillPasswordToRevealSrp(testPassword);
        await privacySettings.checkSrpTextIsDisplayed(SECOND_TEST_E2E_SRP);
      },
    );
  });

  it('should show one word once pasted in textarea', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockActiveNetworks,
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
      },
      async ({ driver }: { driver: Driver; mockServer?: Mockttp }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        await accountListPage.openImportSrpModal();

        const firstSrpInputSelector =
          '[data-testid="srp-input-import__srp-note"]';
        await driver.waitForSelector(firstSrpInputSelector);

        const firstSrpInput = await driver.findElement(firstSrpInputSelector);

        assert.strictEqual(
          await firstSrpInput.getAttribute('type'),
          'textarea',
          'First SRP input type should be password initially',
        );

        await firstSrpInput.sendKeys(TEST_SRP_WORDS_FOR_UI_TEST[0]);
        assert.strictEqual(
          await firstSrpInput.getAttribute('value'),
          TEST_SRP_WORDS_FOR_UI_TEST[0],
          'First SRP input value should match typed word',
        );
      },
    );
  });
});
