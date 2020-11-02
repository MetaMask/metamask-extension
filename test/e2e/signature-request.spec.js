const assert = require('assert')
const path = require('path')
const webdriver = require('selenium-webdriver')

const { By, Key, until } = webdriver
const { regularDelayMs, largeDelayMs } = require('./helpers')
const { buildWebDriver } = require('./webdriver')
const Ganache = require('./ganache')
const FixtureServer = require('./fixture-server')

const fixtureServer = new FixtureServer()

const ganacheServer = new Ganache()

describe('MetaMask', function () {
  let driver
  let publicAddress

  this.timeout(0)
  this.bail(true)

  before(async function () {
    await ganacheServer.start()
    await fixtureServer.start()
    await fixtureServer.loadState(
      path.join(__dirname, 'fixtures', 'imported-account'),
    )
    publicAddress = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1'
    const result = await buildWebDriver()
    driver = result.driver
  })

  afterEach(async function () {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      const errors = await driver.checkBrowserForConsoleErrors(driver)
      if (errors.length) {
        const errorReports = errors.map((err) => err.message)
        const errorMessage = `Errors found in browser console:\n${errorReports.join(
          '\n',
        )}`
        console.error(new Error(errorMessage))
      }
    }
    if (this.currentTest.state === 'failed') {
      await driver.verboseReportOnFailure(this.currentTest.title)
    }
  })

  after(async function () {
    await ganacheServer.quit()
    await fixtureServer.stop()
    await driver.quit()
  })

  describe('successfully signs typed data', function () {
    let extension
    let popup
    let dapp
    let windowHandles

    it('accepts the account password after lock', async function () {
      await driver.delay(1000)
      const passwordField = await driver.findElement(By.id('password'))
      await passwordField.sendKeys('correct horse battery staple')
      await passwordField.sendKeys(Key.ENTER)
      await driver.delay(largeDelayMs * 4)
    })

    it('connects to the dapp', async function () {
      await driver.openNewPage('http://127.0.0.1:8080/')
      await driver.delay(regularDelayMs)

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Connect')]`),
      )

      await driver.delay(regularDelayMs)

      await driver.waitUntilXWindowHandles(3)
      windowHandles = await driver.getAllWindowHandles()

      extension = windowHandles[0]
      dapp = await driver.switchToWindowWithTitle(
        'E2E Test Dapp',
        windowHandles,
      )
      popup = windowHandles.find(
        (handle) => handle !== extension && handle !== dapp,
      )

      await driver.switchToWindow(popup)

      await driver.delay(regularDelayMs)

      await driver.clickElement(By.xpath(`//button[contains(text(), 'Next')]`))
      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Connect')]`),
      )

      await driver.waitUntilXWindowHandles(2)
      await driver.switchToWindow(dapp)
    })

    it('creates a sign typed data signature request', async function () {
      await driver.clickElement(By.id('signTypedData'), 10000)
      await driver.delay(largeDelayMs)

      await driver.delay(regularDelayMs)
      windowHandles = await driver.getAllWindowHandles()
      await driver.switchToWindowWithTitle(
        'MetaMask Notification',
        windowHandles,
      )
      await driver.delay(regularDelayMs)

      const title = await driver.findElement(
        By.css('.signature-request-content__title'),
      )
      const name = await driver.findElement(
        By.css('.signature-request-content__info--bolded'),
      )
      const content = await driver.findElements(
        By.css('.signature-request-content__info'),
      )
      const origin = content[0]
      const address = content[1]
      assert.equal(await title.getText(), 'Signature Request')
      assert.equal(await name.getText(), 'Ether Mail')
      assert.equal(await origin.getText(), 'http://127.0.0.1:8080')
      assert.equal(
        await address.getText(),
        `${publicAddress.slice(0, 8)}...${publicAddress.slice(
          publicAddress.length - 8,
        )}`,
      )
    })

    it('signs the transaction', async function () {
      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Sign')]`),
        10000,
      )
      await driver.delay(regularDelayMs)

      extension = windowHandles[0]
      await driver.switchToWindow(extension)
    })

    it('gets the current accounts address', async function () {
      await driver.clickElement(
        By.css('[data-testid="account-options-menu-button"]'),
      )
      await driver.clickElement(
        By.css('[data-testid="account-options-menu__account-details"]'),
      )
      await driver.delay(regularDelayMs)

      const addressInput = await driver.findElement(
        By.css('.readonly-input__input'),
      )
      const newPublicAddress = await addressInput.getAttribute('value')
      const accountModal = await driver.findElement(By.css('span .modal'))

      await driver.clickElement(By.css('.account-modal__close'))

      await driver.wait(until.stalenessOf(accountModal))
      await driver.delay(regularDelayMs)
      assert.equal(newPublicAddress.toLowerCase(), publicAddress)
    })
  })
})
