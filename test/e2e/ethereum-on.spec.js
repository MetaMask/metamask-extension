const assert = require('assert')
const webdriver = require('selenium-webdriver')

const { By, until } = webdriver
const {
  regularDelayMs,
  largeDelayMs,
} = require('./helpers')
const { buildWebDriver } = require('./webdriver')
const Ganache = require('./ganache')
const enLocaleMessages = require('../../app/_locales/en/messages.json')

const ganacheServer = new Ganache()

describe('MetaMask', function () {
  let driver
  let publicAddress

  this.timeout(0)
  this.bail(true)

  before(async function () {
    await ganacheServer.start({
      accounts: [
        {
          secretKey: '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
          balance: 25000000000000000000,
        },
      ],
    })
    const result = await buildWebDriver()
    driver = result.driver
  })

  afterEach(async function () {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      const errors = await driver.checkBrowserForConsoleErrors(driver)
      if (errors.length) {
        const errorReports = errors.map(err => err.message)
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
    await driver.quit()
  })

  describe('Going through the first time flow, but skipping the seed phrase challenge', () => {
    it('clicks the continue button on the welcome screen', async () => {
      await driver.findElement(By.css('.welcome-page__header'))
      const welcomeScreenBtn = await driver.findElement(By.xpath(`//button[contains(text(), '${enLocaleMessages.getStarted.message}')]`))
      welcomeScreenBtn.click()
      await driver.delay(largeDelayMs)
    })

    it('clicks the "Create New Wallet" option', async () => {
      const customRpcButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Create a Wallet')]`))
      customRpcButton.click()
      await driver.delay(largeDelayMs)
    })

    it('clicks the "No thanks" option on the metametrics opt-in screen', async () => {
      const optOutButton = await driver.findElement(By.css('.btn-default'))
      optOutButton.click()
      await driver.delay(largeDelayMs)
    })

    it('accepts a secure password', async () => {
      const passwordBox = await driver.findElement(By.css('.first-time-flow__form #create-password'))
      const passwordBoxConfirm = await driver.findElement(By.css('.first-time-flow__form #confirm-password'))
      const button = await driver.findElement(By.css('.first-time-flow__form button'))

      await passwordBox.sendKeys('correct horse battery staple')
      await passwordBoxConfirm.sendKeys('correct horse battery staple')

      const tosCheckBox = await driver.findElement(By.css('.first-time-flow__checkbox'))
      await tosCheckBox.click()

      await button.click()
      await driver.delay(largeDelayMs)
    })

    it('skips the seed phrase challenge', async () => {
      const button = await driver.findElement(By.xpath(`//button[contains(text(), '${enLocaleMessages.remindMeLater.message}')]`))
      await button.click()
      await driver.delay(regularDelayMs)

      const detailsButton = await driver.findElement(By.css('.account-details__details-button'))
      await detailsButton.click()
      await driver.delay(regularDelayMs)
    })

    it('gets the current accounts address', async () => {
      const addressInput = await driver.findElement(By.css('.qr-ellip-address'))
      publicAddress = await addressInput.getAttribute('value')
      const accountModal = await driver.findElement(By.css('span .modal'))

      const accountModalClose = await driver.findElement(By.css('.account-modal-close'))
      await accountModalClose.click()

      await driver.wait(until.stalenessOf(accountModal))
      await driver.delay(regularDelayMs)
    })

  })

  describe('provider listening for events', () => {
    let extension
    let popup
    let dapp

    it('connects to the dapp', async () => {
      await driver.openNewPage('http://127.0.0.1:8080/')
      await driver.delay(regularDelayMs)

      const connectButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Connect')]`))
      await connectButton.click()

      await driver.delay(regularDelayMs)

      await driver.waitUntilXWindowHandles(3)
      const windowHandles = await driver.getAllWindowHandles()

      extension = windowHandles[0]
      dapp = await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles)
      popup = windowHandles.find(handle => handle !== extension && handle !== dapp)

      await driver.switchToWindow(popup)

      await driver.delay(regularDelayMs)

      const accountButton = await driver.findElement(By.css('.permissions-connect-choose-account__account'))
      await accountButton.click()

      const submitButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Submit')]`))
      await submitButton.click()

      await driver.waitUntilXWindowHandles(2)
      await driver.switchToWindow(dapp)
      await driver.delay(regularDelayMs)
    })

    it('has the ganache network id within the dapp', async () => {
      const networkDiv = await driver.findElement(By.css('#network'))
      await driver.delay(regularDelayMs)
      assert.equal(await networkDiv.getText(), '5777')
    })

    it('changes the network', async () => {
      await driver.switchToWindow(extension)

      const networkDropdown = await driver.findElement(By.css('.network-name'))
      await networkDropdown.click()
      await driver.delay(regularDelayMs)

      const ropstenButton = await driver.findElement(By.xpath(`//span[contains(text(), 'Ropsten')]`))
      await ropstenButton.click()
      await driver.delay(largeDelayMs)
    })

    it('sets the network div within the dapp', async () => {
      await driver.switchToWindow(dapp)
      const networkDiv = await driver.findElement(By.css('#network'))
      assert.equal(await networkDiv.getText(), '3')
    })

    it('sets the chainId div within the dapp', async () => {
      await driver.switchToWindow(dapp)
      const chainIdDiv = await driver.findElement(By.css('#chainId'))
      assert.equal(await chainIdDiv.getText(), '0x3')
    })

    it('sets the account div within the dapp', async () => {
      await driver.switchToWindow(dapp)
      const accountsDiv = await driver.findElement(By.css('#accounts'))
      assert.equal(await accountsDiv.getText(), publicAddress.toLowerCase())
    })
  })
})
