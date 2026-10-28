import { test as pwTest } from '@playwright/test';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import { openPrivacySettings } from '../../page-objects/flows/settings.flow';
import { E2E_DRIVER, MOCK_ANALYTICS_ID } from '../../constants';
import { waitForSettingsUpdated } from './helpers';
import { mockBasicFunctionalityTurnedOff } from './mocks/segment';

pwTest.describe('Token detection event', () => {
  pwTest(
    'sends Settings Updated when basic functionality is turned off',
    async () => {
      await withFixtures(
        {
          driverType: E2E_DRIVER.PLAYWRIGHT,
          fixtures: new FixtureBuilderV2()
            .withAnalyticsController({
              analyticsId: MOCK_ANALYTICS_ID,
              consentDecisionMade: true,
              optedIn: true,
            })
            .build(),
          title: pwTest.info().titlePath.join(' '),
          testSpecificMock: mockBasicFunctionalityTurnedOff,
        },
        async ({ driver, mockedEndpoint: mockedEndpoints }) => {
          await login(driver);
          const privacySettings = await openPrivacySettings(driver);

          await privacySettings.toggleBasicFunctionalityOff();
          await waitForSettingsUpdated(driver, mockedEndpoints, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            settings_type: 'basic_functionality',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            old_value: true,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            new_value: false,
            category: 'Settings',
          });
        },
      );
    },
  );
});
