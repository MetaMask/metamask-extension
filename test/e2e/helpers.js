const fs = require('fs')
const mkdirp = require('mkdirp')
const pify = require('pify')
const assert = require('assert')
const { until } = require('selenium-webdriver')

const { buildWebDriver } = require('./webdriver')
const fetchMockResponses = require('./fetch-mocks.json')

const tinyDelayMs = 200
const regularDelayMs = tinyDelayMs * 2
const largeDelayMs = regularDelayMs * 2

module.exports = {
  assertElementNotPresent,
  checkBrowserForConsoleErrors,
  closeAllWindowHandlesExcept,
  delay,
  findElement,
  findElements,
  openNewPage,
  switchToWindowWithTitle,
  verboseReportOnFailure,
  waitUntilXWindowHandles,
  setupFetchMocking,
  prepareExtensionForTesting,
  tinyDelayMs,
  regularDelayMs,
  largeDelayMs,
}

async function prepareExtensionForTesting ({ responsive, port } = {}) {
  const browser = process.env.SELENIUM_BROWSER
  const extensionPath = `dist/${browser}`
  const { driver, extensionId, extensionUrl } = await buildWebDriver({ browser, extensionPath, responsive, port })

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
      }
      return window.origFetch(...args)
    }
    if (window.chrome && window.chrome.webRequest) {
      window.chrome.webRequest.onBeforeRequest.addListener(cancelInfuraRequest, { urls: ['https://*.infura.io/*'] }, ['blocking'])
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

async function checkBrowserForConsoleErrors (driver) {
  const ignoredLogTypes = ['WARNING']
  const ignoredErrorMessages = [
    // Third-party Favicon 404s show up as errors
    'favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)',
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

function delay (time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

async function findElement (driver, by, timeout = 10000) {
  return driver.wait(until.elementLocated(by), timeout)
}

async function findElements (driver, by, timeout = 10000) {
  return driver.wait(until.elementsLocated(by), timeout)
}

async function openNewPage (driver, url) {
  const newHandle = await driver.switchTo().newWindow()
  await driver.get(url)
  return newHandle
}

async function waitUntilXWindowHandles (driver, x, delayStep = 1000, timeout = 5000) {
  let timeElapsed = 0
  while (timeElapsed <= timeout) {
    const windowHandles = await driver.getAllWindowHandles()
    if (windowHandles.length === x) {
      return
    }
    await delay(delayStep)
    timeElapsed += delayStep
  }
  throw new Error('waitUntilXWindowHandles timed out polling window handles')
}

async function switchToWindowWithTitle (driver, title, windowHandles) {
  if (!windowHandles) {
    windowHandles = await driver.getAllWindowHandles()
  }

  for (const handle of windowHandles) {
    await driver.switchTo().window(handle)
    const handleTitle = await driver.getTitle()
    if (handleTitle === title) {
      return handle
    }
  }

  throw new Error('No window with title: ' + title)
}

/**
 * Closes all windows except those in the given list of exceptions
 * @param {object} driver the WebDriver instance
 * @param {Array<string>} exceptions the list of window handle exceptions
 * @param {Array?} windowHandles the full list of window handles
 * @returns {Promise<void>}
 */
async function closeAllWindowHandlesExcept (driver, exceptions, windowHandles) {
  windowHandles = windowHandles || await driver.getAllWindowHandles()

  for (const handle of windowHandles) {
    if (!exceptions.includes(handle)) {
      await driver.switchTo().window(handle)
      await delay(1000)
      await driver.close()
      await delay(1000)
    }
  }
}

async function assertElementNotPresent (webdriver, driver, by) {
  let dataTab
  try {
    dataTab = await findElement(driver, by, 4000)
  } catch (err) {
    assert(err instanceof webdriver.error.NoSuchElementError || err instanceof webdriver.error.TimeoutError)
  }
  assert.ok(!dataTab, 'Found element that should not be present')
}
