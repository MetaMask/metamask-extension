const { Browser } = require('selenium-webdriver');
const { Driver } = require('./driver');
const ChromeDriver = require('./chrome');
const FirefoxDriver = require('./firefox');

async function buildWebDriver({
  responsive,
  openDevToolsForTabs,
  constrainWindowSize,
  port,
  timeOut,
  proxyPort,
} = {}) {
  const browser = process.env.SELENIUM_BROWSER;

  const {
    driver: seleniumDriver,
    extensionId,
    extensionUrl,
  } = await buildBrowserWebDriver(browser, {
    responsive,
    openDevToolsForTabs,
    port,
    constrainWindowSize,
    proxyPort,
  });
  const driver = new Driver(seleniumDriver, browser, extensionUrl, timeOut);

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
