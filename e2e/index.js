const path = require('path')
const fixtures = require('./fixtures')
const {Ganache} = require('./ganache')
const ReferenceCounter = require('./rc')
const {buildWebDriver, Driver} = require('./webdriver')

const fixtureServer = new fixtures.FixtureServer()
const rc = new ReferenceCounter(() => fixtureServer.start(), () => fixtureServer.stop())

// TODO Exit if either Ganache or the browser fail to start correctly

const withFixtures = async function load (fixturesDirectory, callback) {
  await rc.tick(async () => {
    const browser = String(process.env.BROWSER || 'firefox')
    const extensionPath = path.resolve(__dirname, `../dist/${browser}`)
    const {driver, ganache} = await fixtureServer.loadState(fixturesDirectory, async ({ganacheOptions}) => {
      const ganache = new Ganache()
      await ganache.start(ganacheOptions)
      const {driver, extensionUrl} = await buildWebDriver({
        browser,
        extensionPath,
      })

      await driver.get(extensionUrl)

      return {
        driver,
        ganache,
      }
    })
    await callback({
      ganache,
      driver: new Driver(driver),
    })
    await driver.quit()
    await ganache.quit()
  })
}

module.exports = {
  withFixtures,
}
