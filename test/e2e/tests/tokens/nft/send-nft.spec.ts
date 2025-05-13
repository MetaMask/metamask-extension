import {
  clickNestedButton,
  openActionMenuAndStartSendFlow,
  withFixtures,
} from '../../../helpers';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import FixtureBuilder from '../../../fixture-builder';
import Homepage from '../../../page-objects/pages/home/homepage';
import NftListPage from '../../../page-objects/pages/home/nft-list';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import { Driver } from '../../../webdriver/driver';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import { switchToNetworkFlow } from '../../../page-objects/flows/network.flow';
import { Anvil } from '../../../seeder/anvil';

describe('Send NFTs', function () {
  const smartContract = SMART_CONTRACTS.NFTS;

  it('user should not be able to view ERC721 NFTs in send flow when on wrong network', async function () {
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
        const nftListPage = new NftListPage(driver);

        await new HeaderNavbar(driver).check_currentSelectedNetwork(
          'Localhost 8545',
        );

        await new Homepage(driver).goToNftTab();

        await switchToNetworkFlow(driver, 'Ethereum Mainnet');
        await new HeaderNavbar(driver).check_currentSelectedNetwork(
          'Ethereum Mainnet',
        );

        await openActionMenuAndStartSendFlow(driver);
        await clickNestedButton(driver, 'Account 1');
        await driver.clickElement('[data-testid="asset-picker-button"]');
        await clickNestedButton(driver, 'NFTs');

        await nftListPage.check_noNftInfoIsDisplayed();
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
        const nftListPage = new NftListPage(driver);

        await new HeaderNavbar(driver).check_currentSelectedNetwork(
          'Localhost 8545',
        );

        await new Homepage(driver).goToNftTab();

        await openActionMenuAndStartSendFlow(driver);
        await clickNestedButton(driver, 'Account 1');
        await driver.clickElement('[data-testid="asset-picker-button"]');
        await clickNestedButton(driver, 'NFTs');

        await nftListPage.check_nftNameIsDisplayed('Test Dapp NFTs #1');
      },
    );
  });
});
