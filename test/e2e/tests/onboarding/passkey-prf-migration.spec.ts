import { Browser } from 'selenium-webdriver';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/home/homepage';
import PasskeyPrfMigrationPage from '../../page-objects/pages/onboarding/passkey-prf-migration-page';
import SetupPasskeyPage from '../../page-objects/pages/onboarding/setup-passkey-page';
import { getLegacyUserHandlePasskeyRecord } from '../../webdriver/virtual-authenticator';
import {
  openLegacyPasskeyMigration,
  replaceLegacyPasskey,
  replaceLegacyPasskeyWithNonPrfAuthenticator,
} from '../../page-objects/flows/passkey-migration.flow';

describe('Passkey PRF migration', function () {
  beforeEach(function () {
    // Firefox does not support Selenium's Virtual Authenticator API.
    if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
      this.skip();
    }
  });

  it('keeps the current passkey when the user chooses remind me later', async function () {
    const passkeyRecord = await getLegacyUserHandlePasskeyRecord();

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withPasskeyController({ passkeyRecord })
          .build(),
        title: this.test?.fullTitle(),
        virtualAuthenticator: true,
      },
      async ({
        driver,
        extensionId,
      }: {
        driver: Driver;
        extensionId: string;
      }) => {
        await openLegacyPasskeyMigration(driver, extensionId);

        const passkeyPrfMigrationPage = new PasskeyPrfMigrationPage(driver);
        await passkeyPrfMigrationPage.clickRemindMeLater();

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
      },
    );
  });

  it('replaces a legacy passkey with a PRF passkey', async function () {
    const passkeyRecord = await getLegacyUserHandlePasskeyRecord();

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withPasskeyController({ passkeyRecord })
          .build(),
        title: this.test?.fullTitle(),
        virtualAuthenticator: true,
      },
      async ({
        driver,
        extensionId,
      }: {
        driver: Driver;
        extensionId: string;
      }) => {
        await openLegacyPasskeyMigration(driver, extensionId);
        await replaceLegacyPasskey(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
      },
    );
  });

  it('keeps the current passkey when the new authenticator cannot provide PRF', async function () {
    const passkeyRecord = await getLegacyUserHandlePasskeyRecord();

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withPasskeyController({ passkeyRecord })
          .build(),
        manifestFlags: {
          testing: { mockPasskeyPrfEnabled: false },
        },
        title: this.test?.fullTitle(),
        virtualAuthenticator: true,
      },
      async ({
        driver,
        extensionId,
      }: {
        driver: Driver;
        extensionId: string;
      }) => {
        await openLegacyPasskeyMigration(driver, extensionId);
        await replaceLegacyPasskeyWithNonPrfAuthenticator(driver, extensionId);

        const setupPasskeyPage = new SetupPasskeyPage(driver);
        await setupPasskeyPage.clickKeepCurrentPasskey();

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
      },
    );
  });
});
