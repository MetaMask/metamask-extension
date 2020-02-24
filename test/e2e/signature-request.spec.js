const assert = require('assert')
const path = require('path')
const webdriver = require('selenium-webdriver')

const { By, Key, until } = webdriver
const {
  regularDelayMs,
  largeDelayMs,
} = require('./helpers')
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
    await fixtureServer.loadState(path.join(__dirname, 'fixtures', 'imported-account'))
    publicAddress = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1'
    const result = await buildWebDriver()
    driver = result.driver
  })

  afterEach(async function () {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      const errors = await driver.checkBrowserForConsoleErrors(driver)
      if (errors.length) {
        const errorReports = errors.map((err) => err.message)
        const errorMessage = `Errors found in browser console:\n${errorReports.join('\n')}`
        console.error(new Error(errorMessage))
      }
    }
    if (this.currentTest.state === 'failed') {
      await driver.verboseReportOnFailure(driver, this.currentTest)
    }
  })

  after(async function () {
    await ganacheServer.quit()
    await fixtureServer.stop()
    await driver.quit()
  })

<<<<<<< HEAD
  describe('Going through the first time flow, but skipping the seed phrase challenge', () => {
    it('clicks the continue button on the welcome screen', async () => {
      await findElement(driver, By.css('.welcome-page__header'))
      const welcomeScreenBtn = await findElement(driver, By.xpath(`//button[contains(text(), '${enLocaleMessages.getStarted.message}')]`))
      welcomeScreenBtn.click()
      await delay(largeDelayMs)
    })

    it('clicks the "Create New Wallet" option', async () => {
      const customRpcButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Create a Wallet')]`))
      customRpcButton.click()
      await delay(largeDelayMs)
    })

    it('clicks the "No thanks" option on the metametrics opt-in screen', async () => {
      const optOutButton = await findElement(driver, By.css('.btn-default'))
      optOutButton.click()
      await delay(largeDelayMs)
    })

    it('accepts a secure password', async () => {
      const passwordBox = await findElement(driver, By.css('.first-time-flow__form #create-password'))
      const passwordBoxConfirm = await findElement(driver, By.css('.first-time-flow__form #confirm-password'))
      const button = await findElement(driver, By.css('.first-time-flow__form button'))

      await passwordBox.sendKeys('correct horse battery staple')
      await passwordBoxConfirm.sendKeys('correct horse battery staple')

      const tosCheckBox = await findElement(driver, By.css('.first-time-flow__checkbox'))
      await tosCheckBox.click()

      await button.click()
      await delay(largeDelayMs)
    })

    it('skips the seed phrase challenge', async () => {
      const button = await findElement(driver, By.xpath(`//button[contains(text(), '${enLocaleMessages.remindMeLater.message}')]`))
      await button.click()
      await delay(regularDelayMs)

      const detailsButton = await findElement(driver, By.css('.account-details__details-button'))
      await detailsButton.click()
      await delay(regularDelayMs)
    })

    it('gets the current accounts address', async () => {
      const addressInput = await findElement(driver, By.css('.qr-ellip-address'))
      publicAddress = (await addressInput.getAttribute('value')).toLowerCase()
      const accountModal = await driver.findElement(By.css('span .modal'))

      await driver.executeScript("document.querySelector('.account-modal-close').click()")

      await driver.wait(until.stalenessOf(accountModal))
      await delay(regularDelayMs)
    })

    it('changes the network', async () => {
      const networkDropdown = await findElement(driver, By.css('.network-name'))
      await networkDropdown.click()
      await delay(regularDelayMs)

      const ropstenButton = await findElement(driver, By.xpath(`//span[contains(text(), 'Ropsten')]`))
      await ropstenButton.click()
      await delay(largeDelayMs)
    })
  })

  describe('provider listening for events', () => {
=======
  describe('successfuly signs typed data', function () {
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
    let extension
    let popup
    let dapp
    let windowHandles
<<<<<<< HEAD
    it('switches to a dapp', async () => {
      await openNewPage(driver, 'http://127.0.0.1:8080/')
      await delay(regularDelayMs)

      await waitUntilXWindowHandles(driver, 3)
      windowHandles = await driver.getAllWindowHandles()

      extension = windowHandles[0]
      popup = await switchToWindowWithTitle(driver, 'MetaMask Notification', windowHandles)
      dapp = windowHandles.find(handle => handle !== extension && handle !== popup)

      await delay(regularDelayMs)
      const approveButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Connect')]`))
      await approveButton.click()

      await driver.switchTo().window(dapp)
      await delay(regularDelayMs)
=======

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

      await driver.clickElement(By.xpath(`//button[contains(text(), 'Connect')]`))

      await driver.delay(regularDelayMs)

      await driver.waitUntilXWindowHandles(3)
      const windowHandles = await driver.getAllWindowHandles()

      extension = windowHandles[0]
      dapp = await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles)
      popup = windowHandles.find((handle) => handle !== extension && handle !== dapp)

      await driver.switchToWindow(popup)

      await driver.delay(regularDelayMs)

      await driver.clickElement(By.css('.permissions-connect-choose-account__account'))

      await driver.clickElement(By.xpath(`//button[contains(text(), 'Submit')]`))

      await driver.waitUntilXWindowHandles(2)
      await driver.switchToWindow(dapp)
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
    })

    it('creates a sign typed data signature request', async function () {
      await driver.clickElement(By.xpath(`//button[contains(text(), 'Sign')]`), 10000)
      await driver.delay(largeDelayMs)

<<<<<<< HEAD
=======
      await driver.delay(regularDelayMs)
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
      windowHandles = await driver.getAllWindowHandles()
      await driver.switchToWindowWithTitle('MetaMask Notification', windowHandles)
      await driver.delay(regularDelayMs)

      const title = await driver.findElement(By.css('.signature-request-content__title'))
      const name = await driver.findElement(By.css('.signature-request-content__info--bolded'))
      const content = await driver.findElements(By.css('.signature-request-content__info'))
      const origin = content[0]
      const address = content[1]
      assert.equal(await title.getText(), 'Signature Request')
      assert.equal(await name.getText(), 'Ether Mail')
      assert.equal(await origin.getText(), '127.0.0.1')
      assert.equal(await address.getText(), publicAddress.slice(0, 8) + '...' + publicAddress.slice(publicAddress.length - 8))
    })

    it('signs the transaction', async function () {
      await driver.clickElement(By.xpath(`//button[contains(text(), 'Sign')]`), 10000)
      await driver.delay(regularDelayMs)

      extension = windowHandles[0]
      await driver.switchToWindow(extension)
    })

    it('gets the current accounts address', async function () {
      await driver.clickElement(By.css('.account-details__details-button'))
      await driver.delay(regularDelayMs)

      const addressInput = await driver.findElement(By.css('.qr-ellip-address'))
      const newPublicAddress = await addressInput.getAttribute('value')
      const accountModal = await driver.findElement(By.css('span .modal'))

      await driver.clickElement(By.css('.account-modal-close'))

      await driver.wait(until.stalenessOf(accountModal))
      await driver.delay(regularDelayMs)
      assert.equal(newPublicAddress.toLowerCase(), publicAddress)
    })
  })
})
