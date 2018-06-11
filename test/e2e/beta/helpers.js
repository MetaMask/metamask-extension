const { until } = require('selenium-webdriver')

module.exports = {
  checkBrowserForConsoleErrors,
  loadExtension,
  findElement,
  findElements,
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

async function findElement (driver, by, timeout = 10000) {
  return driver.wait(until.elementLocated(by), timeout)
}

async function findElements (driver, by, timeout = 10000) {
  return driver.wait(until.elementsLocated(by), timeout)
}
