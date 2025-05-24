import { TestSnaps } from '../page-objects/pages/test-snaps';
import { Driver } from '../webdriver/driver';
import { withFixtures } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { mockPreferencesSnap } from '../mock-response-data/snaps/snap-binary-mocks';

describe('Test Snap get preferences', function () {
  it('validate the results', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            preferences: {
              privacyMode: true,
              showTestNetworks: true,
            },
          })
          .build(),
        testSpecificMock: mockPreferencesSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        // Navigate to test snaps page, connect get preferences, complete installation and validate
        const testSnaps = new TestSnaps(driver);
        await openTestSnapClickButtonAndInstall(
          driver,
          'getPreferencesConnectButton',
        );
        await testSnaps.check_installationComplete(
          'getPreferencesConnectButton',
          'Reconnect to Preferences Snap',
        );

        // Click submit button, delayed needed processing and validate the results
        await testSnaps.scrollAndClickButton('getPreferencesSubmitButton');
        await driver.delay(1000);
        await testSnaps.check_preferencesResult({
          locale: 'en',
          currency: 'usd',
          hideBalances: true,
          useSecurityAlerts: true,
          useExternalPricingData: true,
          simulateOnChainActions: true,
          useTokenDetection: true,
          batchCheckBalances: true,
          displayNftMedia: false,
          useNftDetection: false,
          showTestnets: true,
        });
      },
    );
  });
});
