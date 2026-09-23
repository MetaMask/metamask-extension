import { test as pwTest } from '@playwright/test';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import { openAssetsSettings } from '../../page-objects/flows/settings.flow';
import { E2E_DRIVER, MOCK_ANALYTICS_ID } from '../../constants';
import { waitForExpectedTraits } from './helpers';
import { mockSegmentIdentify } from './mocks/segment';

pwTest.describe('Nft detection event', () => {
  pwTest(
    'sends identify trait when NFT autodetection is toggled in Assets settings',
    async () => {
      await withFixtures(
        {
          driverType: E2E_DRIVER.PLAYWRIGHT,
          fixtures: new FixtureBuilderV2()
            .withBasicFunctionalityConsolidationDisabled()
            .withMetaMetricsController({
              analyticsId: MOCK_ANALYTICS_ID,
              consentDecisionMade: true,
              optedIn: true,
            })
            .withPreferencesController({
              useNftDetection: true,
            })
            .build(),
          title: pwTest.info().titlePath.join(' '),
          testSpecificMock: mockSegmentIdentify,
        },
        async ({ driver, mockedEndpoint: mockedEndpoints }) => {
          await login(driver);
          const assetsSettings = await openAssetsSettings(driver);

          await assetsSettings.toggleAutodetectNfts();
          await waitForExpectedTraits(driver, mockedEndpoints, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            nft_autodetection_enabled: false,
          });

          await assetsSettings.toggleAutodetectNfts();
          await waitForExpectedTraits(driver, mockedEndpoints, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            nft_autodetection_enabled: true,
          });
        },
      );
    },
  );
});
