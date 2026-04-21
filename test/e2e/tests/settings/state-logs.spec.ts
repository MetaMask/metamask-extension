import { strict as assert } from 'assert';
import { join } from 'path';
import { Mockttp } from 'mockttp';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { createDownloadFolder, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import { login } from '../../page-objects/flows/login.flow';
import { mockPriceApi } from '../tokens/utils/mocks';

import referenceStateLogsDefinition from './state-logs.json';
import {
  compareTypeMaps,
  createTypeMap,
  createTypeMapFromDefinition,
  getDownloadedStateLogs,
  MinimalStateLogsJson,
  StateLogsTypeDefinition,
  StateLogsTypeMap,
} from './state-logs-helpers';

const downloadsFolder = join(process.cwd(), 'test-artifacts', 'downloads');

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

async function mockDummyFeatureFlags(server: Mockttp) {
  await server
    .forGet(FEATURE_FLAGS_URL)
    .withQuery({
      client: 'extension',
      distribution: 'main',
      environment: 'dev',
    })
    .thenCallback(() => ({
      statusCode: 200,
      json: [
        { feature1: true },
        { feature2: false },
        {
          feature3: [
            {
              value: 'valueA',
              name: 'groupA',
              scope: { type: 'threshold', value: 0.3 },
            },
            {
              value: 'valueB',
              name: 'groupB',
              scope: { type: 'threshold', value: 0.5 },
            },
            {
              scope: { type: 'threshold', value: 1 },
              value: 'valueC',
              name: 'groupC',
            },
          ],
        },
      ],
    }));
}

async function mockStateLogsMocks(server: Mockttp) {
  await mockDummyFeatureFlags(server);
  await mockPriceApi(server);
}

async function replacePlaceholderInReferenceLogs(
  stateLogs: MinimalStateLogsJson,
): Promise<StateLogsTypeDefinition> {
  // We'll use this mapping to replace placeholders in the reference logs with actual account IDs
  // from the downloaded logs (e.g "<bitcoin-account-1>" -> "75ad4470-156b-4f7f-b0a5-ffe6cd114ac9").
  const accountsMapping: Record<'solana' | 'bitcoin' | 'tron', string[]> = {
    tron: [],
    solana: [],
    bitcoin: [],
  };

  for (const [id, account] of Object.entries(
    stateLogs.metamask.internalAccounts.accounts,
  )) {
    if (account.type.startsWith('bip122')) {
      accountsMapping.bitcoin.push(id);
    } else if (account.type.startsWith('solana')) {
      accountsMapping.solana.push(id);
    } else if (account.type.startsWith('tron')) {
      accountsMapping.tron.push(id);
    }
  }

  let referenceLogsText = JSON.stringify(referenceStateLogsDefinition);
  for (const [network, ids] of Object.entries(accountsMapping)) {
    for (const [index, id] of ids.entries()) {
      const placeholder = `<${network}-account-${index + 1}>`;
      referenceLogsText = referenceLogsText.replaceAll(
        // Use regex to replace all occurrences of the placeholder, not only the first one.
        new RegExp(placeholder, 'gu'),
        id,
      );
    }
  }

  return JSON.parse(referenceLogsText);
}

describe('State logs', function () {
  it('should download state logs for the account', async function () {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      // Chrome shows OS level download prompt which can't be dismissed by Selenium
      this.skip();
    }
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
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
        testSpecificMock: mockStateLogsMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        await createDownloadFolder(downloadsFolder);
        await login(driver);

        // Download state logs
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToPrivacySettings();
        const privacySettingsPage = new PrivacySettings(driver);
        await privacySettingsPage.checkPageIsLoaded();
        await privacySettingsPage.downloadStateLogs();

        // Verify download and get state logs
        const stateLogs = await getDownloadedStateLogs(driver, downloadsFolder);

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
        fixtures: new FixtureBuilderV2()
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
        testSpecificMock: mockStateLogsMocks,
      },
      async ({ driver }: { driver: Driver }) => {
        await createDownloadFolder(downloadsFolder);
        await login(driver, { validateBalance: false });

        // Add hardcoded delay to stabilize the test and ensure values for properties are loaded
        await driver.delay(15000);

        // Download state logs
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToPrivacySettings();
        const privacySettingsPage = new PrivacySettings(driver);
        await privacySettingsPage.checkPageIsLoaded();
        await privacySettingsPage.downloadStateLogs();

        // Verify download and get state logs
        const stateLogs = await getDownloadedStateLogs(driver, downloadsFolder);

        // We need to replace placeholders in the reference logs with actual account IDs from the downloaded
        // logs before comparing them.
        const referenceLogs =
          await replacePlaceholderInReferenceLogs(stateLogs);

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
