const BasePage = require('./base.page');

class HomePage extends BasePage {
  constructor(driver) {
    // Selectors
    super(driver);
    this.btnSend = '[data-testid="eth-overview-send"]';
    this.btnActivity = '[data-testid="home__activity-tab"]';
    this.confirmedTx = '.transaction-status-label--confirmed';
  }

  // Methods
  async startSendFlow() {
    await this.driver.clickElement(this.btnSend);
  }

  async goToActivityList() {
    await this.driver.clickElement(this.btnActivity);
  }

  async isConfirmedTxInActivity() {
    return await this.driver.isElementPresent(this.confirmedTx);
  }
}

module.exports = HomePage;
