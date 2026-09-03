import { NetworkStatus, RpcEndpointType } from '@metamask/network-controller';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/home/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { Anvil } from '../../seeder/anvil';
import { Driver } from '../../webdriver/driver';

const ARC_CHAIN_ID = '0x13b2';
const ARC_CLIENT_ID = 'arc-local';
const ARC_NODE_PORT = 8546;
const ONE_USDC_WEI = '1000000000000000000';

function arcFixtures() {
  return new FixtureBuilderV2()
    .withNetworkController({
      networkConfigurationsByChainId: {
        [ARC_CHAIN_ID]: {
          blockExplorerUrls: [],
          chainId: ARC_CHAIN_ID,
          defaultRpcEndpointIndex: 0,
          name: 'Arc',
          nativeCurrency: 'USDC',
          rpcEndpoints: [
            {
              networkClientId: ARC_CLIENT_ID,
              type: RpcEndpointType.Custom,
              url: `http://localhost:${ARC_NODE_PORT}`,
            },
          ],
        },
      },
      networksMetadata: {
        [ARC_CLIENT_ID]: { EIPS: {}, status: NetworkStatus.Available },
      },
    })
    .withNetworkEnablementController({
      enabledNetworkMap: { eip155: { [ARC_CHAIN_ID]: true } },
    })
    .build();
}

function arcLocalNodes(arcBalance: number) {
  return [
    { type: 'anvil' },
    {
      type: 'anvil',
      options: { port: ARC_NODE_PORT, chainId: 5042, balance: arcBalance },
    },
  ];
}

describe('Arc usage notice toast', function () {
  it('shows once on home when an account already holds USDC on Arc', async function () {
    await withFixtures(
      {
        fixtures: arcFixtures(),
        localNodeOptions: arcLocalNodes(25),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        const homePage = new HomePage(driver);

        await homePage.checkArcUsageNoticeToastIsDisplayed();
        await homePage.closeArcUsageNoticeToast();

        await driver.navigate();
        await homePage.checkPageIsLoaded();
        await homePage.checkNoArcUsageNoticeToastIsDisplayed();
      },
    );
  });

  it('shows after the Arc balance arrives while the user is away from home', async function () {
    await withFixtures(
      {
        fixtures: arcFixtures(),
        localNodeOptions: arcLocalNodes(0),
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes?: Anvil[];
      }) => {
        await login(driver, { validateBalance: false });
        const homePage = new HomePage(driver);
        await homePage.checkNoArcUsageNoticeToastIsDisplayed();

        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();

        await localNodes?.[1]?.setAccountBalance(
          DEFAULT_FIXTURE_ACCOUNT,
          ONE_USDC_WEI,
        );

        await settingsPage.closeSettings();
        await homePage.checkPageIsLoaded();
        await homePage.checkArcUsageNoticeToastIsDisplayed();
      },
    );
  });
});
