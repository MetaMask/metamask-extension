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
