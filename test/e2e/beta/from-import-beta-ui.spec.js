const path = require('path')
const assert = require('assert')
const webdriver = require('selenium-webdriver')
const { By, Key, until } = webdriver
const {
  delay,
  buildChromeWebDriver,
  buildFirefoxWebdriver,
  installWebExt,
  getExtensionIdChrome,
  getExtensionIdFirefox,
} = require('../func')
const {
  checkBrowserForConsoleErrors,
  closeAllWindowHandlesExcept,
  verboseReportOnFailure,
  findElement,
  findElements,
  loadExtension,
} = require('./helpers')


describe('Using MetaMask with an existing account', function () {
  let extensionId
  let driver

  const testSeedPhrase = 'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent'
  const testAddress = '0xE18035BF8712672935FDB4e5e431b1a0183d2DFC'
  const testPrivateKey2 = '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6'
  const tinyDelayMs = 500
  const regularDelayMs = 1000
  const largeDelayMs = regularDelayMs * 2

  this.timeout(0)
  this.bail(true)

  before(async function () {
    switch (process.env.SELENIUM_BROWSER) {
      case 'chrome': {
        const extensionPath = path.resolve('dist/chrome')
        driver = buildChromeWebDriver(extensionPath)
        extensionId = await getExtensionIdChrome(driver)
        await driver.get(`chrome-extension://${extensionId}/popup.html`)
        await delay(regularDelayMs)
        break
      }
      case 'firefox': {
        const extensionPath = path.resolve('dist/firefox')
        driver = buildFirefoxWebdriver()
        await installWebExt(driver, extensionPath)
        await delay(regularDelayMs)
        extensionId = await getExtensionIdFirefox(driver)
        await driver.get(`moz-extension://${extensionId}/popup.html`)
        await delay(regularDelayMs)
        break
      }
    }
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

  describe('New UI setup', async function () {
    it('switches to first tab', async function () {
      await delay(tinyDelayMs)
      const [firstTab] = await driver.getAllWindowHandles()
      await driver.switchTo().window(firstTab)
      await delay(regularDelayMs)
    })

    it('selects the new UI option', async () => {
      try {
        const overlay = await findElement(driver, By.css('.full-flex-height'))
        await driver.wait(until.stalenessOf(overlay))
      } catch (e) {}

      const button = await findElement(driver, By.xpath("//button[contains(text(), 'Try it now')]"))
      await button.click()
      await delay(regularDelayMs)

      // Close all other tabs
      const [tab0, tab1, tab2] = await driver.getAllWindowHandles()
      await driver.switchTo().window(tab0)
      await delay(tinyDelayMs)

      let selectedUrl = await driver.getCurrentUrl()
      await delay(tinyDelayMs)
      if (tab0 && selectedUrl.match(/popup.html/)) {
        await closeAllWindowHandlesExcept(driver, tab0)
      } else if (tab1) {
        await driver.switchTo().window(tab1)
        selectedUrl = await driver.getCurrentUrl()
        await delay(tinyDelayMs)
        if (selectedUrl.match(/popup.html/)) {
          await closeAllWindowHandlesExcept(driver, tab1)
        } else if (tab2) {
          await driver.switchTo().window(tab2)
          selectedUrl = await driver.getCurrentUrl()
          selectedUrl.match(/popup.html/) && await closeAllWindowHandlesExcept(driver, tab2)
        }
      } else {
        throw new Error('popup.html not found')
      }
      await delay(regularDelayMs)
      const [appTab] = await driver.getAllWindowHandles()
      await driver.switchTo().window(appTab)
      await delay(tinyDelayMs)

      await loadExtension(driver, extensionId)
      await delay(regularDelayMs)

      const continueBtn = await findElement(driver, By.css('.welcome-screen__button'))
      await continueBtn.click()
      await delay(regularDelayMs)
    })
  })

  describe('First time flow starting from an existing seed phrase', () => {
    it('imports a seed phrase', async () => {
      const [seedPhrase] = await findElements(driver, By.xpath(`//a[contains(text(), 'Import with seed phrase')]`))
      await seedPhrase.click()
      await delay(regularDelayMs)

      const [seedTextArea] = await findElements(driver, By.css('textarea.import-account__secret-phrase'))
      await seedTextArea.sendKeys(testSeedPhrase)
      await delay(regularDelayMs)

      const [password] = await findElements(driver, By.id('password'))
      await password.sendKeys('correct horse battery staple')
      const [confirmPassword] = await findElements(driver, By.id('confirm-password'))
      confirmPassword.sendKeys('correct horse battery staple')

      const [importButton] = await findElements(driver, By.xpath(`//button[contains(text(), 'Import')]`))
      await importButton.click()
      await delay(regularDelayMs)
    })

    it('clicks through the ToS', async () => {
      // terms of use
      const canClickThrough = await driver.findElement(By.css('.tou button')).isEnabled()
      assert.equal(canClickThrough, false, 'disabled continue button')
      const bottomOfTos = await findElement(driver, By.linkText('Attributions'))
      await driver.executeScript('arguments[0].scrollIntoView(true)', bottomOfTos)
      await delay(regularDelayMs)
      const acceptTos = await findElement(driver, By.css('.tou button'))
      await acceptTos.click()
      await delay(regularDelayMs)
    })

    it('clicks through the privacy notice', async () => {
      // privacy notice
      const nextScreen = await findElement(driver, By.css('.tou button'))
      await nextScreen.click()
      await delay(regularDelayMs)
    })

    it('clicks through the phishing notice', async () => {
      // phishing notice
      const noticeElement = await driver.findElement(By.css('.markdown'))
      await driver.executeScript('arguments[0].scrollTop = arguments[0].scrollHeight', noticeElement)
      await delay(regularDelayMs)
      const nextScreen = await findElement(driver, By.css('.tou button'))
      await nextScreen.click()
      await delay(regularDelayMs)
    })
  })

  describe('Show account information', () => {
    it('shows the correct account address', async () => {
      await driver.findElement(By.css('.wallet-view__details-button')).click()
      await driver.findElement(By.css('.qr-wrapper')).isDisplayed()
      await delay(regularDelayMs)

      const [address] = await findElements(driver, By.css('input.qr-ellip-address'))
      assert.equal(await address.getAttribute('value'), testAddress)

      await driver.executeScript("document.querySelector('.account-modal-close').click()")
      await delay(largeDelayMs)
    })

    it('shows a QR code for the account', async () => {
      await driver.findElement(By.css('.wallet-view__details-button')).click()
      await driver.findElement(By.css('.qr-wrapper')).isDisplayed()
      const detailModal = await driver.findElement(By.css('span .modal'))
      await delay(regularDelayMs)

      await driver.executeScript("document.querySelector('.account-modal-close').click()")
      await driver.wait(until.stalenessOf(detailModal))
      await delay(regularDelayMs)
    })
  })

  describe('Log out and log back in', () => {
    it('logs out of the account', async () => {
      const accountIdenticon = driver.findElement(By.css('.account-menu__icon .identicon'))
      accountIdenticon.click()
      await delay(regularDelayMs)

      const [logoutButton] = await findElements(driver, By.css('.account-menu__logout-button'))
      assert.equal(await logoutButton.getText(), 'Log out')
      await logoutButton.click()
      await delay(regularDelayMs)
    })

    it('accepts the account password after lock', async () => {
      await driver.findElement(By.id('password')).sendKeys('correct horse battery staple')
      await driver.findElement(By.id('password')).sendKeys(Key.ENTER)
      await delay(largeDelayMs)
    })
  })

  describe('Add an account', () => {
    it('switches to localhost', async () => {
      const networkDropdown = await findElement(driver, By.css('.network-name'))
      await networkDropdown.click()
      await delay(regularDelayMs)

      const [localhost] = await findElements(driver, By.xpath(`//span[contains(text(), 'Localhost')]`))
      await localhost.click()
      await delay(largeDelayMs)
    })

    it('choose Create Account from the account menu', async () => {
      await driver.findElement(By.css('.account-menu__icon')).click()
      await delay(regularDelayMs)

      const [createAccount] = await findElements(driver, By.xpath(`//div[contains(text(), 'Create Account')]`))
      await createAccount.click()
      await delay(regularDelayMs)
    })

    it('set account name', async () => {
      const [accountName] = await findElements(driver, By.css('.new-account-create-form input'))
      await accountName.sendKeys('2nd account')
      await delay(regularDelayMs)

      const [createButton] = await findElements(driver, By.xpath(`//button[contains(text(), 'Create')]`))
      await createButton.click()
      await delay(regularDelayMs)
    })

    it('should show the correct account name', async () => {
      const [accountName] = await findElements(driver, By.css('.account-name'))
      assert.equal(await accountName.getText(), '2nd account')
      await delay(regularDelayMs)
    })
  })

  describe('Switch back to original account', () => {
    it('chooses the original account from the account menu', async () => {
      await driver.findElement(By.css('.account-menu__icon')).click()
      await delay(regularDelayMs)

      const [originalAccountMenuItem] = await findElements(driver, By.css('.account-menu__name'))
      await originalAccountMenuItem.click()
      await delay(regularDelayMs)
    })
  })

  describe('Send ETH from inside MetaMask', () => {
    it('starts to send a transaction', async function () {
      const sendButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Send')]`))
      await sendButton.click()
      await delay(regularDelayMs)

      const inputAddress = await findElement(driver, By.css('input[placeholder="Recipient Address"]'))
      const inputAmount = await findElement(driver, By.css('.currency-display__input'))
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970')
      await inputAmount.sendKeys('1')

      // Set the gas limit
      const configureGas = await findElement(driver, By.css('.send-v2__gas-fee-display button'))
      await configureGas.click()
      await delay(regularDelayMs)

      const gasModal = await driver.findElement(By.css('span .modal'))
      const save = await findElement(driver, By.xpath(`//button[contains(text(), 'Save')]`))
      await save.click()
      await driver.wait(until.stalenessOf(gasModal))
      await delay(regularDelayMs)

      // Continue to next screen
      const nextScreen = await findElement(driver, By.xpath(`//button[contains(text(), 'Next')]`))
      await nextScreen.click()
      await delay(regularDelayMs)
    })

    it('confirms the transaction', async function () {
      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await delay(regularDelayMs)
    })

    it('finds the transaction in the transactions list', async function () {
      const transactions = await findElements(driver, By.css('.tx-list-item'))
      assert.equal(transactions.length, 1)

      const txValues = await findElements(driver, By.css('.tx-list-value'))
      assert.equal(txValues.length, 1)
      assert.equal(await txValues[0].getText(), '1 ETH')
    })
  })

  describe('Imports an account with private key', () => {
    it('choose Create Account from the account menu', async () => {
      await driver.findElement(By.css('.account-menu__icon')).click()
      await delay(regularDelayMs)

      const [importAccount] = await findElements(driver, By.xpath(`//div[contains(text(), 'Import Account')]`))
      await importAccount.click()
      await delay(regularDelayMs)
    })

    it('enter private key', async () => {
      const privateKeyInput = await findElement(driver, By.css('#private-key-box'))
      await privateKeyInput.sendKeys(testPrivateKey2)
      await delay(regularDelayMs)
      const importButtons = await findElements(driver, By.xpath(`//button[contains(text(), 'Import')]`))
      await importButtons[0].click()
      await delay(regularDelayMs)
    })

    it('should show the correct account name', async () => {
      const [accountName] = await findElements(driver, By.css('.account-name'))
      assert.equal(await accountName.getText(), 'Account 3')
      await delay(regularDelayMs)
    })

    it('should show the imported label', async () => {
      const [importedLabel] = await findElements(driver, By.css('.wallet-view__keyring-label'))
      assert.equal(await importedLabel.getText(), 'IMPORTED')
      await delay(regularDelayMs)
    })
  })

  describe('Connects to a Hardware wallet', () => {
    it('choose Connect Hardware Wallet from the account menu', async () => {
      await driver.findElement(By.css('.account-menu__icon')).click()
      await delay(regularDelayMs)

      const [connectAccount] = await findElements(driver, By.xpath(`//div[contains(text(), 'Connect Hardware Wallet')]`))
      await connectAccount.click()
      await delay(regularDelayMs)
    })

    it('should open the TREZOR Connect popup', async () => {
      const connectButtons = await findElements(driver, By.xpath(`//button[contains(text(), 'Connect to Trezor')]`))
      await connectButtons[0].click()
      await delay(regularDelayMs)
      const allWindows = await driver.getAllWindowHandles()
      switch (process.env.SELENIUM_BROWSER) {
        case 'chrome':
          assert.equal(allWindows.length, 2)
          break
        default:
          assert.equal(allWindows.length, 1)
      }
    })

    it('should show the "Browser not supported" screen for non Chrome browsers', async () => {
      if (process.env.SELENIUM_BROWSER !== 'chrome') {
        const title = await findElements(driver, By.xpath(`//h3[contains(text(), 'Your Browser is not supported...')]`))
        assert.equal(title.length, 1)

        const downloadChromeButtons = await findElements(driver, By.xpath(`//button[contains(text(), 'Download Google Chrome')]`))
        assert.equal(downloadChromeButtons.length, 1)

        await downloadChromeButtons[0].click()
        await delay(regularDelayMs)

        const [newUITab, downloadChromeTab] = await driver.getAllWindowHandles()

        await driver.switchTo().window(downloadChromeTab)
        await delay(regularDelayMs)
        const tabUrl = await driver.getCurrentUrl()
        assert.equal(tabUrl, 'https://www.google.com/chrome/')
        await driver.close()
        await delay(regularDelayMs)
        await driver.switchTo().window(newUITab)
      }
    })
  })
})
