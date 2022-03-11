class AccountDetailsMenu {
  constructor(driver) {
    // Selectors
    this.driver = driver;
    this.btnAccountDetailsMenu = '[data-testid="account-options-menu-button"]';
    this.btnViewOnEtherscan = {
      text: 'View Account on Etherscan',
      tag: 'span',
    };
    this.btnAccountDetails = { text: 'Account details', tag: 'span' };
    this.btnConnectedSites = { text: 'Connected sites', tag: 'span' };
    this.elemQrWrapper = '.qr-code__wrapper';
  }

  // Methods
  async openMenu() {
    await this.driver.clickElement(this.btnAccountDetailsMenu);
  }

  async goToViewOnEtherscan() {
    await this.driver.clickElement(this.btnViewOnEtherscan);
  }

  async seeAccountDetails() {
    await this.driver.clickElement(this.btnAccountDetails);
  }

  async seeConnectedSites() {
    await this.driver.clickElement(this.btnConnectedSites);
  }

  async getQrCode() {
    return await this.driver.findElement(this.elemQrWrapper);
  }
}

module.exports = AccountDetailsMenu;
