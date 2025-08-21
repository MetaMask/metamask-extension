import { toHex } from '@metamask/controller-utils';
import { withFixtures, unlockWallet } from '../../../helpers';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import FixtureBuilder from '../../../fixture-builder';
import { Driver } from '../../../webdriver/driver';
import Homepage from '../../../page-objects/pages/home/homepage';
import NftListPage from '../../../page-objects/pages/home/nft-list';
import NetworkManager, {
  NetworkId,
} from '../../../page-objects/pages/network-manager';

describe('View NFT details', function () {
  const smartContract = SMART_CONTRACTS.NFTS;

  it('user should be able to view ERC721 NFT details', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNftController({
            allNftContracts: {
              '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
                [toHex(59144)]: [
                  {
                    address: `__FIXTURE_SUBSTITUTION__CONTRACT${SMART_CONTRACTS.NFTS}`,
                    name: 'TestDappNFTs',
                    symbol: 'TDC',
                  },
                ],
                [toHex(1)]: [
                  {
                    address: `__FIXTURE_SUBSTITUTION__CONTRACT${SMART_CONTRACTS.NFTS}`,
                    name: 'TestDappNFTs',
                    symbol: 'TDC',
                  },
                ],
              },
            },
            allNfts: {
              '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
                [toHex(59144)]: [
                  {
                    address: `__FIXTURE_SUBSTITUTION__CONTRACT${SMART_CONTRACTS.NFTS}`,
                    description: 'Test Dapp NFTs for testing.',
                    favorite: false,
                    image:
                      'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjM1MCIgd2lkdGg9IjM1MCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdGggaWQ9Ik15UGF0aCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZWQiIGQ9Ik0xMCw5MCBROTAsOTAgOTAsNDUgUTkwLDEwIDUwLDEwIFExMCwxMCAxMCw0MCBRMTAsNzAgNDUsNzAgUTcwLDcwIDc1LDUwIiAvPjwvZGVmcz48dGV4dD48dGV4dFBhdGggaHJlZj0iI015UGF0aCI+UXVpY2sgYnJvd24gZm94IGp1bXBzIG92ZXIgdGhlIGxhenkgZG9nLjwvdGV4dFBhdGg+PC90ZXh0Pjwvc3ZnPg==',
                    isCurrentlyOwned: true,
                    name: 'Test Dapp NFTs #1',
                    standard: 'ERC721',
                    tokenId: '1',
                    chainId: 59144,
                  },
                ],
                [toHex(1)]: [
                  {
                    address: `__FIXTURE_SUBSTITUTION__CONTRACT${SMART_CONTRACTS.NFTS}`,
                    description: 'Test Dapp NFTs for testing.',
                    favorite: false,
                    image:
                      'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjM1MCIgd2lkdGg9IjM1MCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdGggaWQ9Ik15UGF0aCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZWQiIGQ9Ik0xMCw5MCBROTAsOTAgOTAsNDUgUTkwLDEwIDUwLDEwIFExMCwxMCAxMCw0MCBRMTAsNzAgNDUsNzAgUTcwLDcwIDc1LDUwIiAvPjwvZGVmcz48dGV4dD48dGV4dFBhdGggaHJlZj0iI015UGF0aCI+UXVpY2sgYnJvd24gZm94IGp1bXBzIG92ZXIgdGhlIGxhenkgZG9nLjwvdGV4dFBhdGg+PC90ZXh0Pjwvc3ZnPg==',
                    isCurrentlyOwned: true,
                    name: 'Test Dapp NFTs #1 on mainnet',
                    standard: 'ERC721',
                    tokenId: '1',
                    chainId: 1,
                  },
                  {
                    address: `__FIXTURE_SUBSTITUTION__CONTRACT${SMART_CONTRACTS.NFTS}`,
                    description: 'Test Dapp NFTs for testing.',
                    favorite: false,
                    image:
                      'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjM1MCIgd2lkdGg9IjM1MCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdGggaWQ9Ik15UGF0aCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZWQiIGQ9Ik0xMCw5MCBROTAsOTAgOTAsNDUgUTkwLDEwIDUwLDEwIFExMCwxMCAxMCw0MCBRMTAsNzAgNDUsNzAgUTcwLDcwIDc1LDUwIiAvPjwvZGVmcz48dGV4dD48dGV4dFBhdGggaHJlZj0iI015UGF0aCI+UXVpY2sgYnJvd24gZm94IGp1bXBzIG92ZXIgdGhlIGxhenkgZG9nLjwvdGV4dFBhdGg+PC90ZXh0Pjwvc3ZnPg==',
                    isCurrentlyOwned: true,
                    name: 'Test Dapp NFTs #2 on mainnet',
                    standard: 'ERC721',
                    tokenId: '2',
                    chainId: 1,
                  },
                ],
              },
            },
            ignoredNfts: [],
          })
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
              '0xe708': true,
            },
          })
          .build(),
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        const networkManager = new NetworkManager(driver);

        // Click to open the NFT details page and check title
        const homePage = new Homepage(driver);
        await homePage.goToNftTab();

        // Show Ethereum NFTs
        const nftListPage = new NftListPage(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectNetwork(NetworkId.ETHEREUM);
        await networkManager.closeNetworkManager();
        await nftListPage.checkNumberOfNftsDisplayed(2);

        await nftListPage.checkNftNameIsDisplayed(
          'Test Dapp NFTs #1 on mainnet',
        );
        await nftListPage.checkNftNameIsDisplayed(
          'Test Dapp NFTs #2 on mainnet',
        );

        // Show All NFTs
        await networkManager.openNetworkManager();
        await networkManager.selectAllNetworks();
        await networkManager.closeNetworkManager();

        await nftListPage.checkNumberOfNftsDisplayed(3);

        await nftListPage.checkNftNameIsDisplayed('Test Dapp NFTs #1');

        await nftListPage.checkNftNameIsDisplayed(
          'Test Dapp NFTs #1 on mainnet',
        );
        await nftListPage.checkNftNameIsDisplayed(
          'Test Dapp NFTs #2 on mainnet',
        );
      },
    );
  });
});
