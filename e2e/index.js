const path = require('path')
const fixtures = require('./fixtures')
const ReferenceCounter = require('./rc')
const {buildWebDriver, Driver} = require('./webdriver')

const fixtureServer = new fixtures.FixtureServer()
const rc = new ReferenceCounter(async () => fixtureServer.start(), async () => fixtureServer.stop())

const load = async function load (fixturesDirectory, callback) {
  await rc.tick(async () => {
    const browser = String(process.env.BROWSER || 'firefox')
    const extensionPath = path.resolve(__dirname, `../dist/${browser}`)
    const driver = await fixtureServer.loadState(fixturesDirectory, async () => {
      const {driver, extensionUrl} = await buildWebDriver({
        browser,
        extensionPath,
      })

      await driver.get(extensionUrl)

      return driver
    })
    await callback({
      driver: new Driver(driver),
    })
    await driver.quit()
  })
}

module.exports = {
  load,
}
