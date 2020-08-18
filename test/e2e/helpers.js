const path = require('path')
const createStaticServer = require('../../development/create-static-server')
const Ganache = require('./ganache')
const FixtureServer = require('./fixture-server')
const { buildWebDriver } = require('./webdriver')

const tinyDelayMs = 200
const regularDelayMs = tinyDelayMs * 2
const largeDelayMs = regularDelayMs * 2

const dappPort = 8080

async function withFixtures (options, callback) {
  const { dapp, fixtures, ganacheOptions, driverOptions, title } = options
  const fixtureServer = new FixtureServer()
  const ganacheServer = new Ganache()
  let dappServer

  let webDriver
  try {
    await ganacheServer.start(ganacheOptions)
    await fixtureServer.start()
    await fixtureServer.loadState(path.join(__dirname, 'fixtures', fixtures))
    if (dapp) {
      const dappDirectory = path.resolve(__dirname, '..', '..', 'node_modules', '@metamask', 'test-dapp', 'dist')
      dappServer = createStaticServer(dappDirectory)
      dappServer.listen(dappPort)
      await new Promise((resolve, reject) => {
        dappServer.on('listening', resolve)
        dappServer.on('error', reject)
      })
    }
    const { driver } = await buildWebDriver(driverOptions)
    webDriver = driver

    // eslint-disable-next-line callback-return
    await callback({
      driver,
    })

    if (process.env.SELENIUM_BROWSER === 'chrome') {
      const errors = await driver.checkBrowserForConsoleErrors(driver)
      if (errors.length) {
        const errorReports = errors.map((err) => err.message)
        const errorMessage = `Errors found in browser console:\n${errorReports.join('\n')}`
        throw new Error(errorMessage)
      }
    }
  } catch (error) {
    if (webDriver) {
      await webDriver.verboseReportOnFailure(title)
    }
    throw error
  } finally {
    await fixtureServer.stop()
    await ganacheServer.quit()
    if (webDriver) {
      await webDriver.quit()
    }
    if (dappServer) {
      await new Promise((resolve, reject) => {
        dappServer.close((error) => {
          if (error) {
            return reject(error)
          }
          return resolve()
        })
      })
    }
  }
}

module.exports = {
  tinyDelayMs,
  regularDelayMs,
  largeDelayMs,
  withFixtures,
}
