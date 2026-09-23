import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import LoginPage from '../../page-objects/pages/onboarding/login-page';
import HomePage from '../../page-objects/pages/home/homepage';
import RampsBuyDeepLinkPage from '../../page-objects/pages/ramps/ramps-buy-deeplink-page';
import { navigateDeepLinkToDestination } from '../../page-objects/flows/deep-link.flow';
import {
  bytesToB64,
  generateECDSAKeyPair,
  getConfig,
  mockRampsEmptyCatalog,
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
  // in-app unified buy flow instead of the external Portfolio redirect.
  const buyRoutes = [
    '/buy?address=0x6b175474e89094c44da98b954eedeac495271d0f&chainId=1',
    '/buy',
  ];

  const scenarios = buyRoutes.flatMap((route) =>
    (['signed with sig_params', 'unsigned'] as const).map((signed) => ({
      signed,
      route,
    })),
  );

  for (const { signed, route } of scenarios) {
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
          additionalMocks: mockRampsEmptyCatalog,
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
            RampsBuyDeepLinkPage,
          );
        },
      );
    });
  }
});
