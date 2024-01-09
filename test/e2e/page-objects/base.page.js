const HeaderNavbar = require('../components/header-navbar');

class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.headerNavbar = new HeaderNavbar(driver);
  }
}

module.exports = BasePage;
