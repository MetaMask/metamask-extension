const { Browser } = require('selenium-webdriver');
const fetchMockResponses = require('../../data/fetch-mocks.json');
const Driver = require('./driver');
const ChromeDriver = require('./chrome');
const FirefoxDriver = require('./firefox');

async function buildWebDriver({ responsive, port } = {}) {
  const browser = process.env.SELENIUM_BROWSER;

  const {
    driver: seleniumDriver,
    extensionId,
    extensionUrl,
  } = await buildBrowserWebDriver(browser, { responsive, port });
  await setupFetchMocking(seleniumDriver);
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

async function setupFetchMocking(driver) {
  // define fetchMocking script, to be evaluated in the browser
  function fetchMocking(mockResponses) {
    window.origFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const url = args[0];
      // api.metaswap.codefi.network/gasPrices
      if (
        url.match(/^http(s)?:\/\/api\.metaswap\.codefi\.network\/gasPrices/u)
      ) {
        return { json: async () => clone(mockResponses.gasPricesBasic) };
      } else if (url.match(/chromeextensionmm/u)) {
        return { json: async () => clone(mockResponses.metametrics) };
      } else if (url.match(/^https:\/\/(api\.metaswap|.*airswap-dev)/u)) {
        if (url.match(/featureFlag$/u)) {
          return { json: async () => clone(mockResponses.swaps.featureFlag) };
        }
      }
      return window.origFetch(...args);
    };
    if (window.chrome && window.chrome.webRequest) {
      window.chrome.webRequest.onBeforeRequest.addListener(
        cancelInfuraRequest,
        { urls: ['https://*.infura.io/*'] },
        ['blocking'],
      );
    }
    function cancelInfuraRequest(requestDetails) {
      console.log(`fetchMocking - Canceling request: "${requestDetails.url}"`);
      return { cancel: true };
    }
    function clone(obj) {
      return JSON.parse(JSON.stringify(obj));
    }
  }
  // fetchMockResponses are parsed last minute to ensure that objects are uniquely instantiated
  const fetchMockResponsesJson = JSON.stringify(fetchMockResponses);
  // eval the fetchMocking script in the browser
  await driver.executeScript(`(${fetchMocking})(${fetchMockResponsesJson})`);
}

module.exports = {
  buildWebDriver,
};
