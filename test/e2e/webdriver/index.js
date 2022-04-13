const { Browser } = require('selenium-webdriver');
const Driver = require('./driver');
const ChromeDriver = require('./chrome');
const FirefoxDriver = require('./firefox');

async function buildWebDriver({ responsive, port, type } = {}) {
  const browser = process.env.SELENIUM_BROWSER;

  const {
    driver: seleniumDriver,
    extensionId,
    extensionUrl,
  } = await buildBrowserWebDriver(browser, { responsive, port, type });
  const driver = new Driver(seleniumDriver, browser, extensionUrl);

  return {
    driver,
    extensionId,
  };
}

async function buildBrowserWebDriver(browser, webDriverOptions) {
  switch (browser) {
    case Browser.CHROME: {
      return await ChromeDriver.build(webDriverOptions);
    }
    case Browser.FIREFOX: {
      return await FirefoxDriver.build(webDriverOptions);
    }
    default: {
      throw new Error(`Unrecognized browser: ${browser}`);
    }
  }
}

module.exports = {
  buildWebDriver,
};
