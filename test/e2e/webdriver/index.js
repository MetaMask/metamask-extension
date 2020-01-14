const { Browser } = require('selenium-webdriver')
const Driver = require('./driver')
const ChromeDriver = require('./chrome')
const FirefoxDriver = require('./firefox')
const fetchMockResponses = require('../../data/fetch-mocks.json')

async function buildWebDriver ({ responsive, port } = {}) {
  const browser = process.env.SELENIUM_BROWSER
  const extensionPath = `dist/${browser}`

  switch (browser) {
    case Browser.CHROME: {
      const { driver, extensionId, extensionUrl } = await ChromeDriver.build({
        extensionPath,
        responsive,
        port,
      })
      setupFetchMocking(driver)
      await driver.get(extensionUrl)

      return {
        driver: new Driver(driver, browser),
        extensionId,
        extensionUrl,
      }
    }
    case Browser.FIREFOX: {
      const { driver, extensionId, extensionUrl } = await FirefoxDriver.build({
        extensionPath,
        responsive,
        port,
      })
      setupFetchMocking(driver)
      await driver.get(extensionUrl)

      return {
        driver: new Driver(driver, browser),
        extensionId,
        extensionUrl,
      }
    }
    default: {
      throw new Error(`Unrecognized browser: ${browser}`)
    }
  }
}

async function setupFetchMocking (driver) {
  // define fetchMocking script, to be evaluated in the browser
  function fetchMocking (fetchMockResponses) {
    window.origFetch = window.fetch.bind(window)
    window.fetch = async (...args) => {
      const url = args[0]
      if (url === 'https://ethgasstation.info/json/ethgasAPI.json') {
        return { json: async () => clone(fetchMockResponses.ethGasBasic) }
      } else if (url === 'https://ethgasstation.info/json/predictTable.json') {
        return {
          json: async () => clone(fetchMockResponses.ethGasPredictTable),
        }
      } else if (url.match(/chromeextensionmm/)) {
        return { json: async () => clone(fetchMockResponses.metametrics) }
      }
      return window.origFetch(...args)
    }
    if (window.chrome && window.chrome.webRequest) {
      window.chrome.webRequest.onBeforeRequest.addListener(
        cancelInfuraRequest,
        { urls: ['https://*.infura.io/*'] },
        ['blocking']
      )
    }
    function cancelInfuraRequest (requestDetails) {
      console.log(`fetchMocking - Canceling request: "${requestDetails.url}"`)
      return { cancel: true }
    }
    function clone (obj) {
      return JSON.parse(JSON.stringify(obj))
    }
  }
  // fetchMockResponses are parsed last minute to ensure that objects are uniquely instantiated
  const fetchMockResponsesJson = JSON.stringify(fetchMockResponses)
  // eval the fetchMocking script in the browser
  await driver.executeScript(`(${fetchMocking})(${fetchMockResponsesJson})`)
}

module.exports = {
  buildWebDriver,
}
