import { withFixtures } from '../../../helpers';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import FixtureBuilder from '../../../fixture-builder';
import Homepage from '../../../page-objects/pages/home/homepage';
import NFTDetailsPage from '../../../page-objects/pages/nft-details-page';
import NftListPage from '../../../page-objects/pages/home/nft-list';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import { Driver } from '../../../webdriver/driver';
import { Anvil } from '../../../seeder/anvil';

describe('View NFT details', function () {
  const smartContract = SMART_CONTRACTS.NFTS;

  it('user should be able to view ERC721 NFT details', async function () {
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

        // Click to open the NFT details page and check title
        await new Homepage(driver).goToNftTab();
        const nftListPage = new NftListPage(driver);
        await nftListPage.clickNFTIconOnActivityList();

        // Check the NFT details are correctly displayed on NFT details page
        const nftDetailsPage = new NFTDetailsPage(driver);
        await nftDetailsPage.check_pageIsLoaded();
        await nftDetailsPage.check_nftNameIsDisplayed('Test Dapp NFTs #1');
        await nftDetailsPage.check_nftDescriptionIsDisplayed(
          'Test Dapp NFTs for testing.',
        );
        await nftDetailsPage.check_nftImageContainerIsDisplayed();
        await nftDetailsPage.check_nftDetailsAddressIsDisplayed(
          '0x581c3...45947',
        );
      },
    );
  });
});
