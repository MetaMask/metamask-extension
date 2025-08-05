import * as assert from 'assert';
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures, WALLET_PASSWORD as testPassword } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HomePage from '../../page-objects/pages/home/homepage';
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
        await accountListPage.check_accountBelongsToSrp('Account 2', 2);
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
        await accountListPage.check_pageIsLoaded();
        await accountListPage.startExportSrpForAccount('Account 2');

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.completeRevealSrpQuiz();
        await privacySettings.fillPasswordToRevealSrp(testPassword);
        await privacySettings.check_srpTextIsDisplayed(SECOND_TEST_E2E_SRP);
      },
    );
  });

  it('should show/hide SRP words when toggled and only show one at a time', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockActiveNetworks,
        title: this.test?.fullTitle(),
        dapp: true,
      },
      async ({ driver }: { driver: Driver; mockServer?: Mockttp }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();

        await accountListPage.openImportSrpModal();

        const firstSrpInputSelector = '#import-srp__multi-srp__srp-word-0';
        await driver.waitForSelector(firstSrpInputSelector);

        const firstSrpToggleSelector =
          'label[for="import-srp__multi-srp__srp-word-0-checkbox"]';
        const secondSrpInputSelector = '#import-srp__multi-srp__srp-word-1';
        const secondSrpToggleSelector =
          'label[for="import-srp__multi-srp__srp-word-1-checkbox"]';

        const firstSrpInput = await driver.findElement(firstSrpInputSelector);
        const secondSrpInput = await driver.findElement(secondSrpInputSelector);

        await driver.waitForSelector(firstSrpToggleSelector, {
          state: 'enabled',
        });

        assert.strictEqual(
          await firstSrpInput.getAttribute('type'),
          'password',
          'First SRP input type should be password initially',
        );
        assert.strictEqual(
          await secondSrpInput.getAttribute('type'),
          'password',
          'Second SRP input type should be password initially',
        );

        await driver.clickElement(firstSrpToggleSelector);

        assert.strictEqual(
          await firstSrpInput.getAttribute('type'),
          'text',
          'First SRP input type should be text after toggle',
        );
        assert.strictEqual(
          await secondSrpInput.getAttribute('type'),
          'password',
          'Second SRP input type should remain password',
        );

        await firstSrpInput.sendKeys(TEST_SRP_WORDS_FOR_UI_TEST[0]);
        assert.strictEqual(
          await firstSrpInput.getAttribute('value'),
          TEST_SRP_WORDS_FOR_UI_TEST[0],
          'First SRP input value should match typed word',
        );

        await driver.waitForSelector(secondSrpToggleSelector, {
          state: 'enabled',
        });
        await driver.clickElement(secondSrpToggleSelector);

        assert.strictEqual(
          await firstSrpInput.getAttribute('type'),
          'password',
          'First SRP input type should revert to password',
        );
        assert.strictEqual(
          await secondSrpInput.getAttribute('type'),
          'text',
          'Second SRP input type should be text after its toggle',
        );

        await driver.waitForSelector(firstSrpToggleSelector, {
          state: 'enabled',
        });
        await driver.clickElement(firstSrpToggleSelector);
        assert.strictEqual(
          await firstSrpInput.getAttribute('type'),
          'text',
          'First SRP input type should be text again',
        );
        assert.strictEqual(
          await secondSrpInput.getAttribute('type'),
          'password',
          'Second SRP input type should revert to password when other is shown',
        );
      },
    );
  });
});
