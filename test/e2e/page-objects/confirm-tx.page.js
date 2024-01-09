const BasePage = require('./base.page');

class ConfirmTxPage extends BasePage {
  constructor(driver) {
    // Selectors
    super(driver);
    this.btnConfirm = '[data-testid="page-container-footer-next"]';
  }

  // Methods
  async confirmTx() {
    await this.driver.clickElement(this.btnConfirm);
  }
}

module.exports = ConfirmTxPage;
