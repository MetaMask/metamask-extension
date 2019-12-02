const assert = require('assert')
const webdriver = require('selenium-webdriver')
const { By, until } = webdriver
const {
  delay,
} = require('./func')
const {
  checkBrowserForConsoleErrors,
  findElement,
  findElements,
  openNewPage,
  verboseReportOnFailure,
  waitUntilXWindowHandles,
  switchToWindowWithTitle,
  setupFetchMocking,
  prepareExtensionForTesting,
} = require('./helpers')
const enLocaleMessages = require('../../app/_locales/en/messages.json')

describe('MetaMask', function () {
  let driver
  let publicAddress

  const tinyDelayMs = 200
  const regularDelayMs = tinyDelayMs * 2
  const largeDelayMs = regularDelayMs * 2

  this.timeout(0)
  this.bail(true)

  before(async function () {
    const result = await prepareExtensionForTesting()
    driver = result.driver
    await setupFetchMocking(driver)
  })

  afterEach(async function () {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      const errors = await checkBrowserForConsoleErrors(driver)
      if (errors.length) {
        const errorReports = errors.map(err => err.message)
        const errorMessage = `Errors found in browser console:\n${errorReports.join('\n')}`
        console.error(new Error(errorMessage))
      }
    }
    if (this.currentTest.state === 'failed') {
      await verboseReportOnFailure(driver, this.currentTest)
    }
  })

  after(async function () {
    await driver.quit()
  })

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
      publicAddress = await addressInput.getAttribute('value')
      const accountModal = await driver.findElement(By.css('span .modal'))

      await driver.executeScript("document.querySelector('.account-modal-close').click()")

      await driver.wait(until.stalenessOf(accountModal))
      await delay(regularDelayMs)
    })
  })

  describe('sets permissions', () => {
    let extension
    let popup
    let dapp

    it('connects to the dapp', async () => {
      await openNewPage(driver, 'http://127.0.0.1:8080/')
      await delay(regularDelayMs)

      const connectButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Connect')]`))
      await connectButton.click()

      await waitUntilXWindowHandles(driver, 3)
      const windowHandles = await driver.getAllWindowHandles()

      extension = windowHandles[0]
      dapp = await switchToWindowWithTitle(driver, 'E2E Test Dapp', windowHandles)
      popup = windowHandles.find(handle => handle !== extension && handle !== dapp)

      await driver.switchTo().window(popup)

      await delay(regularDelayMs)

      const accountButton = await findElement(driver, By.css('.permissions-connect-choose-account__account'))
      await accountButton.click()

      const submitButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Submit')]`))
      await submitButton.click()

      await waitUntilXWindowHandles(driver, 2)
      await driver.switchTo().window(extension)
      await delay(regularDelayMs)
    })

    it('shows connected sites', async () => {
      const connectedSites = await findElement(driver, By.xpath(`//button[contains(text(), 'Connected Sites')]`))
      await connectedSites.click()

      await findElement(driver, By.css('.connected-sites__title'))

      const domains = await findElements(driver, By.css('.connected-sites-list__domain'))
      assert.equal(domains.length, 1)

      const domainName = await findElement(driver, By.css('.connected-sites-list__domain-name'))
      assert.equal(await domainName.getText(), 'E2E Test Dapp')

      await domains[0].click()

      const permissionDescription = await findElement(driver, By.css('.connected-sites-list__permission-description'))
      assert.equal(await permissionDescription.getText(), 'View the address of the selected account')
    })

    it('can get accounts within the dapp', async () => {
      await driver.switchTo().window(dapp)
      await delay(regularDelayMs)

      const getAccountsButton = await findElement(driver, By.xpath(`//button[contains(text(), 'eth_accounts')]`))
      await getAccountsButton.click()

      const getAccountsResult = await findElement(driver, By.css('#getAccountsResult'))
      assert.equal((await getAccountsResult.getText()).toLowerCase(), publicAddress.toLowerCase())
    })

    it('can disconnect all accounts', async () => {
      await driver.switchTo().window(extension)

      const disconnectAllButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Disconnect All')]`))
      await disconnectAllButton.click()

      const disconnectModal = await driver.findElement(By.css('span .modal'))

      const disconnectAllModalButton = await findElement(driver, By.css('.disconnect-all-modal .btn-danger'))
      await disconnectAllModalButton.click()

      await driver.wait(until.stalenessOf(disconnectModal))
      await delay(regularDelayMs)
    })

    it('can no longer get accounts within the dapp', async () => {
      await driver.switchTo().window(dapp)
      await delay(regularDelayMs)

      const getAccountsButton = await findElement(driver, By.xpath(`//button[contains(text(), 'eth_accounts')]`))
      await getAccountsButton.click()

      const getAccountsResult = await findElement(driver, By.css('#getAccountsResult'))
      assert.equal(await getAccountsResult.getText(), 'Not able to get accounts')
    })
  })
})
