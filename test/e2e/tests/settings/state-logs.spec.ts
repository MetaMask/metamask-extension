import { strict as assert } from 'assert';
import { createDownloadFolder, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AdvancedSettings from '../../page-objects/pages/settings/advanced-settings';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import referenceStateLogs from './state-logs.json';
import {
  colorize,
  compareTypeMaps,
  createTypeMap,
  getStateLogsJson,
  type MinimalStateLogsJson,
} from './state-logs-helpers';

const downloadsFolder = `${process.cwd()}/test-artifacts/downloads`;

describe('State logs', function () {
  it('should download state logs for the account', async function () {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      // Chrome shows OS level download prompt which can't be dismissed by Selenium
      this.skip();
    }
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await createDownloadFolder(downloadsFolder);
        await loginWithBalanceValidation(driver);

        // Download state logs
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.clickAdvancedTab();
        const advancedSettingsPage = new AdvancedSettings(driver);
        await advancedSettingsPage.checkPageIsLoaded();
        await advancedSettingsPage.downloadStateLogs();

        // Verify download
        let info: MinimalStateLogsJson | null = null;
        await driver.wait(async () => {
          info = await getStateLogsJson(downloadsFolder);
          return info !== null;
        }, 10000);
        // Verify Json
        if (info === null) {
          throw new Error('State logs not found');
        }
        const stateLogs: MinimalStateLogsJson = info;
        assert.equal(
          stateLogs.metamask.identities[
            '0x5cfe73b6021e818b776b421b1c4db2474086a7e1'
          ].address,
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        );
        assert.equal(
          stateLogs.metamask.internalAccounts.accounts[
            stateLogs.metamask.internalAccounts.selectedAccount
          ].address,
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        );
      },
    );
  });

  it('state log file matches the expected state structure', async function () {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      // Chrome shows OS level download prompt which can't be dismissed by Selenium
      this.skip();
    }
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await createDownloadFolder(downloadsFolder);
        await loginWithBalanceValidation(driver);

        // Download state logs
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.clickAdvancedTab();
        const advancedSettingsPage = new AdvancedSettings(driver);
        await advancedSettingsPage.checkPageIsLoaded();
        await advancedSettingsPage.downloadStateLogs();

        // Verify download
        let currentStateLogs: MinimalStateLogsJson | null = null;
        await driver.wait(async () => {
          currentStateLogs = await getStateLogsJson(downloadsFolder);
          return currentStateLogs !== null;
        }, 10000);

        if (currentStateLogs === null) {
          throw new Error(colorize('❌ State logs not found', 'red'));
        }

        console.log(colorize('✅ State logs downloaded successfully', 'green'));

        // Create type maps for comparison
        const currentTypeMap = createTypeMap(currentStateLogs);
        const expectedTypeMap = createTypeMap(referenceStateLogs);

        console.log(colorize('📋 Created type maps for comparison', 'cyan'));

        // Compare type maps
        const { colored, clean } = compareTypeMaps(
          currentTypeMap,
          expectedTypeMap,
        );

        if (colored.length > 0) {
          // The state logs are already downloaded to the downloads folder
          const downloadedStateLogsPath = `${downloadsFolder}/MetaMask state logs.json`;

          console.log(
            colorize(`\n📊 State logs structure comparison results:`, 'bright'),
          );
          console.log(
            colorize(`Found ${colored.length} differences:`, 'yellow'),
          );
          console.log(colorize('='.repeat(60), 'cyan'));

          colored.forEach((diff, index) => {
            console.log(`${colorize(`${index + 1}.`, 'blue')} ${diff}`);
          });

          console.log(colorize('='.repeat(60), 'cyan'));
          console.log(
            colorize(
              `📝 Please update the state-logs.json file. You can copy it from ${downloadedStateLogsPath}`,
              'yellow',
            ),
          );

          assert.fail(
            `State logs structure has changed. Found ${colored.length} differences:\n${clean.join('\n')}\n\nPlease update the state-logs.json file with the new structure from: ${downloadedStateLogsPath}`,
          );
        }

        console.log(
          colorize('✅ State logs structure validation passed!', 'green'),
        );
      },
    );
  });
});
