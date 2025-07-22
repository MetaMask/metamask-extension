import { Suite } from 'mocha';
import { toHex } from '@metamask/controller-utils';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import NetworkManager, {
  NetworkId,
} from '../../page-objects/pages/network-manager';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import HomePage from '../../page-objects/pages/home/homepage';
import NftListPage from '../../page-objects/pages/home/nft-list';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import ActivityListPage from '../../page-objects/pages/home/activity-list';

describe('Network Manager', function (this: Suite) {
  it('should reflect the enabled networks state in the network manager', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.checkNetworkIsSelected(NetworkId.ETHEREUM);
        await networkManager.checkNetworkIsDeselected(NetworkId.LINEA);
      },
    );
  });

  it('should reflect the enabled networks state in the network manager, when multiple networks are enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({ eip155: { '0x1': true, '0xe708': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.checkNetworkIsSelected(NetworkId.ETHEREUM);
        await networkManager.checkNetworkIsSelected(NetworkId.LINEA);
      },
    );
  });

  it('should select and deselect multiple default networks', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();

        // Assert - initial Network Manager State (eth selected, linea deselected)
        await networkManager.checkNetworkIsSelected(NetworkId.ETHEREUM);
        await networkManager.checkNetworkIsDeselected(NetworkId.LINEA);

        // Act Assert - Both eth and linea selected
        await networkManager.selectNetwork(NetworkId.LINEA);
        await networkManager.checkNetworkIsSelected(NetworkId.LINEA);
        await networkManager.checkNetworkIsSelected(NetworkId.ETHEREUM);

        // Act Assert - eth deselected, linea selected
        await networkManager.deselectNetwork(NetworkId.ETHEREUM);
        await networkManager.checkNetworkIsSelected(NetworkId.LINEA);
        await networkManager.checkNetworkIsDeselected(NetworkId.ETHEREUM);
      },
    );
  });

  it('should default to custom tab when custom network is enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.checkTabIsSelected('Custom');
      },
    );
  });

  it('should default to default tab when default network is enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.checkTabIsSelected('Default');
      },
    );
  });

  it('should filter tokens by enabled networks', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({ eip155: { '0x1': true, '0xe708': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);
        const networkManager = new NetworkManager(driver);

        await assetListPage.check_tokenItemNumber(2);

        await networkManager.openNetworkManager();
        await networkManager.checkTabIsSelected('Default');
        await networkManager.deselectNetwork(NetworkId.LINEA);

        await assetListPage.check_tokenItemNumber(1);

        await networkManager.selectNetwork('eip155:8453');

        await assetListPage.check_tokenItemNumber(2);

        await networkManager.selectNetwork(NetworkId.LINEA);

        await assetListPage.check_tokenItemNumber(3);
      },
    );
  });

  it('should automatically select the first network when the network is added', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withEnabledNetworks({ eip155: { '0x1': true, '0xe708': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const networkManager = new NetworkManager(driver);

        await networkManager.openNetworkManager();
        await networkManager.checkTabIsSelected('Default');

        // add arbitrum one network
        await networkManager.addNetwork();
        await networkManager.approveAddNetwork();

        // check if arbitrum is selected
        await networkManager.openNetworkManager();
        await networkManager.checkNetworkIsSelected(NetworkId.ARBITRUM);
      },
    );
  });

  it('should disable all popular networks when the user enables a custom network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withEnabledNetworks({ eip155: { '0x1': true, '0xe708': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.checkNetworkIsSelected(NetworkId.ETHEREUM);
        await networkManager.checkNetworkIsDeselected(NetworkId.LINEA);
      },
    );
  });

  it('should remove enabled network from the network manager', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withEnabledNetworks({ eip155: { '0x1': true, '0xe708': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.checkNetworkIsSelected(NetworkId.LINEA);

        const selectNetwork = new SelectNetwork(driver);
        await selectNetwork.openNetworkListOptions(NetworkId.LINEA);
        await selectNetwork.deleteNetwork(NetworkId.LINEA);

        await selectNetwork.check_networkOptionIsDisplayed(
          NetworkId.LINEA,
          false,
        );
      },
    );
  });

  it('should filter NFTs by enabled networks', async function () {
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
        smartContract: SMART_CONTRACTS.NFTS,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();

        await networkManager.checkNetworkIsSelected(NetworkId.ETHEREUM);
        await networkManager.checkNetworkIsSelected(NetworkId.LINEA);

        await networkManager.closeNetworkManager();

        // Click to open the NFT details page and check title
        const homePage = new HomePage(driver);
        await homePage.goToNftTab();

        const nftListPage = new NftListPage(driver);
        await nftListPage.check_numberOfNftsDisplayed(3);

        // deselect linea
        await networkManager.openNetworkManager();
        await networkManager.deselectNetwork(NetworkId.LINEA);
        await networkManager.closeNetworkManager();

        // check the number of nfts displayed
        await nftListPage.check_numberOfNftsDisplayed(2);
      },
    );
  });

  it('should filter transactions by enabled networks', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTransactionController({
            transactions: {
              '8a13fd36-fdad-48ae-8b6a-c8991026d550': {
                blockNumber: '1',
                chainId: CHAIN_IDS.MAINNET,
                hash: '0xf1af8286e4fa47578c2aec5f08c108290643df978ebc766d72d88476eee90bab',
                id: '8a13fd36-fdad-48ae-8b6a-c8991026d550',
                status: 'confirmed',
                time: 1671635520000,
                txParams: {
                  from: '0xc87261ba337be737fa744f50e7aaf4a920bdfcd6',
                  gas: '0x5208',
                  gasPrice: '0x329af9707',
                  to: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                  value: '0xDE0B6B3A7640000',
                },
                type: 'incoming',
              },
              '8a13fd36-fdad-48ae-8b6a-c8991026d551': {
                blockNumber: '1',
                chainId: CHAIN_IDS.LINEA_MAINNET,
                hash: '0xf1af8286e4fa47578c2aec5f08c108290643df978ebc766d72d88476eee90bab',
                id: '8a13fd36-fdad-48ae-8b6a-c8991026d551',
                status: 'confirmed',
                time: 1671635520000,
                txParams: {
                  from: '0xc87261ba337be737fa744f50e7aaf4a920bdfcd6',
                  gas: '0x5208',
                  gasPrice: '0x329af9707',
                  to: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                  value: '0xDE0B6B3A7640000',
                },
                type: 'incoming',
              },
            },
          })
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
              '0xe708': true,
            },
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        // Click to open the Activity List and check title
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();

        const activityListPage = new ActivityListPage(driver);
        await activityListPage.check_confirmedTxNumberDisplayedInActivity(2);

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.deselectNetwork(NetworkId.LINEA);
        await networkManager.closeNetworkManager();

        await activityListPage.check_confirmedTxNumberDisplayedInActivity(1);
      },
    );
  });

  it('should have at least 1 enabled network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.checkNetworkIsSelected(NetworkId.ETHEREUM);

        await networkManager.deselectNetworkWithoutChecking(NetworkId.ETHEREUM);

        await networkManager.checkNetworkIsSelected(NetworkId.ETHEREUM);
      },
    );
  });
});
