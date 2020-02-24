const path = require('path')
const Ganache = require('./ganache')
const FixtureServer = require('./fixture-server')
const { buildWebDriver } = require('./webdriver')

const tinyDelayMs = 200
const regularDelayMs = tinyDelayMs * 2
const largeDelayMs = regularDelayMs * 2

<<<<<<< HEAD
module.exports = {
  assertElementNotPresent,
  checkBrowserForConsoleErrors,
  closeAllWindowHandlesExcept,
  findElement,
  findElements,
  loadExtension,
  openNewPage,
  switchToWindowWithTitle,
  switchToWindowWithUrlThatMatches,
  verboseReportOnFailure,
  waitUntilXWindowHandles,
  setupFetchMocking,
  prepareExtensionForTesting,
  tinyDelayMs,
  regularDelayMs,
  largeDelayMs,
}


async function prepareExtensionForTesting ({ responsive } = {}) {
  let driver, extensionId, extensionUrl
  const targetBrowser = process.env.SELENIUM_BROWSER
  switch (targetBrowser) {
    case 'chrome': {
      const extPath = path.resolve('dist/chrome')
      driver = buildChromeWebDriver(extPath, { responsive })
      await delay(largeDelayMs)
      extensionId = await getExtensionIdChrome(driver)
      extensionUrl = `chrome-extension://${extensionId}/home.html`
      break
    }
    case 'firefox': {
      const extPath = path.resolve('dist/firefox')
      driver = buildFirefoxWebdriver({ responsive })
      await installWebExt(driver, extPath)
      await delay(largeDelayMs)
      extensionId = await getExtensionIdFirefox(driver)
      extensionUrl = `moz-extension://${extensionId}/home.html`
      break
    }
    default: {
      throw new Error(`prepareExtensionForTesting - unable to prepare extension for unknown browser "${targetBrowser}"`)
    }
  }
  // Depending on the state of the application built into the above directory (extPath) and the value of
  // METAMASK_DEBUG we will see different post-install behaviour and possibly some extra windows. Here we
  // are closing any extraneous windows to reset us to a single window before continuing.

  // wait an extra long time so any slow popups can trigger
  await delay(4 * largeDelayMs)

  const [tab1] = await driver.getAllWindowHandles()
  await closeAllWindowHandlesExcept(driver, [tab1])
  await driver.switchTo().window(tab1)
  await driver.get(extensionUrl)

  return { driver, extensionId, extensionUrl }
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
        return { json: async () => clone(fetchMockResponses.ethGasPredictTable) }
      } else if (url.match(/chromeextensionmm/)) {
        return { json: async () => clone(fetchMockResponses.metametrics) }
      } else if (url === 'https://dev.blockscale.net/api/gasexpress.json') {
        return { json: async () => clone(fetchMockResponses.gasExpress) }
      }
      return window.origFetch(...args)
    }
    if (window.chrome && window.chrome.webRequest) {
      window.chrome.webRequest.onBeforeRequest.addListener(cancelInfuraRequest, {urls: ['https://*.infura.io/*']}, ['blocking'])
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

async function loadExtension (driver, extensionId) {
  switch (process.env.SELENIUM_BROWSER) {
    case 'chrome': {
      await driver.get(`chrome-extension://${extensionId}/home.html`)
      break
    }
    case 'firefox': {
      await driver.get(`moz-extension://${extensionId}/home.html`)
      break
    }
  }
}

async function checkBrowserForConsoleErrors (driver) {
  const ignoredLogTypes = ['WARNING']
  const ignoredErrorMessages = [
    // React throws error warnings on "dataset", but still sets the data-* properties correctly
    'Warning: Unknown prop `dataset` on ',
    // Third-party Favicon 404s show up as errors
    'favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)',
    // React Development build - known issue blocked by test build sys
    'Warning: It looks like you\'re using a minified copy of the development build of React.',
    // Redux Development build - known issue blocked by test build sys
    'This means that you are running a slower development build of Redux.',
  ]
  const browserLogs = await driver.manage().logs().get('browser')
  const errorEntries = browserLogs.filter(entry => !ignoredLogTypes.includes(entry.level.toString()))
  const errorObjects = errorEntries.map(entry => entry.toJSON())
  return errorObjects.filter(entry => !ignoredErrorMessages.some(message => entry.message.includes(message)))
}

async function verboseReportOnFailure (driver, test) {
  let artifactDir
  if (process.env.SELENIUM_BROWSER === 'chrome') {
    artifactDir = `./test-artifacts/chrome/${test.title}`
  } else if (process.env.SELENIUM_BROWSER === 'firefox') {
    artifactDir = `./test-artifacts/firefox/${test.title}`
  }
  const filepathBase = `${artifactDir}/test-failure`
  await pify(mkdirp)(artifactDir)
  const screenshot = await driver.takeScreenshot()
  await pify(fs.writeFile)(`${filepathBase}-screenshot.png`, screenshot, { encoding: 'base64' })
  const htmlSource = await driver.getPageSource()
  await pify(fs.writeFile)(`${filepathBase}-dom.html`, htmlSource)
}

async function findElement (driver, by, timeout = 10000) {
  return driver.wait(until.elementLocated(by), timeout)
}

async function findElements (driver, by, timeout = 10000) {
  return driver.wait(until.elementsLocated(by), timeout)
}

async function openNewPage (driver, url) {
  await driver.executeScript('window.open()')
  await delay(1000)
=======
async function withFixtures (options, callback) {
  const { fixtures, ganacheOptions, driverOptions } = options
  const fixtureServer = new FixtureServer()
  const ganacheServer = new Ganache()
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

  let webDriver
  try {
    await ganacheServer.start(ganacheOptions)
    await fixtureServer.start()
    await fixtureServer.loadState(path.join(__dirname, 'fixtures', fixtures))
    const { driver } = await buildWebDriver(driverOptions)
    webDriver = driver

    await callback({
      driver,
    })
  } finally {
    await fixtureServer.stop()
    await ganacheServer.quit()
    if (webDriver) {
      await webDriver.quit()
    }
  }
}

module.exports = {
  tinyDelayMs,
  regularDelayMs,
  largeDelayMs,
  withFixtures,
}
