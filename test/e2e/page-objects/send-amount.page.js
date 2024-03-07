const BasePage = require('./base.page');

class SendToPage extends BasePage {
  constructor(driver) {
    // Selectors
    super(driver);
    this.inputAmount = '[data-testid="currency-input"]';
    this.btnNext = '[data-testid="page-container-footer-next"]';
  }

  // Methods
  async addAmount(amount) {
    await this.driver.fill(this.inputAmount, amount);
  }

  async goToNextScreen() {
    await this.driver.clickElement(this.btnNext);
  }
}

module.exports = SendToPage;
