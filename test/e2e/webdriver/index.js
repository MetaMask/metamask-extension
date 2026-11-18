const { Browser } = require('selenium-webdriver');
const {
  readBrowserSession,
  recordBrowserSession,
} = require('../benchmarks/utils/host-provenance');
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
  disableServerMochaToBackground,
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
  if (isBenchmark) {
    try {
      recordBrowserSession(
        readBrowserSession(await seleniumDriver.getCapabilities()),
      );
    } catch {
      // Versions stay null in the results; provenance must not fail a run.
    }
  }

  const driver = new Driver({
    driver: seleniumDriver,
    browser,
    extensionUrl,
    timeout: timeOut,
    disableServerMochaToBackground,
  });

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
