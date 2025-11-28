import { strict as assert } from 'assert';
import { MockttpServer } from 'mockttp';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { createDownloadFolder, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixtures/fixture-builder';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AdvancedSettings from '../../page-objects/pages/settings/advanced-settings';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { mockSpotPrices } from '../tokens/utils/mocks';

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
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockServer
            .forGet('https://price.api.cx.metamask.io/v1/exchange-rates')
            .withQuery({ baseCurrency: 'usd' })
            .thenCallback(() => ({
              statusCode: 200,
              json: {
                eth: {
                  name: 'Ethereum',
                  ticker: 'eth',
                  value: 1,
                  currencyType: 'fiat',
                },
              },
            }));
          await mockSpotPrices(mockServer, CHAIN_IDS.MAINNET, {
            '0x0000000000000000000000000000000000000000': {
              price: 3401,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
          });
        },
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
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockSpotPrices(mockServer, CHAIN_IDS.MAINNET, {
            '0x0000000000000000000000000000000000000000': {
              price: 3401,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
          });
          await mockServer
            .forGet('https://price.api.cx.metamask.io/v1/exchange-rates')
            .withQuery({ baseCurrency: 'usd' })
            .thenCallback(() => ({
              statusCode: 200,
              json: {
                eth: {
                  name: 'Ethereum',
                  ticker: 'eth',
                  value: 1,
                  currencyType: 'fiat',
                  usd: 1,
                },
              },
            }));
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await createDownloadFolder(downloadsFolder);
        await loginWithBalanceValidation(driver);

        await driver.delay(10000);

        // Download state logs
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.clickAdvancedTab();
        const advancedSettingsPage = new AdvancedSettings(driver);
        await advancedSettingsPage.checkPageIsLoaded();
        // Add hardcoded delay to stabilize the test and ensure values for properties are loaded
        await driver.delay(15000);
        await advancedSettingsPage.downloadStateLogs();

        // Verify download and get state logs
        const stateLogs = await getDownloadedStateLogs(driver, downloadsFolder);

        // Create type maps for comparison
        const currentTypeMap = createTypeMap(stateLogs);
        const expectedTypeMap: StateLogsTypeMap = createTypeMapFromDefinition(
          referenceStateLogsDefinition as StateLogsTypeDefinition,
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
