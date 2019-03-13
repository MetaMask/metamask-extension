const {until, By} = require('selenium-webdriver')

class Driver {
  /**
   * @param {!ThenableWebDriver} driver a {@code WebDriver} instance
   * @param {number} timeout
   */
  constructor (driver, timeout = 5000) {
    this.driver = driver
    this.timeout = timeout
  }

  /**
   * @param {string} selector the CSS selector to use
   * @return {Promise<any>}
   */
  findElement (selector) {
    return this.driver.wait(until.elementLocated(By.css(selector)), this.timeout)
  }
}

module.exports = Driver
