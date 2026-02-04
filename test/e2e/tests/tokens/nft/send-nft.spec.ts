import { withFixtures } from '../../../helpers';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { Driver } from '../../../webdriver/driver';
import { Anvil } from '../../../seeder/anvil';

import Homepage from '../../../page-objects/pages/home/homepage';
import NftListPage from '../../../page-objects/pages/home/nft-list';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import SendPage from '../../../page-objects/pages/send/send-page';

describe('Send NFTs', function () {
  const smartContract = SMART_CONTRACTS.NFTS;

  it('user should only be able to view ERC721 NFTs on send flow that belong on selected network', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
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
        await nftListPage.checkPageIsLoaded();
        await homepage.startSendFlow();

        const sendPage = new SendPage(driver);
        await sendPage.checkPageIsLoaded();
        await sendPage.selectNft('Test Dapp NFTs #1');
        await sendPage.fillRecipient(
          '0x1234567890123456789012345678901234567890',
        );
      },
    );
  });
});
