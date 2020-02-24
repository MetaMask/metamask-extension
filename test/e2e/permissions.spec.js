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
    await driver.quit()
  })

  describe('Going through the first time flow, but skipping the seed phrase challenge', function () {
    it('clicks the continue button on the welcome screen', async function () {
      await driver.findElement(By.css('.welcome-page__header'))
      await driver.clickElement(By.xpath(`//button[contains(text(), '${enLocaleMessages.getStarted.message}')]`))
      await driver.delay(largeDelayMs)
    })

    it('clicks the "Create New Wallet" option', async function () {
      await driver.clickElement(By.xpath(`//button[contains(text(), 'Create a Wallet')]`))
      await driver.delay(largeDelayMs)
    })

    it('clicks the "No thanks" option on the metametrics opt-in screen', async function () {
      await driver.clickElement(By.css('.btn-default'))
      await driver.delay(largeDelayMs)
    })

    it('accepts a secure password', async function () {
      const passwordBox = await driver.findElement(By.css('.first-time-flow__form #create-password'))
      const passwordBoxConfirm = await driver.findElement(By.css('.first-time-flow__form #confirm-password'))

      await passwordBox.sendKeys('correct horse battery staple')
      await passwordBoxConfirm.sendKeys('correct horse battery staple')

      await driver.clickElement(By.css('.first-time-flow__checkbox'))

      await driver.clickElement(By.css('.first-time-flow__form button'))
      await driver.delay(largeDelayMs)
    })

    it('skips the seed phrase challenge', async function () {
      await driver.clickElement(By.xpath(`//button[contains(text(), '${enLocaleMessages.remindMeLater.message}')]`))
      await driver.delay(regularDelayMs)

      await driver.clickElement(By.css('.account-details__details-button'))
      await driver.delay(regularDelayMs)
    })

    it('gets the current accounts address', async function () {
      const addressInput = await driver.findElement(By.css('.qr-ellip-address'))
      publicAddress = await addressInput.getAttribute('value')
      const accountModal = await driver.findElement(By.css('span .modal'))

      await driver.clickElement(By.css('.account-modal-close'))

      await driver.wait(until.stalenessOf(accountModal))
      await driver.delay(regularDelayMs)
    })
  })

  describe('sets permissions', function () {
    let extension
    let popup
    let dapp

    it('connects to the dapp', async function () {
      await driver.openNewPage('http://127.0.0.1:8080/')
      await driver.delay(regularDelayMs)

      await driver.clickElement(By.xpath(`//button[contains(text(), 'Connect')]`))

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
      await driver.switchToWindow(extension)
      await driver.delay(regularDelayMs)
    })

    it('shows connected sites', async function () {
      await driver.clickElement(By.xpath(`//button[contains(text(), 'Connected Sites')]`))

      await driver.findElement(By.css('.connected-sites__title'))

      const domains = await driver.findClickableElements(By.css('.connected-sites-list__domain'))
      assert.equal(domains.length, 1)

      const domainName = await driver.findElement(By.css('.connected-sites-list__domain-name'))
      assert.equal(await domainName.getText(), 'E2E Test Dapp')

      await domains[0].click()

      const permissionDescription = await driver.findElement(By.css('.connected-sites-list__permission-description'))
      assert.equal(await permissionDescription.getText(), 'View the address of the selected account')
    })

    it('can get accounts within the dapp', async function () {
      await driver.switchToWindow(dapp)
      await driver.delay(regularDelayMs)

      await driver.clickElement(By.xpath(`//button[contains(text(), 'eth_accounts')]`))

      const getAccountsResult = await driver.findElement(By.css('#getAccountsResult'))
      assert.equal((await getAccountsResult.getText()).toLowerCase(), publicAddress.toLowerCase())
    })

    it('can disconnect all accounts', async function () {
      await driver.switchToWindow(extension)

      await driver.clickElement(By.xpath(`//button[contains(text(), 'Disconnect All')]`))

      const disconnectModal = await driver.findElement(By.css('span .modal'))

      await driver.clickElement(By.css('.disconnect-all-modal .btn-danger'))

      await driver.wait(until.stalenessOf(disconnectModal))
      await driver.delay(regularDelayMs)
    })

    it('can no longer get accounts within the dapp', async function () {
      await driver.switchToWindow(dapp)
      await driver.delay(regularDelayMs)

      await driver.clickElement(By.xpath(`//button[contains(text(), 'eth_accounts')]`))

      const getAccountsResult = await driver.findElement(By.css('#getAccountsResult'))
      assert.equal(await getAccountsResult.getText(), 'Not able to get accounts')
    })
  })
})
