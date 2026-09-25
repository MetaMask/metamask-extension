import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import LoginPage from '../../page-objects/pages/onboarding/login-page';
import HomePage from '../../page-objects/pages/home/homepage';
import RampsBuyDeepLinkPage from '../../page-objects/pages/ramps/ramps-buy-deeplink-page';
import RampsTokenSelectionPage from '../../page-objects/pages/ramps/ramps-token-selection-page';
import { navigateDeepLinkToDestination } from '../../page-objects/flows/deep-link.flow';
import {
  bytesToB64,
  generateECDSAKeyPair,
  getConfig,
  mockRampsCatalog,
  prepareDeepLinkUrl,
  shouldRenderCheckbox,
} from './helpers';

const RAMPS_FEATURE_FLAGS = {
  remoteFeatureFlags: {
    rampsEnabled: true,
  },
};

describe('Deep Link - /buy Route (unified buy)', function () {
  // With the `rampsEnabled` flag on, `/buy` deep links must route into the
  // in-app unified buy flow instead of the external Portfolio redirect. With
  // a token intent the flow pre-selects it and lands on build-quote; without
  // one it opens token selection.
  const buyScenarios = [
    {
      route:
        '/buy?address=0x6b175474e89094c44da98b954eedeac495271d0f&chainId=1',
      DestinationPage: RampsBuyDeepLinkPage,
    },
    {
      route: '/buy',
      DestinationPage: RampsTokenSelectionPage,
    },
  ] as const;

  const scenarios = buyScenarios.flatMap(({ route, DestinationPage }) =>
    (['signed with sig_params', 'unsigned'] as const).map((signed) => ({
      signed,
      route,
      DestinationPage,
    })),
  );

  for (const { signed, route, DestinationPage } of scenarios) {
    it(`routes ${signed} ${route} deep link into the in-app buy flow`, async function () {
      const keyPair = await generateECDSAKeyPair();
      const deepLinkPublicKey = bytesToB64(
        await crypto.subtle.exportKey('raw', keyPair.publicKey),
      );

      await withFixtures(
        await getConfig({
          title: this.test?.fullTitle(),
          deepLinkPublicKey,
          manifestFlags: RAMPS_FEATURE_FLAGS,
          additionalMocks: mockRampsCatalog,
        }),
        async ({ driver }: { driver: Driver }) => {
          await driver.navigate();
          const loginPage = new LoginPage(driver);
          await loginPage.checkPageIsLoaded();
          await loginPage.loginToHomepage();
          await new HomePage(driver).checkPageIsLoaded();

          const preparedUrl = await prepareDeepLinkUrl({
            route,
            signed,
            privateKey: keyPair.privateKey,
          });

          await navigateDeepLinkToDestination(
            driver,
            preparedUrl,
            'unlocked',
            shouldRenderCheckbox(signed),
            DestinationPage,
          );
        },
      );
    });
  }
});
