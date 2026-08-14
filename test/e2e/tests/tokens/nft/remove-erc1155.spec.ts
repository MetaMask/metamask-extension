import { MockttpServer } from 'mockttp';
import { toHex } from '@metamask/controller-utils';
import { withFixtures } from '../../../helpers';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import Homepage from '../../../page-objects/pages/home/homepage';
import NFTDetailsPage from '../../../page-objects/pages/nft-details-page';
import NftsTab from '../../../page-objects/pages/home/nfts-tab';
import { login } from '../../../page-objects/flows/login.flow';
import { selectAllNetworksFromNetworkSelect } from '../../../page-objects/flows/network.flow';
import {
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  NETWORK_CLIENT_ID,
} from '../../../constants';
import { CHAIN_IDS } from '../../../../../shared/constants/network';

async function mockIPFSRequest(mockServer: MockttpServer) {
  return [
    await mockServer
      .forGet(
        'https://bafkreifvhjdf6ve4jfv6qytqtux5nd4nwnelioeiqx5x2ez5yrgrzk7ypi.ipfs.dweb.link/',
      )
      .thenCallback(() => ({ statusCode: 200 })),
  ];
}

describe('Remove ERC1155 NFT', function () {
  const smartContract = SMART_CONTRACTS.ERC1155;

  it('user should be able to remove ERC1155 NFT on details page', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2().withNftControllerERC1155().build(),
        smartContract,
        title: this.test?.fullTitle(),
        testSpecificMock: mockIPFSRequest,
      },
      async ({ driver, localNodes }) => {
        await login(driver, { localNode: localNodes[0] });

        // Open the NFT details page and click to remove NFT
        await new Homepage(driver).goToNftTab();
        const nftsTab = new NftsTab(driver);
        await nftsTab.clickNFTIconOnActivityList();

        const nftDetailsPage = new NFTDetailsPage(driver);
        await nftDetailsPage.checkPageIsLoaded();
        await nftDetailsPage.removeNFT();

        // Check the success remove NFT toaster is displayed and the NFT is removed from the NFT tab
        await nftsTab.checkSuccessRemoveNftMessageIsDisplayed();
        await nftsTab.checkNoNftInfoIsDisplayed();
      },
    );
  });

  it('user should be able to remove an ERC1155 NFT while selected network is different than NFT network', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          // ERC1155 NFT lives on Linea; wallet selected network is Mainnet
          .withNftController({
            allNftContracts: {
              [DEFAULT_FIXTURE_ACCOUNT_LOWERCASE]: {
                [toHex(59144)]: [
                  {
                    address: `__FIXTURE_SUBSTITUTION__CONTRACT${SMART_CONTRACTS.ERC1155}`,
                  },
                ],
              },
            },
            allNfts: {
              [DEFAULT_FIXTURE_ACCOUNT_LOWERCASE]: {
                [toHex(59144)]: [
                  {
                    address: `__FIXTURE_SUBSTITUTION__CONTRACT${SMART_CONTRACTS.ERC1155}`,
                    tokenId: '1',
                    favorite: false,
                    isCurrentlyOwned: true,
                    name: 'Rocks',
                    description: 'This is a collection of Rock NFTs.',
                    image:
                      'ipfs://bafkreifvhjdf6ve4jfv6qytqtux5nd4nwnelioeiqx5x2ez5yrgrzk7ypi',
                    standard: 'ERC1155',
                    chainId: 59144,
                  },
                ],
              },
            },
            ignoredNfts: [],
          })
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
              [CHAIN_IDS.LINEA_MAINNET]: true,
            },
          })
          .build(),
        smartContract,
        title: this.test?.fullTitle(),
        testSpecificMock: mockIPFSRequest,
      },
      async ({ driver }) => {
        // Selected network is Mainnet (no local balance to assert)
        await login(driver, { validateBalance: false });

        const homepage = new Homepage(driver);
        await homepage.checkPageIsLoaded();
        await homepage.goToNftTab();

        // Selected network is Mainnet; NFT is on Linea — widen filter to all networks
        await selectAllNetworksFromNetworkSelect(driver);

        const nftsTab = new NftsTab(driver);
        await nftsTab.checkNftNameIsDisplayed('Rocks');
        await nftsTab.checkNftImageIsDisplayed();
        await nftsTab.clickNFTIconOnActivityList();

        const nftDetailsPage = new NFTDetailsPage(driver);
        await nftDetailsPage.checkPageIsLoaded();
        await nftDetailsPage.removeNFT();
        await nftsTab.checkSuccessRemoveNftMessageIsDisplayed();
        await nftsTab.checkNoNftInfoIsDisplayed();
      },
    );
  });
});
