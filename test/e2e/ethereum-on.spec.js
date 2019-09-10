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
      const welcomeScreenBtn = await findElement(driver, By.css('.first-time-flow__button'))
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
      const buttons = await findElements(driver, By.css('.first-time-flow__button'))
      await buttons[0].click()
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

  describe('provider listening for events', () => {
    let extension
    let popup
    let dapp
    it('switches to a dapp', async () => {
      await openNewPage(driver, 'http://127.0.0.1:8080/')
      await delay(regularDelayMs)

      await waitUntilXWindowHandles(driver, 3)
      const windowHandles = await driver.getAllWindowHandles()

      extension = windowHandles[0]
      popup = await switchToWindowWithTitle(driver, 'MetaMask Notification', windowHandles)
      dapp = windowHandles.find(handle => handle !== extension && handle !== popup)

      await delay(regularDelayMs)
      const approveButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Connect')]`))
      await approveButton.click()

      await driver.switchTo().window(dapp)
      await delay(regularDelayMs)
    })

    it('has not set the network within the dapp', async () => {
      const networkDiv = await findElement(driver, By.css('#network'))
      assert.equal(await networkDiv.getText(), '')
    })

    it('changes the network', async () => {
      await driver.switchTo().window(extension)

      const networkDropdown = await findElement(driver, By.css('.network-name'))
      await networkDropdown.click()
      await delay(regularDelayMs)

      const ropstenButton = await findElement(driver, By.xpath(`//span[contains(text(), 'Ropsten')]`))
      await ropstenButton.click()
      await delay(largeDelayMs)
    })

    it('sets the network div within the dapp', async () => {
      await driver.switchTo().window(dapp)
      const networkDiv = await findElement(driver, By.css('#network'))
      assert.equal(await networkDiv.getText(), '3')
    })

    it('sets the chainId div within the dapp', async () => {
      await driver.switchTo().window(dapp)
      const chainIdDiv = await findElement(driver, By.css('#chainId'))
      assert.equal(await chainIdDiv.getText(), '0x3')
    })

    it('sets the account div within the dapp', async () => {
      await driver.switchTo().window(dapp)
      const accountsDiv = await findElement(driver, By.css('#accounts'))
      assert.equal(await accountsDiv.getText(), publicAddress.toLowerCase())
    })
  })
})
