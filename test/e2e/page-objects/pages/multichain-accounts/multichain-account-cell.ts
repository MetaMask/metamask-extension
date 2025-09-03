import { Driver } from '../../../webdriver/driver';

class MultichainAccountCellList {
  private readonly driver: Driver;

  private readonly accountMenuButton =
    '[data-testid="multichain-account-menu-button"]';

  readonly multichainAccountTreeWalletHeader =
    '[data-testid="multichain-account-tree-wallet-header"]';

  private readonly multichainAccountMenuItem =
    '[data-testid="multichain-account-menu-item-accountDetails"]';

  private readonly multichainAccountMenuRenameItem =
    '[data-testid="multichain-account-menu-item-rename"]';

  private readonly multichainAccountMenuAddressesItem =
    '[data-testid="multichain-account-menu-item-addresses"]';

  private readonly multichainAccountMenuPinItem =
    '[data-testid="multichain-account-menu-item-pin"]';

  private readonly multichainAccountMenuHideItem =
    '[data-testid="multichain-account-menu-item-hide"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.multichainAccountTreeWalletHeader);
  }

  async clickAccountMenuButton(): Promise<void> {
    await this.driver.clickElement(this.accountMenuButton);
  }

  async clickMultichainAccountMenuItem(): Promise<void> {
    await this.driver.clickElement(this.multichainAccountMenuItem);
  }

  async clickMultichainAccountMenuRenameItem(): Promise<void> {
    await this.driver.clickElement(this.multichainAccountMenuRenameItem);
  }

  async clickMultichainAccountMenuAddressesItem(): Promise<void> {
    await this.driver.clickElement(this.multichainAccountMenuAddressesItem);
  }

  async clickMultichainAccountMenuPinItem(): Promise<void> {
    await this.driver.clickElement(this.multichainAccountMenuPinItem);
  }

  async clickMultichainAccountMenuHideItem(): Promise<void> {
    await this.driver.clickElement(this.multichainAccountMenuHideItem);
  }
}

export default MultichainAccountCellList;
