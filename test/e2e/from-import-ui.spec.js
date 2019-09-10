const assert = require('assert')
const webdriver = require('selenium-webdriver')
const { By, Key, until } = webdriver
const {
  delay,
} = require('./func')
const {
  checkBrowserForConsoleErrors,
  verboseReportOnFailure,
  findElement,
  findElements,
  setupFetchMocking,
  prepareExtensionForTesting,
} = require('./helpers')

describe('Using MetaMask with an existing account', function () {
  let driver

  const testSeedPhrase = 'forum vessel pink push lonely enact gentle tail admit parrot grunt dress'
  const testAddress = '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3'
  const testPrivateKey2 = '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6'
  const testPrivateKey3 = 'F4EC2590A0C10DE95FBF4547845178910E40F5035320C516A18C117DE02B5669'
  const tinyDelayMs = 200
  const regularDelayMs = 1000
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

  describe('First time flow starting from an existing seed phrase', () => {
    it('clicks the continue button on the welcome screen', async () => {
      await findElement(driver, By.css('.welcome-page__header'))
      const welcomeScreenBtn = await findElement(driver, By.css('.first-time-flow__button'))
      welcomeScreenBtn.click()
      await delay(largeDelayMs)
    })

    it('clicks the "Import Wallet" option', async () => {
      const customRpcButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Import Wallet')]`))
      customRpcButton.click()
      await delay(largeDelayMs)
    })

    it('clicks the "No thanks" option on the metametrics opt-in screen', async () => {
      const optOutButton = await findElement(driver, By.css('.btn-default'))
      optOutButton.click()
      await delay(largeDelayMs)
    })

    it('imports a seed phrase', async () => {
      const [seedTextArea] = await findElements(driver, By.css('textarea.first-time-flow__textarea'))
      await seedTextArea.sendKeys(testSeedPhrase)
      await delay(regularDelayMs)

      const [password] = await findElements(driver, By.id('password'))
      await password.sendKeys('correct horse battery staple')
      const [confirmPassword] = await findElements(driver, By.id('confirm-password'))
      confirmPassword.sendKeys('correct horse battery staple')

      const tosCheckBox = await findElement(driver, By.css('.first-time-flow__checkbox'))
      await tosCheckBox.click()

      const [importButton] = await findElements(driver, By.xpath(`//button[contains(text(), 'Import')]`))
      await importButton.click()
      await delay(regularDelayMs)
    })

    it('clicks through the success screen', async () => {
      await findElement(driver, By.xpath(`//div[contains(text(), 'Congratulations')]`))
      const doneButton = await findElement(driver, By.css('button.first-time-flow__button'))
      await doneButton.click()
      await delay(regularDelayMs)
    })
  })

  describe('Show account information', () => {
    it('shows the correct account address', async () => {
      await driver.findElement(By.css('.account-details__details-button')).click()
      await driver.findElement(By.css('.qr-wrapper')).isDisplayed()
      await delay(regularDelayMs)

      const [address] = await findElements(driver, By.css('input.qr-ellip-address'))
      assert.equal(await address.getAttribute('value'), testAddress)

      await driver.executeScript("document.querySelector('.account-modal-close').click()")
      await delay(largeDelayMs)
    })

    it('shows a QR code for the account', async () => {
      await driver.findElement(By.css('.account-details__details-button')).click()
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
      const [accountName] = await findElements(driver, By.css('.account-details__account-name'))
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
    it('starts a send transaction', async function () {
      const sendButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Send')]`))
      await sendButton.click()
      await delay(regularDelayMs)

      const inputAddress = await findElement(driver, By.css('input[placeholder="Search, public address (0x), or ENS"]'))
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970')

      const inputAmount = await findElement(driver, By.css('.unit-input__input'))
      await inputAmount.sendKeys('1')

      // Set the gas limit
      const configureGas = await findElement(driver, By.css('.advanced-gas-options-btn'))
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
      const transactions = await findElements(driver, By.css('.transaction-list-item'))
      assert.equal(transactions.length, 1)

      const txValues = await findElements(driver, By.css('.transaction-list-item__amount--primary'))
      assert.equal(txValues.length, 1)
      assert.ok(/-1\s*ETH/.test(await txValues[0].getText()))
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
      const [accountName] = await findElements(driver, By.css('.account-details__account-name'))
      assert.equal(await accountName.getText(), 'Account 4')
      await delay(regularDelayMs)
    })

    it('should show the imported label', async () => {
      const [importedLabel] = await findElements(driver, By.css('.account-details__keyring-label'))
      assert.equal(await importedLabel.getText(), 'IMPORTED')
      await delay(regularDelayMs)
    })
  })

  describe('Imports and removes an account', () => {
    it('choose Create Account from the account menu', async () => {
      await driver.findElement(By.css('.account-menu__icon')).click()
      await delay(regularDelayMs)

      const [importAccount] = await findElements(driver, By.xpath(`//div[contains(text(), 'Import Account')]`))
      await importAccount.click()
      await delay(regularDelayMs)
    })

    it('enter private key', async () => {
      const privateKeyInput = await findElement(driver, By.css('#private-key-box'))
      await privateKeyInput.sendKeys(testPrivateKey3)
      await delay(regularDelayMs)
      const importButtons = await findElements(driver, By.xpath(`//button[contains(text(), 'Import')]`))
      await importButtons[0].click()
      await delay(regularDelayMs)
    })

    it('should open the remove account modal', async () => {
      const [accountName] = await findElements(driver, By.css('.account-details__account-name'))
      assert.equal(await accountName.getText(), 'Account 5')
      await delay(regularDelayMs)

      await driver.findElement(By.css('.account-menu__icon')).click()
      await delay(regularDelayMs)

      const accountListItems = await findElements(driver, By.css('.account-menu__account'))
      assert.equal(accountListItems.length, 5)

      const removeAccountIcons = await findElements(driver, By.css('.remove-account-icon'))
      await removeAccountIcons[1].click()
      await delay(tinyDelayMs)

      await findElement(driver, By.css('.confirm-remove-account__account'))
    })

    it('should remove the account', async () => {
      const removeButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Remove')]`))
      await removeButton.click()

      await delay(regularDelayMs)

      const [accountName] = await findElements(driver, By.css('.account-details__account-name'))
      assert.equal(await accountName.getText(), 'Account 1')
      await delay(regularDelayMs)

      const accountListItems = await findElements(driver, By.css('.account-menu__account'))
      assert.equal(accountListItems.length, 4)
    })
  })

  describe('Connects to a Hardware wallet', () => {
    it('choose Connect Hardware Wallet from the account menu', async () => {
      const [connectAccount] = await findElements(driver, By.xpath(`//div[contains(text(), 'Connect Hardware Wallet')]`))
      await connectAccount.click()
      await delay(regularDelayMs)
    })

    it('should open the TREZOR Connect popup', async () => {
      const trezorButton = await findElements(driver, By.css('.hw-connect__btn'))
      await trezorButton[1].click()
      await delay(regularDelayMs)
      const connectButtons = await findElements(driver, By.xpath(`//button[contains(text(), 'Connect')]`))
      await connectButtons[0].click()
      await delay(regularDelayMs)
      const allWindows = await driver.getAllWindowHandles()
      assert.equal(allWindows.length, 2)
    })
  })
})
