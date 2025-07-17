import { withFixtures } from '../../../helpers';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import FixtureBuilder from '../../../fixture-builder';
import { Driver } from '../../../webdriver/driver';
import { switchToNetworkFromSendFlow } from '../../../page-objects/flows/network.flow';
import { Anvil } from '../../../seeder/anvil';

import AssetPicker from '../../../page-objects/pages/asset-picker';
import Homepage from '../../../page-objects/pages/home/homepage';
import NftListPage from '../../../page-objects/pages/home/nft-list';
import SendTokenPage from '../../../page-objects/pages/send/send-token-page';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';

describe('Send NFTs', function () {
  const smartContract = SMART_CONTRACTS.NFTS;

  it('user should not be able to view ERC721 NFTs in send flow when on wrong network', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            preferences: {
              showTestNetworks: true,
            },
          })
          .withNftControllerERC721()
          .build(),
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes: Anvil[];
      }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);
        const homepage = new Homepage(driver);

        await new Homepage(driver).goToNftTab();
        await switchToNetworkFromSendFlow(driver, 'Ethereum');

        await homepage.startSendFlow();

        const sendToPage = new SendTokenPage(driver);
        await sendToPage.check_pageIsLoaded();
        await sendToPage.selectRecipientAccount('Account 1');
        await sendToPage.clickAssetPickerButton();
        const assetPicker = new AssetPicker(driver);
        await assetPicker.openNftAssetPicker();
        await assetPicker.checkNoNftInfoIsDisplayed();
      },
    );
  });

  it('user should only be able to view ERC721 NFTs on send flow that belong on selected network', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withNftControllerERC721().build(),
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes: Anvil[];
      }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);
        const homepage = new Homepage(driver);
        await homepage.goToNftTab();
        const nftListPage = new NftListPage(driver);
        await nftListPage.check_pageIsLoaded();
        await homepage.startSendFlow();

        const sendToPage = new SendTokenPage(driver);
        await sendToPage.check_pageIsLoaded();
        await sendToPage.selectRecipientAccount('Account 1');
        await sendToPage.clickAssetPickerButton();
        const assetPicker = new AssetPicker(driver);
        await assetPicker.openNftAssetPicker();
        await assetPicker.checkNftNameIsDisplayed('Test Dapp NFTs #1');
      },
    );
  });
});
