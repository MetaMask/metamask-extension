import { strict as assert } from 'assert';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { createDownloadFolder, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixtures/fixture-builder';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AdvancedSettings from '../../page-objects/pages/settings/advanced-settings';
import {
  loginWithBalanceValidation,
  loginWithoutBalanceValidation,
} from '../../page-objects/flows/login.flow';
import { mockPriceApi } from '../tokens/utils/mocks';

import referenceStateLogsDefinition from './state-logs.json';
import {
  compareTypeMaps,
  createTypeMap,
  createTypeMapFromDefinition,
  getDownloadedStateLogs,
  StateLogsTypeDefinition,
  StateLogsTypeMap,
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
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            preferences: {
              showFiatInTestnets: true,
              showNativeTokenAsMainBalance: false,
            },
          })
          .withEnabledNetworks({
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockPriceApi,
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

        // Verify download and get state logs
        const stateLogs = await getDownloadedStateLogs(driver, downloadsFolder);

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
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            preferences: {
              showFiatInTestnets: true,
              showNativeTokenAsMainBalance: false,
            },
          })
          .withTokenBalancesController({
            tokenBalances: {
              '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
                '0x539': {
                  '0x0000000000000000000000000000000000000000':
                    '0x15af1d78b58c40000', // 25 ETH
                },
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockPriceApi,
      },
      async ({ driver }: { driver: Driver }) => {
        await createDownloadFolder(downloadsFolder);
        await loginWithoutBalanceValidation(driver);

        // Add hardcoded delay to stabilize the test and ensure values for properties are loaded
        await driver.delay(15000);

        // Download state logs
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.clickAdvancedTab();
        const advancedSettingsPage = new AdvancedSettings(driver);
        await advancedSettingsPage.checkPageIsLoaded();
        await advancedSettingsPage.downloadStateLogs();

        // Verify download and get state logs
        const stateLogs = await getDownloadedStateLogs(driver, downloadsFolder);

        // Get new account ID for Solana
        const newAccountId = Object.keys(
          stateLogs.metamask.internalAccounts.accounts,
        )[1];

        // Get new sync Queue Entropy
        const syncQueueEntropy = Object.keys(stateLogs.metamask.syncQueue)[1];

        let referenceLogsText = JSON.stringify(referenceStateLogsDefinition);

        // Replace ID in reference logs
        referenceLogsText = referenceLogsText.replaceAll(
          '3c62fe60-6f00-4227-86f4-33d0b1f4c39e',
          newAccountId,
        );
        // Replace Queue Entropy in reference logs
        referenceLogsText = referenceLogsText.replaceAll(
          '01KBPCGKC0N982CH1VYK4WJ5BH',
          syncQueueEntropy,
        );
        const referenceLogs = JSON.parse(referenceLogsText);

        // Create type maps for comparison
        const currentTypeMap = createTypeMap(stateLogs);
        const expectedTypeMap: StateLogsTypeMap = createTypeMapFromDefinition(
          referenceLogs as StateLogsTypeDefinition,
        );

        console.log('📋 Created type maps for comparison');

        const { differences } = compareTypeMaps(
          currentTypeMap,
          expectedTypeMap,
        );

        if (differences.length > 0) {
          const downloadedStateLogsPath = `${downloadsFolder}/MetaMask state logs.json`;

          console.log('\n📊 State logs structure comparison results:');
          console.log(`Found ${differences.length} differences:`);
          console.log('='.repeat(60));

          differences.forEach((diff, index) => {
            console.log(`${index + 1}. ${diff}`);
          });

          console.log('='.repeat(60));
          console.log(
            `📝 Please update the type map in state-logs.json using the downloaded logs at ${downloadedStateLogsPath}`,
          );

          assert.fail(
            `State logs structure has changed. Found ${differences.length} differences:\n${differences.join('\n')}\n\nPlease update the type map in state-logs.json using the downloaded logs at: ${downloadedStateLogsPath}`,
          );
        }

        console.log('✅ State logs structure validation passed!');
      },
    );
  });
});
