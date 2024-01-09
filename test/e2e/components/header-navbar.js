class HeaderNavbar {
  constructor(driver) {
    // Selectors
    this.driver = driver;
    this.btnAccountMenu = '[data-testid="account-menu-icon"]';
  }

  // Methods
  async openAccountMenu() {
    await this.driver.clickElement(this.btnAccountDetailsMenu);
  }
}

module.exports = HeaderNavbar;
