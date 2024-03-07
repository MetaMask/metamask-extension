const BasePage = require('./base.page');

class LoginPage extends BasePage {
  constructor(driver) {
    // Selectors
    super(driver);
    this.inputPassword = '#password';
    this.btnUnlock = '[data-testid="unlock-submit"]';
  }

  // Methods
  async addPassword(password) {
    await this.driver.fill(this.inputPassword, password);
  }

  async unlock() {
    await this.driver.clickElement(this.btnUnlock);
  }
}

module.exports = LoginPage;
