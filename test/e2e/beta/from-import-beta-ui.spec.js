const path = require('path')
const assert = require('assert')
const webdriver = require('selenium-webdriver')
const { By, Key } = webdriver
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
  loadExtension,
  verboseReportOnFailure,
} = require('./helpers')

describe('Using MetaMask with an existing account', function () {
  let extensionId
  let driver
  let tokenAddress

  const testSeedPhrase = 'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent'
  const testAddress = '0xE18035BF8712672935FDB4e5e431b1a0183d2DFC'
  const regularDelayMs = 1000
  const largeDelayMs = regularDelayMs * 2
  const waitingNewPageDelayMs = regularDelayMs * 10

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
      const [firstTab] = await driver.getAllWindowHandles()
      await driver.switchTo().window(firstTab)
      await delay(regularDelayMs)
    })

    it('use the local network', async function () {
      const [networkSelector] = await driver.findElements(By.css('#network_component'))
      await networkSelector.click()
      await delay(regularDelayMs)

      const [localhost] = await driver.findElements(By.xpath(`//li[contains(text(), 'Localhost')]`))
      await localhost.click()
      await delay(regularDelayMs)
    })

    it('selects the new UI option', async () => {
      const button = await driver.findElement(By.xpath("//p[contains(text(), 'Try Beta Version')]"))
      await button.click()
      await delay(regularDelayMs)

      // Close all other tabs
      const [oldUi, newUi] = await driver.getAllWindowHandles()
      await driver.switchTo().window(oldUi)
      await driver.close()
      await driver.switchTo().window(newUi)
      await delay(regularDelayMs)

      const [continueBtn] = await driver.findElements(By.css('.welcome-screen__button'))
      await continueBtn.click()
      await delay(regularDelayMs)
    })
  })

  describe('First time flow starting from an existing seed phrase', () => {
    it('imports a seed phrase', async () => {
      const [seedPhrase] = await driver.findElements(By.xpath(`//a[contains(text(), 'Import with seed phrase')]`))
      await seedPhrase.click()
      await delay(regularDelayMs)

      const [seedTextArea] = await driver.findElements(By.css('textarea.import-account__secret-phrase'))
      await seedTextArea.sendKeys(testSeedPhrase)
      await delay(regularDelayMs)

      const [password] = await driver.findElements(By.id('password'))
      await password.sendKeys('correct horse battery staple')
      const [confirmPassword] = await driver.findElements(By.id('confirm-password'))
      confirmPassword.sendKeys('correct horse battery staple')

      const [importButton] = await driver.findElements(By.xpath(`//button[contains(text(), 'Import')]`))
      await importButton.click()
      await delay(regularDelayMs)
    })

    it('clicks through the privacy notice', async () => {
      const [nextScreen] = await driver.findElements(By.css('.tou button'))
      await nextScreen.click()
      await delay(regularDelayMs)

      const canClickThrough = await driver.findElement(By.css('.tou button')).isEnabled()
      assert.equal(canClickThrough, false, 'disabled continue button')
      const element = await driver.findElement(By.linkText('Attributions'))
      await driver.executeScript('arguments[0].scrollIntoView(true)', element)
      await delay(regularDelayMs)

      const [acceptTos] = await driver.findElements(By.css('.tou button'))
      await acceptTos.click()
      await delay(regularDelayMs)
    })
  })

  describe('Show account information', () => {
    it('shows the correct account address', async () => {
      await driver.findElement(By.css('.wallet-view__details-button')).click()
      await driver.findElement(By.css('.qr-wrapper')).isDisplayed()
      await delay(regularDelayMs)

      const [address] = await driver.findElements(By.css('input.qr-ellip-address'))
      assert.equal(await address.getAttribute('value'), testAddress)

      await driver.executeScript("document.querySelector('.account-modal-close').click()")
      await delay(largeDelayMs)
    })

    it('shows a QR code for the account', async () => {
      await driver.findElement(By.css('.wallet-view__details-button')).click()
      await driver.findElement(By.css('.qr-wrapper')).isDisplayed()
      await delay(regularDelayMs)

      await driver.executeScript("document.querySelector('.account-modal-close').click()")
      await delay(regularDelayMs)
    })
  })

  describe('Log out and log back in', () => {
    it('logs out of the account', async () => {
      await driver.findElement(By.css('.account-menu__icon')).click()
      await delay(regularDelayMs)

      const [logoutButton] = await driver.findElements(By.css('.account-menu__logout-button'))
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
    it('choose Create Account from the account menu', async () => {
      await driver.findElement(By.css('.account-menu__icon')).click()
      await delay(regularDelayMs)

      const [createAccount] = await driver.findElements(By.xpath(`//div[contains(text(), 'Create Account')]`))
      await createAccount.click()
      await delay(regularDelayMs)
    })

    it('set account name', async () => {
      const [accountName] = await driver.findElements(By.css('.new-account-create-form input'))
      await accountName.sendKeys('2nd account')
      await delay(regularDelayMs)

      const [createButton] = await driver.findElements(By.xpath(`//button[contains(text(), 'Create')]`))
      await createButton.click()
      await delay(regularDelayMs)
    })

    it('should show the correct account name', async () => {
      const [accountName] = await driver.findElements(By.css('.account-name'))
      assert.equal(await accountName.getText(), '2nd account')
      await delay(regularDelayMs)
    })
  })

  describe('Switch back to original account', () => {
    it('chooses the original account from the account menu', async () => {
      await driver.findElement(By.css('.account-menu__icon')).click()
      await delay(regularDelayMs)

      const [originalAccountMenuItem] = await driver.findElements(By.css('.account-menu__name'))
      await originalAccountMenuItem.click()
      await delay(regularDelayMs)
    })
  })

  describe('Send ETH from inside MetaMask', () => {
    it('starts to send a transaction', async function () {
      const [sendButton] = await driver.findElements(By.xpath(`//button[contains(text(), 'Send')]`))
      await sendButton.click()
      await delay(regularDelayMs)

      const [inputAddress] = await driver.findElements(By.css('input[placeholder="Recipient Address"]'))
      const [inputAmount] = await driver.findElements(By.css('.currency-display__input'))
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970')
      await inputAmount.sendKeys('1')

      // Set the gas limit
      const [configureGas] = await driver.findElements(By.css('.send-v2__gas-fee-display button'))
      await configureGas.click()
      await delay(regularDelayMs)

      const [save] = await driver.findElements(By.xpath(`//button[contains(text(), 'Save')]`))
      await save.click()
      await delay(regularDelayMs)

      // Continue to next screen
      const [nextScreen] = await driver.findElements(By.xpath(`//button[contains(text(), 'Next')]`))
      await nextScreen.click()
      await delay(regularDelayMs)
    })

    it('confirms the transaction', async function () {
      const [confirmButton] = await driver.findElements(By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await delay(regularDelayMs)
    })

    it('finds the transaction in the transactions list', async function () {
      const transactions = await driver.findElements(By.css('.tx-list-item'))
      assert.equal(transactions.length, 1)

      const txValues = await driver.findElements(By.css('.tx-list-value'))
      assert.equal(txValues.length, 1)
      assert.equal(await txValues[0].getText(), '1 ETH')
    })
  })

  describe('Send ETH from Faucet', () => {
    it('starts a send transaction inside Faucet', async () => {
      await driver.executeScript('window.open("https://faucet.metamask.io")')
      await delay(waitingNewPageDelayMs)

      const [extension, faucet] = await driver.getAllWindowHandles()
      await driver.switchTo().window(faucet)
      await delay(regularDelayMs)

      const [send1eth] = await driver.findElements(By.xpath(`//button[contains(text(), '10 ether')]`))
      await send1eth.click()
      await delay(regularDelayMs)

      await driver.switchTo().window(extension)
      await loadExtension(driver, extensionId)
      await delay(regularDelayMs)

      const [confirmButton] = await driver.findElements(By.xpath(`//button[contains(text(),'Confirm')]`))
      await confirmButton.click()
      await delay(regularDelayMs)

      await driver.switchTo().window(faucet)
      await delay(regularDelayMs)
      await driver.close()
      await delay(regularDelayMs)
      await driver.switchTo().window(extension)
      await delay(regularDelayMs)
      await loadExtension(driver, extensionId)
      await delay(regularDelayMs)
    })
  })

  describe('Add existing token using search', () => {
    it('clicks on the Add Token button', async () => {
      const [addToken] = await driver.findElements(By.xpath(`//button[contains(text(), 'Add Token')]`))
      await addToken.click()
      await delay(regularDelayMs)
    })

    it('picks an existing token', async () => {
      const [tokenSearch] = await driver.findElements(By.css('#search-tokens'))
      await tokenSearch.sendKeys('BAT')
      await delay(regularDelayMs)

      const [token] = await driver.findElements(By.xpath("//span[contains(text(), 'BAT')]"))
      await token.click()
      await delay(regularDelayMs)

      const [nextScreen] = await driver.findElements(By.xpath(`//button[contains(text(), 'Next')]`))
      await nextScreen.click()
      await delay(regularDelayMs)

      const [addTokens] = await driver.findElements(By.xpath(`//button[contains(text(), 'Add Tokens')]`))
      await addTokens.click()
      await delay(largeDelayMs)
    })

    it('renders the balance for the new token', async () => {
      const balance = await driver.findElement(By.css('.tx-view .balance-display .token-amount'))
      const tokenAmount = await balance.getText()
      assert.equal(tokenAmount, '0BAT')
      await delay(regularDelayMs)
    })
  })

  describe('Add a custom token from TokenFactory', () => {
    it('creates a new token', async () => {
      await driver.executeScript('window.open("https://tokenfactory.surge.sh/#/factory")')
      await delay(waitingNewPageDelayMs)

      const [extension, tokenFactory] = await driver.getAllWindowHandles()
      await driver.switchTo().window(tokenFactory)
      const [
        totalSupply,
        tokenName,
        tokenDecimal,
        tokenSymbol,
      ] = await driver.findElements(By.css('.form-control'))

      await totalSupply.sendKeys('100')
      await tokenName.sendKeys('Test')
      await tokenDecimal.sendKeys('0')
      await tokenSymbol.sendKeys('TST')

      const [createToken] = await driver.findElements(By.xpath(`//button[contains(text(), 'Create Token')]`))
      await createToken.click()
      await delay(regularDelayMs)

      await driver.switchTo().window(extension)
      await loadExtension(driver, extensionId)
      await delay(regularDelayMs)

      const [confirmButton] = await driver.findElements(By.xpath(`//button[contains(text(),'Confirm')]`))
      await confirmButton.click()
      await delay(regularDelayMs)

      await driver.switchTo().window(tokenFactory)
      await delay(regularDelayMs)
      const tokenContactAddress = await driver.findElement(By.css('div > div > div:nth-child(2) > span:nth-child(3)'))
      tokenAddress = await tokenContactAddress.getText()
      await driver.close()
      await driver.switchTo().window(extension)
      await loadExtension(driver, extensionId)
      await delay(regularDelayMs)
    })

    it('clicks on the Add Token button', async () => {
      const [addToken] = await driver.findElements(By.xpath(`//button[contains(text(), 'Add Token')]`))
      await addToken.click()
      await delay(regularDelayMs)
    })

    it('picks the new Test token', async () => {
      const [addCustomToken] = await driver.findElements(By.xpath("//div[contains(text(), 'Custom Token')]"))
      await addCustomToken.click()
      await delay(regularDelayMs)

      const [newTokenAddress] = await driver.findElements(By.css('#custom-address'))
      await newTokenAddress.sendKeys(tokenAddress)
      await delay(regularDelayMs)

      const [nextScreen] = await driver.findElements(By.xpath(`//button[contains(text(), 'Next')]`))
      await nextScreen.click()
      await delay(regularDelayMs)

      const [addTokens] = await driver.findElements(By.xpath(`//button[contains(text(), 'Add Tokens')]`))
      await addTokens.click()
      await delay(regularDelayMs)
    })

    it('renders the balance for the new token', async () => {
      const [balance] = await driver.findElements(By.css('.tx-view .balance-display .token-amount'))
      const tokenAmount = await balance.getText()
      assert.equal(tokenAmount, '100TST')
      await delay(regularDelayMs)
    })
  })
})
