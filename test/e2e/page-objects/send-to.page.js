const BasePage = require('./base.page');

class SendToPage extends BasePage {
  constructor(driver) {
    // Selectors
    super(driver);
    this.inputRecipient = '[data-testid="ens-input"]';
  }

  // Methods
  async addRecipient(recipientAddress) {
    await this.driver.fill(this.inputRecipient, recipientAddress);
  }
}

module.exports = SendToPage;
