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
  findElement,
  findElements,
  checkBrowserForConsoleErrors,
  loadExtension,
  verboseReportOnFailure,
} = require('./helpers')

describe('MetaMask', function () {
  let extensionId
  let driver
  let tokenAddress

  const testSeedPhrase = 'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent'
  const tinyDelayMs = 1000
  const regularDelayMs = tinyDelayMs * 2
  const largeDelayMs = regularDelayMs * 2
  const waitingNewPageDelayMs = regularDelayMs * 30

  this.timeout(0)
  this.bail(true)

  before(async function () {
    switch (process.env.SELENIUM_BROWSER) {
      case 'chrome': {
        const extPath = path.resolve('dist/chrome')
        driver = buildChromeWebDriver(extPath)
        extensionId = await getExtensionIdChrome(driver)
        await driver.get(`chrome-extension://${extensionId}/popup.html`)
        break
      }
      case 'firefox': {
        const extPath = path.resolve('dist/firefox')
        driver = buildFirefoxWebdriver()
        await installWebExt(driver, extPath)
        await delay(700)
        extensionId = await getExtensionIdFirefox(driver)
        await driver.get(`moz-extension://${extensionId}/popup.html`)
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
      await verboseReportOnFailure(this.currentTest)
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
      const networkSelector = await findElement(driver, By.css('#network_component'))
      await networkSelector.click()
      await delay(regularDelayMs)

      const localhost = await findElement(driver, By.xpath(`//li[contains(text(), 'Localhost')]`))
      await localhost.click()
      await delay(regularDelayMs)
    })

    it('selects the new UI option', async () => {
      const button = await findElement(driver, By.xpath("//p[contains(text(), 'Try Beta Version')]"))
      await button.click()
      await delay(regularDelayMs)

      // Close all other tabs
      let [oldUi, infoPage, newUi] = await driver.getAllWindowHandles()
      newUi = newUi || infoPage
      await driver.switchTo().window(oldUi)
      await driver.close()
      if (infoPage !== newUi) {
        await driver.switchTo().window(infoPage)
        await driver.close()
      }
      await driver.switchTo().window(newUi)
      await delay(regularDelayMs)

      const continueBtn = await findElement(driver, By.css('.welcome-screen__button'))
      await continueBtn.click()
      await delay(regularDelayMs)
    })
  })

  describe('Going through the first time flow', () => {
    it('accepts a secure password', async () => {
      const passwordBox = await findElement(driver, By.css('.create-password #create-password'))
      const passwordBoxConfirm = await findElement(driver, By.css('.create-password #confirm-password'))
      const button = await findElement(driver, By.css('.create-password button'))

      await passwordBox.sendKeys('correct horse battery staple')
      await passwordBoxConfirm.sendKeys('correct horse battery staple')
      await button.click()
      await delay(regularDelayMs)
    })

    it('clicks through the unique image screen', async () => {
      const nextScreen = await findElement(driver, By.css('.unique-image button'))
      await nextScreen.click()
      await delay(regularDelayMs)
    })

    it('clicks through the privacy notice', async () => {
      // terms of use
      const canClickThrough = await driver.findElement(By.css('.tou button')).isEnabled()
      assert.equal(canClickThrough, false, 'disabled continue button')
      const bottomOfTos = await findElement(driver, By.linkText('Attributions'))
      await driver.executeScript('arguments[0].scrollIntoView(true)', bottomOfTos)
      await delay(regularDelayMs)
      const acceptTos = await findElement(driver, By.css('.tou button'))
      await acceptTos.click()
      await delay(regularDelayMs)

      // privacy notice
      const nextScreen = await findElement(driver, By.css('.tou button'))
      await nextScreen.click()
      await delay(regularDelayMs)

      // phishing notice
      const nextScreen = await findElement(driver, By.css('.tou button'))
      await nextScreen.click()
      await delay(regularDelayMs)
    })

    let seedPhrase

    it('reveals the seed phrase', async () => {
      const revealSeedPhrase = await findElement(driver, By.css('.backup-phrase__secret-blocker'))
      await revealSeedPhrase.click()
      await delay(regularDelayMs)

      seedPhrase = await driver.findElement(By.css('.backup-phrase__secret-words')).getText()
      assert.equal(seedPhrase.split(' ').length, 12)
      await delay(regularDelayMs)

      const nextScreen = await findElement(driver, By.css('.backup-phrase button'))
      await nextScreen.click()
      await delay(regularDelayMs)
    })

    it('can retype the seed phrase', async () => {
      const words = seedPhrase.split(' ')

      const word0 = await findElement(driver, By.xpath(`//button[contains(text(), '${words[0]}')]`))
      await word0.click()
      await delay(tinyDelayMs)

      const word1 = await findElement(driver, By.xpath(`//button[contains(text(), '${words[1]}')]`))
      await word1.click()
      await delay(tinyDelayMs)

      const word2 = await findElement(driver, By.xpath(`//button[contains(text(), '${words[2]}')]`))
      await word2.click()
      await delay(tinyDelayMs)

      const word3 = await findElement(driver, By.xpath(`//button[contains(text(), '${words[3]}')]`))
      await word3.click()
      await delay(tinyDelayMs)

      const word4 = await findElement(driver, By.xpath(`//button[contains(text(), '${words[4]}')]`))
      await word4.click()
      await delay(tinyDelayMs)

      const word5 = await findElement(driver, By.xpath(`//button[contains(text(), '${words[5]}')]`))
      await word5.click()
      await delay(tinyDelayMs)

      const word6 = await findElement(driver, By.xpath(`//button[contains(text(), '${words[6]}')]`))
      await word6.click()
      await delay(tinyDelayMs)

      const word7 = await findElement(driver, By.xpath(`//button[contains(text(), '${words[7]}')]`))
      await word7.click()
      await delay(tinyDelayMs)

      const word8 = await findElement(driver, By.xpath(`//button[contains(text(), '${words[8]}')]`))
      await word8.click()
      await delay(tinyDelayMs)

      const word9 = await findElement(driver, By.xpath(`//button[contains(text(), '${words[9]}')]`))
      await word9.click()
      await delay(tinyDelayMs)

      const word10 = await findElement(driver, By.xpath(`//button[contains(text(), '${words[10]}')]`))
      await word10.click()
      await delay(tinyDelayMs)

      const word11 = await findElement(driver, By.xpath(`//button[contains(text(), '${words[11]}')]`))
      await word11.click()
      await delay(tinyDelayMs)

      const confirm = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirm.click()
      await delay(regularDelayMs)
    })

    it('clicks through the deposit modal', async () => {
      const buyModal = await driver.findElement(By.css('span .modal'))
      const closeModal = await findElement(driver, By.css('.page-container__header-close'))
      await closeModal.click()
      await driver.wait(until.stalenessOf(buyModal))
      await delay(regularDelayMs)
    })
  })

  describe('Show account information', () => {
    it('shows the QR code for the account', async () => {
      await driver.findElement(By.css('.wallet-view__details-button')).click()
      await driver.findElement(By.css('.qr-wrapper')).isDisplayed()
      await delay(regularDelayMs)

      await driver.executeScript("document.querySelector('.account-modal-close').click()")
      await delay(regularDelayMs * 4)
    })
  })

  describe('Log out an log back in', () => {
    it('logs out of the account', async () => {
      await driver.findElement(By.css('.account-menu__icon')).click()
      await delay(regularDelayMs)

      const logoutButton = await findElement(driver, By.css('.account-menu__logout-button'))
      assert.equal(await logoutButton.getText(), 'Log out')
      await logoutButton.click()
      await delay(regularDelayMs)
    })

    it('accepts the account password after lock', async () => {
      await driver.findElement(By.id('password')).sendKeys('correct horse battery staple')
      await driver.findElement(By.id('password')).sendKeys(Key.ENTER)
      await delay(regularDelayMs * 4)
    })
  })

  describe('Add account', () => {
    it('choose Create Account from the account menu', async () => {
      await driver.findElement(By.css('.account-menu__icon')).click()
      await delay(regularDelayMs)

      const createAccount = await findElement(driver, By.xpath(`//div[contains(text(), 'Create Account')]`))
      await createAccount.click()
      await delay(regularDelayMs)
    })

    it('set account name', async () => {
      const accountName = await findElement(driver, By.css('.new-account-create-form input'))
      await accountName.sendKeys('2nd account')
      await delay(regularDelayMs)

      const create = await findElement(driver, By.xpath(`//button[contains(text(), 'Create')]`))
      await create.click()
      await delay(regularDelayMs)
    })

    it('should correct account name', async () => {
      const accountName = await findElement(driver, By.css('.account-name'))
      assert.equal(await accountName.getText(), '2nd account')
      await delay(regularDelayMs)
    })
  })

  describe('Import seed phrase', () => {
    it('logs out of the vault', async () => {
      await driver.findElement(By.css('.account-menu__icon')).click()
      await delay(regularDelayMs)

      const logoutButton = await findElement(driver, By.css('.account-menu__logout-button'))
      assert.equal(await logoutButton.getText(), 'Log out')
      await logoutButton.click()
      await delay(regularDelayMs)
    })

    it('imports seed phrase', async () => {
      const restoreSeedLink = await findElement(driver, By.css('.unlock-page__link--import'))
      assert.equal(await restoreSeedLink.getText(), 'Import using account seed phrase')
      await restoreSeedLink.click()
      await delay(regularDelayMs)

      const seedTextArea = await findElement(driver, By.css('textarea'))
      await seedTextArea.sendKeys(testSeedPhrase)
      await delay(regularDelayMs)

      await driver.findElement(By.id('password-box')).sendKeys('correct horse battery staple')
      await driver.findElement(By.id('password-box-confirm')).sendKeys('correct horse battery staple')
      await driver.findElement(By.css('button:nth-child(2)')).click()
      await delay(regularDelayMs)
    })

    it('balance renders', async () => {
      const balance = await findElement(driver, By.css('.balance-display .token-amount'))
      const tokenAmount = await balance.getText()
      assert.equal(tokenAmount, '100.000 ETH')
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

      const save = await findElement(driver, By.xpath(`//button[contains(text(), 'Save')]`))
      await save.click()
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

  describe('Send ETH from Faucet', () => {
    it('starts a send transaction inside Faucet', async () => {
      await driver.executeScript('window.open("https://faucet.metamask.io")')
      await delay(waitingNewPageDelayMs)

      const [extension, faucet] = await driver.getAllWindowHandles()
      await driver.switchTo().window(faucet)
      await delay(regularDelayMs)

      const send1eth = await findElement(driver, By.xpath(`//button[contains(text(), '10 ether')]`), 14000)
      await send1eth.click()
      await delay(regularDelayMs)

      await driver.switchTo().window(extension)
      await loadExtension(driver, extensionId)
      await delay(regularDelayMs)

      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`), 14000)
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
      const addToken = await findElement(driver, By.xpath(`//button[contains(text(), 'Add Token')]`))
      await addToken.click()
      await delay(regularDelayMs)
    })

    it('can pick a token from the existing options', async () => {
      const tokenSearch = await findElement(driver, By.css('#search-tokens'))
      await tokenSearch.sendKeys('BAT')
      await delay(regularDelayMs)

      const token = await findElement(driver, By.xpath("//span[contains(text(), 'BAT')]"))
      await token.click()
      await delay(regularDelayMs)

      const nextScreen = await findElement(driver, By.xpath(`//button[contains(text(), 'Next')]`))
      await nextScreen.click()
      await delay(regularDelayMs)

      const addTokens = await findElement(driver, By.xpath(`//button[contains(text(), 'Add Tokens')]`))
      await addTokens.click()
      await delay(largeDelayMs)
    })

    it('renders the balance for the chosen token', async () => {
      const balance = await findElement(driver, By.css('.tx-view .balance-display .token-amount'))
      await driver.wait(until.elementTextIs(balance, '0BAT'))
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
      ] = await findElements(driver, By.css('.form-control'))

      await totalSupply.sendKeys('100')
      await tokenName.sendKeys('Test')
      await tokenDecimal.sendKeys('0')
      await tokenSymbol.sendKeys('TST')

      const createToken = await findElement(driver, By.xpath(`//button[contains(text(), 'Create Token')]`))
      await createToken.click()
      await delay(regularDelayMs)

      await driver.switchTo().window(extension)
      await loadExtension(driver, extensionId)
      await delay(regularDelayMs)

      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
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
      const addToken = await findElement(driver, By.xpath(`//button[contains(text(), 'Add Token')]`))
      await addToken.click()
      await delay(regularDelayMs)
    })

    it('picks the newly created Test token', async () => {
      const addCustomToken = await findElement(driver, By.xpath("//div[contains(text(), 'Custom Token')]"))
      await addCustomToken.click()
      await delay(regularDelayMs)

      const newTokenAddress = await findElement(driver, By.css('#custom-address'))
      await newTokenAddress.sendKeys(tokenAddress)
      await delay(regularDelayMs)

      const nextScreen = await findElement(driver, By.xpath(`//button[contains(text(), 'Next')]`))
      await nextScreen.click()
      await delay(regularDelayMs)

      const addTokens = await findElement(driver, By.xpath(`//button[contains(text(), 'Add Tokens')]`))
      await addTokens.click()
      await delay(regularDelayMs)
    })

    it('renders the balance for the new token', async () => {
      const balance = await findElement(driver, By.css('.tx-view .balance-display .token-amount'))
      await driver.wait(until.elementTextIs(balance, '100TST'))
      const tokenAmount = await balance.getText()
      assert.equal(tokenAmount, '100TST')
      await delay(regularDelayMs)
    })
  })
})
