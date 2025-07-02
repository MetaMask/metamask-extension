import { Driver } from '../../webdriver/driver';

class NetworkManagerListItem {
  protected readonly driver: Driver;

  protected readonly tokenListItemTokenName =
    '[data-testid="multichain-token-list-item-token-name"]';

  protected readonly tokenListItemSecondaryValue =
    '[data-testid="defi-list-market-value"]';

  // network-list-item-eip155:1

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // async check_tokenMarketValue(tokenListItemSecondaryValue: string) {
  //   console.log(
  //     'Check if token market value is displayed on token list item',
  //     tokenListItemSecondaryValue,
  //   );
  //   await this.driver.waitForSelector({
  //     css: this.tokenListItemSecondaryValue,
  //     text: tokenListItemSecondaryValue,
  //   });
  // }

  // async check_tokenName(tokenName: string) {
  //   console.log(
  //     'Check if token name is displayed on token list item',
  //     tokenName,
  //   );
  //   await this.driver.waitForSelector({
  //     css: this.tokenListItemTokenName,
  //     text: tokenName,
  //   });
  // }
}

class NetworkManager {
  protected readonly driver: Driver;

  readonly networkManagerListItems: NetworkManagerListItem;

  private readonly networkManagerToggle = '[data-testid="sort-by-networks"]';

  private readonly networkManagerCloseButton =
    '[data-testid="modal-header-close-button"]';

  // private readonly allNetworksOption =
  //   '[data-testid="network-filter-all__button"]';

  // private readonly networksToggle = '[data-testid="sort-by-networks"]';

  // private readonly popularNetworks =
  //   '[data-testid="network-filter-all__button"]';

  // private readonly stakeLink = '[data-testid="defi-tab-start-earning-link"]';

  // private readonly groupIcon = '[data-testid="avatar-group"]';

  // private readonly errorMessage = '[data-testid="defi-tab-error-message"]';

  // private readonly noPositionsMessage = '[data-testid="defi-tab-no-positions"]';

  private readonly networkListItem = (networkName: string) =>
    `[data-testid="network-list-item-${networkName}"]`;

  private readonly networkCheckbox = (networkName: string) =>
    `[data-testid="network-list-item-${networkName}"] input[type="checkbox"]`;

  // private readonly customTabButton = 'button:contains("Custom")';

  // private readonly defaultTabButton = 'button:contains("Default")';

  private readonly tabList = '.tabs__list.network-manager__tab-list';

  constructor(driver: Driver) {
    this.driver = driver;
    this.networkManagerListItems = new NetworkManagerListItem(driver);
  }

  // select a network from the manager list
  async openNetworkManager(): Promise<void> {
    console.log(`Opening the network manager`);
    await this.driver.clickElement(this.networkManagerToggle);
  }

  async closeNetworkManager(): Promise<void> {
    console.log(`Closing the network manager`);
    await this.driver.clickElement(this.networkManagerCloseButton);
  }

  async selectTab(tabName: string): Promise<void> {
    console.log(`Selecting tab: ${tabName}`);
    await this.driver.clickElement({
      text: tabName,
    });
  }

  // Method to select/click on a network item
  async selectNetwork(networkName: string): Promise<void> {
    console.log(`Selecting network: ${networkName}`);
    await this.checkNetworkIsDeselected(networkName);
    await this.driver.clickElementSafe(this.networkListItem(networkName));
  }

  async deselectNetwork(networkName: string): Promise<void> {
    console.log(`Deselecting network: ${networkName}`);
    await this.checkNetworkIsSelected(networkName);
    await this.driver.clickElementSafe(this.networkListItem(networkName));
  }

  // Method to check if a network is currently selected/active
  async checkNetworkIsSelected(networkName: string): Promise<void> {
    console.log(`Checking if network is selected: ${networkName}`);
    const checkbox = await this.driver.waitForSelector(
      this.networkCheckbox(networkName),
    );
    const isChecked = await checkbox.isSelected();
    if (!isChecked) {
      throw new Error(
        `Network ${networkName} is not selected (checkbox not checked)`,
      );
    }
    console.log(`Network ${networkName} is properly selected`);
  }

  async checkCustomNetworkIsSelected(caipChainId: string) {
    const selector = `[data-testid="network-list-item-${caipChainId}"].multichain-network-list-item--selected`;
    await this.driver.waitForSelector(selector);

    // Additional verification: ensure the selected indicator is present
    const indicatorSelector = `[data-testid="network-list-item-${caipChainId}"] .multichain-network-list-item__selected-indicator`;
    await this.driver.waitForSelector(indicatorSelector);

    console.log(
      `Custom network ${caipChainId} is properly selected with background indication`,
    );
  }

  async checkNetworkIsDeselected(networkName: string): Promise<void> {
    console.log(`Checking if network is deselected: ${networkName}`);
    const checkbox = await this.driver.waitForSelector(
      this.networkCheckbox(networkName),
    );
    const isChecked = await checkbox.isSelected();
    if (isChecked) {
      throw new Error(
        `Network ${networkName} is still selected (checkbox is checked)`,
      );
    }
    console.log(`Network ${networkName} is properly deselected`);
  }

  async checkTabIsSelected(tabName: string): Promise<void> {
    console.log(`Checking if ${tabName} tab is selected`);
    // Find the active tab and verify it contains "Custom" text
    await this.driver.waitForSelector({
      css: `${this.tabList} li.tab--active button`,
      text: tabName,
    });
    console.log(`${tabName} tab is properly selected`);
  }

  // selects a custom network from the manager list

  // selects a non-evm network from the manager list
  // async openNetworksFilterAndClickPopularNetworks(): Promise<void> {
  //   console.log(`Opening the network filter and click popular networks`);
  //   await this.driver.clickElement(this.networkManagerToggle);
  //   await this.driver.waitUntil(
  //     async () => {
  //       return Boolean(await this.driver.findElement(this.allNetworksOption));
  //     },
  //     {
  //       timeout: 5000,
  //       interval: 100,
  //     },
  //   );
  //   await this.driver.clickElement(this.popularNetworks);
  // }

  // async clickIntoAaveV3DetailsPage() {
  //   console.log('Click Aave V3 details page');
  //   await this.driver.clickElement({
  //     text: 'Aave V3',
  //   });
  // }

  // async check_errorMessageIsDisplayed(): Promise<void> {
  //   console.log('Check that error message is displayed');
  //   await this.driver.waitForSelector(this.errorMessage);
  // }

  // async check_noPositionsMessageIsDisplayed(): Promise<void> {
  //   console.log('Check that no positions message is displayed');
  //   await this.driver.waitForSelector(this.noPositionsMessage);
  // }

  // async check_groupIconIsDisplayed(): Promise<void> {
  //   console.log('Check that group icon is displayed');
  //   await this.driver.waitForSelector(this.groupIcon);
  // }

  // async waitForStakeLink(): Promise<void> {
  //   console.log('Wait for stake link to be displayed');
  //   await this.driver.waitForSelector(this.stakeLink);
  // }
}

export default NetworkManager;
