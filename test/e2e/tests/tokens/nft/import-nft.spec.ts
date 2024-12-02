import { defaultGanacheOptions, withFixtures } from '../../../helpers';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import FixtureBuilder from '../../../fixture-builder';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import Homepage from '../../../page-objects/pages/homepage';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';

describe('Import NFT', function () {
  const smartContract = SMART_CONTRACTS.NFTS;

  it('should be able to import an NFT that user owns', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, ganacheServer, contractRegistry }) => {
        const contractAddress =
          contractRegistry.getContractAddress(smartContract);
        await loginWithBalanceValidation(driver, ganacheServer);

        const homepage = new Homepage(driver);
        await homepage.goToNftTab();
        await homepage.importNft(contractAddress, '1');
        await homepage.check_successImportNftMessageIsDisplayed();

        await homepage.check_nftNameIsDisplayed('TestDappNFTs');
        await homepage.check_nftImageIsDisplayed();
      },
    );
  });

  it('should continue to display an imported NFT after importing, adding a new account, and switching back', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, ganacheServer, contractRegistry }) => {
        const contractAddress =
          contractRegistry.getContractAddress(smartContract);
        await loginWithBalanceValidation(driver, ganacheServer);

        // Import a NFT and check that it is displayed in the NFT tab on homepage
        const homepage = new Homepage(driver);
        await homepage.goToNftTab();
        await homepage.importNft(contractAddress, '1');
        await homepage.check_successImportNftMessageIsDisplayed();
        await homepage.check_nftNameIsDisplayed('TestDappNFTs');
        await homepage.check_nftImageIsDisplayed();

        // Create new account with default name Account 2
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.addNewAccount();
        await headerNavbar.check_accountLabel('Account 2');
        await homepage.check_expectedBalanceIsDisplayed();

        // Switch back to Account 1 and check that the NFT is still displayed
        await headerNavbar.openAccountMenu();
        await accountListPage.check_pageIsLoaded();
        await accountListPage.check_accountDisplayedInAccountList('Account 1');
        await accountListPage.switchToAccount('Account 1');
        await headerNavbar.check_accountLabel('Account 1');
        await homepage.check_localBlockchainBalanceIsDisplayed(ganacheServer);
        await homepage.check_nftNameIsDisplayed('TestDappNFTs');
        await homepage.check_nftImageIsDisplayed();
      },
    );
  });

  it('should not be able to import an NFT that does not belong to user', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, ganacheServer, contractRegistry }) => {
        const contractAddress =
          contractRegistry.getContractAddress(smartContract);
        await loginWithBalanceValidation(driver, ganacheServer);

        const homepage = new Homepage(driver);
        await homepage.goToNftTab();
        await homepage.importNft(
          contractAddress,
          '2',
          'NFT can’t be added as the ownership details do not match. Make sure you have entered correct information.',
        );
      },
    );
  });
});
