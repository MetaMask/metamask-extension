import { withFixtures, unlockWallet } from '../../helpers';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import FixtureBuilder from '../../fixture-builder';

import AssetListPage from '../../page-objects/pages/home/asset-list';
import HomePage from '../../page-objects/pages/home/homepage';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import TokenOverviewPage from '../../page-objects/pages/token-overview-page';

describe('Send ERC20 token to contract address', function () {
  const smartContract = SMART_CONTRACTS.HST;

  it('should display the token contract warning to the user', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder().build(),
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, contractRegistry }) => {
        const contractAddress: string =
          await contractRegistry.getContractAddress(smartContract);
        await unlockWallet(driver);

        const assetListPage = new AssetListPage(driver);
        await assetListPage.importCustomTokenByChain(
          '0x539',
          '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
        );

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await assetListPage.clickOnAsset('TST');

        // Send TST
        const tokenOverviewPage = new TokenOverviewPage(driver);
        await tokenOverviewPage.checkPageIsLoaded();
        await tokenOverviewPage.clickSend();

        const sendTokenPage = new SendTokenPage(driver);
        await sendTokenPage.checkPageIsLoaded();
        await sendTokenPage.fillRecipient(contractAddress);

        // Verify warning
        const warningText =
          'Warning: you are about to send to a token contract which could result in a loss of funds. Learn more';
        await sendTokenPage.checkWarningMessage(warningText);
      },
    );
  });
});
