const path = require('path')
const Ganache = require('./ganache')
const FixtureServer = require('./fixture-server')
const { buildWebDriver } = require('./webdriver')

const tinyDelayMs = 200
const regularDelayMs = tinyDelayMs * 2
const largeDelayMs = regularDelayMs * 2

async function withFixtures (options, callback) {
  const { fixtures, ganacheOptions, driverOptions } = options
  const fixtureServer = new FixtureServer()
  const ganacheServer = new Ganache()

  let webDriver
  try {
    if (ganacheOptions) {
      await ganacheServer.start({ ...ganacheOptions, killPortProcess: true })
    }
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

async function loadFixtures (options) {
  return new Promise((resolve) => {
    withFixtures(options, ({ driver }) => {
      return new Promise((r) => {
        resolve([driver, () => r()])
      })
    })
  })
}

module.exports = {
  tinyDelayMs,
  regularDelayMs,
  largeDelayMs,
  withFixtures,
  loadFixtures,
}
