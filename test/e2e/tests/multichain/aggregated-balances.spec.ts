import { Suite } from 'mocha';
import { MockttpServer } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import { closeSettings } from '../../page-objects/flows/settings.flow';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { Anvil } from '../../seeder/anvil';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { DEFAULT_FIXTURE_ACCOUNT_ID } from '../../constants';
import {
  getMockAssetsPrice,
  mockPriceApi,
  mockSpotPrices,
  MOCK_ETH_CONVERSION_RATE,
} from '../tokens/utils/mocks';

const EXPECTED_BALANCE_USD = '$85,025.00';
const NETWORK_NAME_MAINNET = 'Ethereum';
const NETWORK_NAME_SEPOLIA = 'Sepolia';

const SEPOLIA_NATIVE_ASSET_ID = 'eip155:11155111/slip44:60';

const SEPOLIA_NATIVE_ASSET_INFO = {
  aggregators: [],
  decimals: 18,
  image:
    'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/11155111/slip44/60.png',
  name: 'Sepolia Ether',
  symbol: 'SepoliaETH',
  type: 'native' as const,
};

describe('Multichain Aggregated Balances', function (this: Suite) {
  it('shows correct aggregated balance when "Current Network" is selected', async function () {
    const smartContract = SMART_CONTRACTS.NFTS;
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            preferences: {
              showTestNetworks: true,
              showNativeTokenAsMainBalance: true,
            },
          })
          .withEnabledNetworks({
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
            },
          })
          .withAssetsController({
            assetsBalance: {
              [DEFAULT_FIXTURE_ACCOUNT_ID]: {
                [SEPOLIA_NATIVE_ASSET_ID]: { amount: '25' },
              },
            },
            assetsInfo: {
              [SEPOLIA_NATIVE_ASSET_ID]: SEPOLIA_NATIVE_ASSET_INFO,
            },
            assetsPrice: {
              ...getMockAssetsPrice(MOCK_ETH_CONVERSION_RATE),
              [SEPOLIA_NATIVE_ASSET_ID]: getMockAssetsPrice(
                MOCK_ETH_CONVERSION_RATE,
              )['eip155:1/slip44:60'],
            },
          })
          .build(),
        localNodeOptions: {
          hardfork: 'muirGlacier',
        },
        smartContract,
        ethConversionInUsd: MOCK_ETH_CONVERSION_RATE, // 25 ETH × $3401 = $85,025.00
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockPriceApi(mockServer);
          await mockSpotPrices(mockServer, {
            [SEPOLIA_NATIVE_ASSET_ID]: {
              price: MOCK_ETH_CONVERSION_RATE,
              marketCap: 112500000,
              pricePercentChange1d: 0,
            },
          });
        },
      },
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes: Anvil[] | undefined[];
      }) => {
        await login(driver, { localNode: localNodes[0] });

        const homepage = new HomePage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const settingsPage = new SettingsPage(driver);
        const accountListPage = new AccountListPage(driver);

        await switchToNetworkFromNetworkSelect(
          driver,
          'Popular',
          NETWORK_NAME_MAINNET,
        );

        await headerNavbar.openSettingsPage();
        await settingsPage.toggleBalanceSetting();
        await closeSettings(driver);

        await homepage.checkExpectedBalanceIsDisplayed(
          EXPECTED_BALANCE_USD,
          'usd',
        );
        await headerNavbar.openAccountMenu();
        await accountListPage.checkMultichainAccountBalanceDisplayed({
          balance: EXPECTED_BALANCE_USD,
        });
        await accountListPage.closeMultichainAccountsPage();

        await switchToNetworkFromNetworkSelect(
          driver,
          'Custom',
          NETWORK_NAME_SEPOLIA,
        );

        await headerNavbar.openSettingsPage();
        await settingsPage.goToDeveloperOptions();
        await settingsPage.toggleShowFiatOnTestnets();
        await closeSettings(driver);

        await homepage.checkExpectedBalanceIsDisplayed(
          EXPECTED_BALANCE_USD,
          'usd',
        );
      },
    );
  });
});
