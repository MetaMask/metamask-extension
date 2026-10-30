import { test as pwTest } from '@playwright/test';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { completeCreateNewWalletOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { login } from '../../page-objects/flows/login.flow';
import { openPrivacySettings } from '../../page-objects/flows/settings.flow';
import { E2E_DRIVER, MOCK_ANALYTICS_ID } from '../../constants';
import { waitForExpectedTraits, waitForSettingsUpdated } from './helpers';
import {
  mockBasicFunctionalityTurnedOff,
  mockSegmentIdentify,
} from './mocks/segment';

pwTest.describe('Nft detection event', () => {
  pwTest(
    'sends identify trait with nft_autodetection_enabled during onboarding',
    async () => {
      await withFixtures(
        {
          driverType: E2E_DRIVER.PLAYWRIGHT,
          fixtures: new FixtureBuilderV2({ onboarding: true })
            .withAnalyticsController({
              analyticsId: MOCK_ANALYTICS_ID,
            })
            .build(),
          title: pwTest.info().titlePath.join(' '),
          testSpecificMock: mockSegmentIdentify,
        },
        async ({ driver, mockedEndpoint: mockedEndpoints }) => {
          await completeCreateNewWalletOnboardingFlow({
            driver,
            consentDecisionMade: true,
            optedIn: true,
          });

          await waitForExpectedTraits(driver, mockedEndpoints, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            nft_autodetection_enabled: true,
          });
        },
      );
    },
  );

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
