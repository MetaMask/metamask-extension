const { buildWebDriver } = require('./webdriver')

const tinyDelayMs = 200
const regularDelayMs = tinyDelayMs * 2
const largeDelayMs = regularDelayMs * 2

module.exports = {
  prepareExtensionForTesting,
  tinyDelayMs,
  regularDelayMs,
  largeDelayMs,
}

async function prepareExtensionForTesting ({ responsive, port } = {}) {
  const browser = process.env.SELENIUM_BROWSER
  const extensionPath = `dist/${browser}`
  const { driver, extensionId, extensionUrl } = await buildWebDriver({
    browser,
    extensionPath,
    responsive,
    port,
  })

  return { driver, extensionId, extensionUrl }
}
