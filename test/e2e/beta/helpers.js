const fs = require('fs')
const mkdirp = require('mkdirp')
const pify = require('pify')
const assert = require('assert')
const {until} = require('selenium-webdriver')
const { delay } = require('../func')

module.exports = {
  assertElementNotPresent,
  checkBrowserForConsoleErrors,
  closeAllWindowHandlesExcept,
  findElement,
  findElements,
  loadExtension,
  openNewPage,
  switchToWindowWithTitle,
  verboseReportOnFailure,
  waitUntilXWindowHandles,
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

  const handles = await driver.getAllWindowHandles()
  const lastHandle = handles[handles.length - 1]
  await driver.switchTo().window(lastHandle)

  await driver.get(url)
  await delay(1000)
}

async function waitUntilXWindowHandles (driver, x) {
  const windowHandles = await driver.getAllWindowHandles()
  if (windowHandles.length === x) return
  await delay(1000)
  return await waitUntilXWindowHandles(driver, x)
}

async function switchToWindowWithTitle (driver, title, windowHandles) {
  if (!windowHandles) {
    windowHandles = await driver.getAllWindowHandles()
  } else if (windowHandles.length === 0) {
    throw new Error('No window with title: ' + title)
  }
  const firstHandle = windowHandles[0]
  await driver.switchTo().window(firstHandle)
  const handleTitle = await driver.getTitle()

  if (handleTitle === title) {
    return firstHandle
  } else {
    return await switchToWindowWithTitle(driver, title, windowHandles.slice(1))
  }
}

async function closeAllWindowHandlesExcept (driver, exceptions, windowHandles) {
  exceptions = typeof exceptions === 'string' ? [ exceptions ] : exceptions
  windowHandles = windowHandles || await driver.getAllWindowHandles()
  const lastWindowHandle = windowHandles.pop()
  if (!exceptions.includes(lastWindowHandle)) {
    await driver.switchTo().window(lastWindowHandle)
    await delay(1000)
    await driver.close()
    await delay(1000)
  }
  return windowHandles.length && await closeAllWindowHandlesExcept(driver, exceptions, windowHandles)
}

async function assertElementNotPresent (webdriver, driver, by) {
  try {
    const dataTab = await findElement(driver, by, 4000)
    if (dataTab) {
      assert(false, 'Data tab should not be present')
    }
  } catch (err) {
    assert(err instanceof webdriver.error.NoSuchElementError)
  }
}
