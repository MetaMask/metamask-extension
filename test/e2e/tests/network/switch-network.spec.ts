import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import {
  withFixtures,
  defaultGanacheOptions,
  unlockWallet,
  tinyDelayMs,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import AddNetworkPage from '../../page-objects/pages/add-network-page';
import NewNetworkAddedPopover from '../../page-objects/pages/popover-wrap/new-network-added';

describe('Switch network', function (this: Suite) {
  it('Ethereum Mainnet', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetwork = new SelectNetwork(driver);
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetwork.clickEthereumMainnet();
        await homePage.check_expectedBalanceIsDisplayed();
      },
    );
  });

  it('create Tenderly network then click dismiss in switch network dialog', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetwork = new SelectNetwork(driver);
        const addNetworkPage = new AddNetworkPage(driver);
        const newNetworkAddedPopover = new NewNetworkAddedPopover(driver);
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetwork.addNewNetwork();
        await addNetworkPage.addNewNetworkManually();
        await addNetworkPage.addNetwork({
          name: 'Tenderly',
          rpcUrl:
            'https://rpc.tenderly.co/fork/cdbcd795-097d-4624-aa16-680374d89a43',
          chainId: '1',
          symbol: 'ETH',
          explorerUrl: 'https://dashboard.tenderly.co/explorer',
        });

        // await newNetworkAddedPopover.clickSwitchButton("Tenderly");
        await newNetworkAddedPopover.clickDismissButton();
        await headerNavbar.check_networkNameSwitchDropDown('Localhost 8545');

        await driver.delay(tinyDelayMs);
      },
    );
  });
});
