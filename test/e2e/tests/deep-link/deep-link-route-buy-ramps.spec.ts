import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import LoginPage from '../../page-objects/pages/onboarding/login-page';
import HomePage from '../../page-objects/pages/home/homepage';
import RampsBuildQuotePage from '../../page-objects/pages/ramps/ramps-build-quote-page';
import RampsTokenSelectionPage from '../../page-objects/pages/ramps/ramps-token-selection-page';
import { navigateDeepLinkToDestination } from '../../page-objects/flows/deep-link.flow';
import {
  mockRampsCatalog,
  bytesToB64,
  generateECDSAKeyPair,
  getConfig,
  prepareDeepLinkUrl,
  shouldRenderCheckbox,
} from './helpers';

describe('Deep Link - /buy Route (unified buy)', function () {
  // `/buy` deep links must route into the in-app unified buy flow instead of
  // the external Portfolio redirect. With a token intent the flow pre-selects
  // it and lands on build-quote; without one it opens token selection.
  // Interstitial behavior (signed vs unsigned) is covered by the other
  // deep-link specs, so one case per destination.
  const buyScenarios = [
    {
      route:
        '/buy?address=0x6b175474e89094c44da98b954eedeac495271d0f&chainId=1',
      signed: 'signed with sig_params',
      DestinationPage: RampsBuildQuotePage,
      expectedToken: 'DAI',
    },
    {
      route: '/buy',
      signed: 'unsigned',
      DestinationPage: RampsTokenSelectionPage,
      expectedToken: undefined,
    },
  ] as const;

  for (const {
    signed,
    route,
    DestinationPage,
    expectedToken,
  } of buyScenarios) {
    it(`routes ${signed} ${route} deep link into the in-app buy flow`, async function () {
      const keyPair = await generateECDSAKeyPair();
      const deepLinkPublicKey = bytesToB64(
        await crypto.subtle.exportKey('raw', keyPair.publicKey),
      );

      await withFixtures(
        await getConfig({
          title: this.test?.fullTitle(),
          deepLinkPublicKey,
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

          if (expectedToken) {
            await new RampsBuildQuotePage(driver).checkSelectedToken(
              expectedToken,
            );
          }
        },
      );
    });
  }
});
