import { withFixtures } from '../../../helpers';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import FixtureBuilder from '../../../fixture-builder';
import Homepage from '../../../page-objects/pages/home/homepage';
import NftListPage from '../../../page-objects/pages/home/nft-list';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';

describe('Import ERC1155 NFT', function () {
  const smartContract = SMART_CONTRACTS.ERC1155;

  it('should be able to import an ERC1155 NFT that user owns', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes, contractRegistry }) => {
        const contractAddress =
          contractRegistry.getContractAddress(smartContract);
        await loginWithBalanceValidation(driver, localNodes[0]);

        // Go to NFTs tab, import a valid ERC1155 token address and token id that belongs to user
        const homepage = new Homepage(driver);
        await homepage.goToNftTab();
        const nftList = new NftListPage(driver);
        await nftList.importNft(contractAddress, '1');

        // Check the ERC1155 token is successfully imported and its image is displayed
        await nftList.checkSuccessImportNftMessageIsDisplayed();
        await nftList.checkNftImageIsDisplayed();
      },
    );
  });

  it('should not be able to import an ERC1155 NFT that does not belong to user', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes, contractRegistry }) => {
        const contractAddress =
          contractRegistry.getContractAddress(smartContract);
        await loginWithBalanceValidation(driver, localNodes[0]);

        // Import a valid ERC1155 token address and a token id that does not belong to user and check error message appears
        await new Homepage(driver).goToNftTab();
        await new NftListPage(driver).importNft(
          contractAddress,
          '4',
          'NFT can’t be added as the ownership details do not match. Make sure you have entered correct information.',
        );
      },
    );
  });
});
