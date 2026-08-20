import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import LoginPage from '../../page-objects/pages/login-page';
import HomePage from '../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { importPrivateKeyAccount } from '../../page-objects/flows/add-account.flow';
import { navigateDeepLinkToDestination } from '../../page-objects/flows/deep-link.flow';
import {
  bytesToB64,
  generateECDSAKeyPair,
  getConfig,
  prepareDeepLinkUrl,
  shouldRenderCheckbox,
} from './helpers';

const IMPORTED_ACCOUNT_NAME = 'Imported Account 1';
const TEST_PRIVATE_KEY =
  '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6';

const SOLANA_USDC_ASSET_ID =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const ASSET_DEEP_LINK_ROUTE = `/asset?assetId=${SOLANA_USDC_ASSET_ID}`;

/**
 * Ensures Solana token metadata resolves so the asset page can evaluate the
 * selected-account check (instead of redirecting solely due to missing metadata).
 *
 * @param server
 */
async function mockSolanaAssetMetadata(server: Mockttp): Promise<void> {
  await server
    .forGet('https://tokens.api.cx.metamask.io/v3/assets')
    .withQuery({ assetIds: SOLANA_USDC_ASSET_ID })
    .always()
    .thenJson(200, [
      {
        assetId: SOLANA_USDC_ASSET_ID,
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
      },
    ]);
}

describe('Deep Link - /asset Route', function () {
  it('redirects to home when a Solana asset deeplink opens with an EVM-only account selected', async function () {
    const keyPair = await generateECDSAKeyPair();
    const deepLinkPublicKey = bytesToB64(
      await crypto.subtle.exportKey('raw', keyPair.publicKey),
    );

    await withFixtures(
      await getConfig({
        title: this.test?.fullTitle(),
        deepLinkPublicKey,
        additionalMocks: mockSolanaAssetMetadata,
      }),
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        // Imported private-key accounts are EVM-only (no Solana account in the group).
        await importPrivateKeyAccount(driver, TEST_PRIVATE_KEY);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.checkAccountLabel(IMPORTED_ACCOUNT_NAME);

        const preparedUrl = await prepareDeepLinkUrl({
          route: ASSET_DEEP_LINK_ROUTE,
          signed: 'unsigned',
        });

        await navigateDeepLinkToDestination(
          driver,
          preparedUrl,
          'unlocked',
          shouldRenderCheckbox('unsigned'),
          HomePage,
        );

        await headerNavbar.checkAccountLabel(IMPORTED_ACCOUNT_NAME);
        await driver.wait(async () => {
          const currentUrl = await driver.getCurrentUrl();
          return !currentUrl.includes('/asset/');
        }, 10000);
      },
    );
  });
});
