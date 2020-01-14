const assert = require('assert')
const webdriver = require('selenium-webdriver')

const { By, Key, until } = webdriver
const {
  tinyDelayMs,
  regularDelayMs,
  largeDelayMs,
} = require('./helpers')
const { buildWebDriver } = require('./webdriver')
const Ganache = require('./ganache')
const enLocaleMessages = require('../../app/_locales/en/messages.json')

const ganacheServer = new Ganache()

describe('MetaMask', function () {
  let driver
  let tokenAddress

  const testSeedPhrase = 'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent'

  this.timeout(0)
  this.bail(true)

  before(async function () {
    await ganacheServer.start()
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

  describe('Going through the first time flow', () => {
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
      await driver.delay(regularDelayMs)
    })

    let seedPhrase

    it('reveals the seed phrase', async () => {
      const byRevealButton = By.css('.reveal-seed-phrase__secret-blocker .reveal-seed-phrase__reveal-button')
      await driver.findElement(byRevealButton)
      const revealSeedPhraseButton = await driver.findElement(byRevealButton)
      await revealSeedPhraseButton.click()
      await driver.delay(regularDelayMs)

      const revealedSeedPhrase = await driver.findElement(By.css('.reveal-seed-phrase__secret-words'))
      seedPhrase = await revealedSeedPhrase.getText()
      assert.equal(seedPhrase.split(' ').length, 12)
      await driver.delay(regularDelayMs)

      const nextScreen = await driver.findElement(By.xpath(`//button[contains(text(), '${enLocaleMessages.next.message}')]`))
      await nextScreen.click()
      await driver.delay(regularDelayMs)
    })

    async function clickWordAndWait (word) {
      const xpath = `//div[contains(@class, 'confirm-seed-phrase__seed-word--shuffled') and not(contains(@class, 'confirm-seed-phrase__seed-word--selected')) and contains(text(), '${word}')]`
      const word0 = await driver.findElement(By.xpath(xpath))

      await word0.click()
      await driver.delay(tinyDelayMs)
    }

    it('can retype the seed phrase', async () => {
      const words = seedPhrase.split(' ')

      for (const word of words) {
        await clickWordAndWait(word)
      }

      const confirm = await driver.findElement(By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirm.click()
      await driver.delay(regularDelayMs)
    })

    it('clicks through the success screen', async () => {
      await driver.findElement(By.xpath(`//div[contains(text(), 'Congratulations')]`))
      const doneButton = await driver.findElement(By.xpath(`//button[contains(text(), '${enLocaleMessages.endOfFlowMessage10.message}')]`))
      await doneButton.click()
      await driver.delay(regularDelayMs)
    })
  })

  describe('Show account information', () => {
    it('shows the QR code for the account', async () => {
      const accountDetailsButton = await driver.findElement(By.css('.account-details__details-button'))
      await accountDetailsButton.click()
      await driver.findVisibleElement(By.css('.qr-wrapper'))
      await driver.delay(regularDelayMs)

      const accountModal = await driver.findElement(By.css('span .modal'))
      const accountModalClose = await driver.findElement(By.css('.account-modal-close'))
      await accountModalClose.click()

      await driver.wait(until.stalenessOf(accountModal))
      await driver.delay(regularDelayMs)
    })
  })

  describe('Log out an log back in', () => {
    it('logs out of the account', async () => {
      const accountMenuButton = await driver.findElement(By.css('.account-menu__icon'))
      await accountMenuButton.click()
      await driver.delay(regularDelayMs)

      const logoutButton = await driver.findElement(By.css('.account-menu__logout-button'))
      assert.equal(await logoutButton.getText(), 'Log out')
      await logoutButton.click()
      await driver.delay(regularDelayMs)
    })

    it('accepts the account password after lock', async () => {
      const passwordField = await driver.findElement(By.id('password'))
      await passwordField.sendKeys('correct horse battery staple')
      await passwordField.sendKeys(Key.ENTER)
      await driver.delay(largeDelayMs * 4)
    })
  })

  describe('Add account', () => {
    it('choose Create Account from the account menu', async () => {
      const accountMenuButton = await driver.findElement(By.css('.account-menu__icon'))
      await accountMenuButton.click()
      await driver.delay(regularDelayMs)

      const createAccount = await driver.findElement(By.xpath(`//div[contains(text(), 'Create Account')]`))
      await createAccount.click()
      await driver.delay(regularDelayMs)
    })

    it('set account name', async () => {
      const accountName = await driver.findElement(By.css('.new-account-create-form input'))
      await accountName.sendKeys('2nd account')
      await driver.delay(regularDelayMs)

      const create = await driver.findElement(By.xpath(`//button[contains(text(), 'Create')]`))
      await create.click()
      await driver.delay(largeDelayMs)
    })

    it('should display correct account name', async () => {
      const accountName = await driver.findElement(By.css('.account-details__account-name'))
      assert.equal(await accountName.getText(), '2nd account')
      await driver.delay(regularDelayMs)
    })
  })

  describe('Import seed phrase', () => {
    it('logs out of the vault', async () => {
      const accountMenuButton = await driver.findElement(By.css('.account-menu__icon'))
      accountMenuButton.click()
      await driver.delay(regularDelayMs)

      const logoutButton = await driver.findElement(By.css('.account-menu__logout-button'))
      assert.equal(await logoutButton.getText(), 'Log out')
      await logoutButton.click()
      await driver.delay(regularDelayMs)
    })

    it('imports seed phrase', async () => {
      const restoreSeedLink = await driver.findElement(By.css('.unlock-page__link--import'))
      assert.equal(await restoreSeedLink.getText(), 'Import using account seed phrase')
      await restoreSeedLink.click()
      await driver.delay(regularDelayMs)

      const seedTextArea = await driver.findElement(By.css('textarea'))
      await seedTextArea.sendKeys(testSeedPhrase)
      await driver.delay(regularDelayMs)

      const passwordInputs = await driver.findElements(By.css('input'))
      await driver.delay(regularDelayMs)

      await passwordInputs[0].sendKeys('correct horse battery staple')
      await passwordInputs[1].sendKeys('correct horse battery staple')
      const restoreButton = await driver.findElement(By.xpath(`//button[contains(text(), '${enLocaleMessages.restore.message}')]`))
      await restoreButton.click()
      await driver.delay(regularDelayMs)
    })

    it('balance renders', async () => {
      const balance = await driver.findElement(By.css('.balance-display .token-amount'))
      await driver.wait(until.elementTextMatches(balance, /100\s*ETH/))
      await driver.delay(regularDelayMs)
    })
  })

  describe('Send ETH from inside MetaMask using default gas', () => {
    it('starts a send transaction', async function () {
      const sendButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Send')]`))
      await sendButton.click()
      await driver.delay(regularDelayMs)

      const inputAddress = await driver.findElement(By.css('input[placeholder="Search, public address (0x), or ENS"]'))
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970')

      const inputAmount = await driver.findElement(By.css('.unit-input__input'))
      await inputAmount.sendKeys('1000')

      const errorAmount = await driver.findElement(By.css('.send-v2__error-amount'))
      assert.equal(await errorAmount.getText(), 'Insufficient funds.', 'send screen should render an insufficient fund error message')

      await inputAmount.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await inputAmount.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await inputAmount.sendKeys(Key.BACK_SPACE)
      await driver.delay(tinyDelayMs)

      await driver.assertElementNotPresent(By.css('.send-v2__error-amount'))

      const amountMax = await driver.findElement(By.css('.send-v2__amount-max'))
      await amountMax.click()

      assert.equal(await inputAmount.isEnabled(), false)

      let inputValue = await inputAmount.getAttribute('value')

      assert(Number(inputValue) > 99)

      await amountMax.click()

      assert.equal(await inputAmount.isEnabled(), true)

      await inputAmount.sendKeys('1')

      inputValue = await inputAmount.getAttribute('value')
      assert.equal(inputValue, '1')
      await driver.delay(regularDelayMs)

      // Continue to next screen
      const nextScreen = await driver.findElement(By.xpath(`//button[contains(text(), 'Next')]`))
      await nextScreen.click()
      await driver.delay(regularDelayMs)
    })

    it('confirms the transaction', async function () {
      const confirmButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await driver.delay(largeDelayMs * 2)
    })

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 1
      }, 10000)

      const txValues = await driver.findElement(By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txValues, /-1\s*ETH/), 10000)
    })
  })

  describe('Send ETH from inside MetaMask using fast gas option', () => {
    it('starts a send transaction', async function () {
      const sendButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Send')]`))
      await sendButton.click()
      await driver.delay(regularDelayMs)

      const inputAddress = await driver.findElement(By.css('input[placeholder="Search, public address (0x), or ENS"]'))
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970')

      const inputAmount = await driver.findElement(By.css('.unit-input__input'))
      await inputAmount.sendKeys('1')

      const inputValue = await inputAmount.getAttribute('value')
      assert.equal(inputValue, '1')

      // Set the gas price
      const fastGas = await driver.findElement(By.xpath(`//button/div/div[contains(text(), "Fast")]`))
      await fastGas.click()
      await driver.delay(regularDelayMs)

      // Continue to next screen
      const nextScreen = await driver.findElement(By.xpath(`//button[contains(text(), 'Next')]`))
      await nextScreen.click()
      await driver.delay(regularDelayMs)
    })

    it('confirms the transaction', async function () {
      const confirmButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await driver.delay(largeDelayMs)
    })

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 2
      }, 10000)

      const txValues = await driver.findElement(By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txValues, /-1\s*ETH/), 10000)
    })
  })

  describe('Send ETH from inside MetaMask using advanced gas modal', () => {
    it('starts a send transaction', async function () {
      const sendButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Send')]`))
      await sendButton.click()
      await driver.delay(regularDelayMs)

      const inputAddress = await driver.findElement(By.css('input[placeholder="Search, public address (0x), or ENS"]'))
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970')

      const inputAmount = await driver.findElement(By.css('.unit-input__input'))
      await inputAmount.sendKeys('1')

      const inputValue = await inputAmount.getAttribute('value')
      assert.equal(inputValue, '1')

      // Set the gas limit
      const configureGas = await driver.findElement(By.css('.advanced-gas-options-btn'))
      await configureGas.click()
      await driver.delay(regularDelayMs)

      const gasModal = await driver.findElement(By.css('span .modal'))
      const save = await driver.findElement(By.xpath(`//button[contains(text(), 'Save')]`))
      await save.click()
      await driver.wait(until.stalenessOf(gasModal))
      await driver.delay(regularDelayMs)

      // Continue to next screen
      const nextScreen = await driver.findElement(By.xpath(`//button[contains(text(), 'Next')]`))
      await nextScreen.click()
      await driver.delay(regularDelayMs)
    })

    it('confirms the transaction', async function () {
      const transactionAmounts = await driver.findElements(By.css('.currency-display-component__text'))
      const transactionAmount = transactionAmounts[0]
      assert.equal(await transactionAmount.getText(), '1')

      const confirmButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await driver.delay(largeDelayMs)
    })

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 3
      }, 10000)

      const txValues = await driver.findElement(By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txValues, /-1\s*ETH/), 10000)
    })
  })

  describe('Send ETH from dapp using advanced gas controls', () => {
    let windowHandles
    let extension
    let popup
    let dapp

    it('goes to the settings screen', async () => {
      const accountMenuButton = await driver.findElement(By.css('.account-menu__icon'))
      await accountMenuButton.click()
      await driver.delay(regularDelayMs)

      const settingsButton = await driver.findElement(By.xpath(`//div[contains(text(), 'Settings')]`))
      settingsButton.click()

      // await driver.findElement(By.css('.tab-bar'))

      const advancedTab = await driver.findElement(By.xpath(`//div[contains(text(), 'Advanced')]`))
      await advancedTab.click()
      await driver.delay(regularDelayMs)

      const showConversionToggle = await driver.findElement(By.css('.settings-page__content-row:nth-of-type(6) .settings-page__content-item-col > div > div'))
      await showConversionToggle.click()

      const advancedGasTitle = await driver.findElement(By.xpath(`//span[contains(text(), 'Advanced gas controls')]`))
      await driver.scrollToElement(advancedGasTitle)

      const advancedGasToggle = await driver.findElement(By.css('.settings-page__content-row:nth-of-type(4) .settings-page__content-item-col > div > div'))
      await advancedGasToggle.click()
      windowHandles = await driver.getAllWindowHandles()
      extension = windowHandles[0]
      await driver.closeAllWindowHandlesExcept([extension])

      const metamaskHomeButton = await driver.findElement(By.css('.app-header__logo-container'))
      await metamaskHomeButton.click()

      await driver.delay(largeDelayMs)
    })

    it('connects the dapp', async () => {
      await driver.openNewPage('http://127.0.0.1:8080/')
      await driver.delay(regularDelayMs)

      const connectButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Connect')]`))
      await connectButton.click()

      await driver.delay(regularDelayMs)

      await driver.waitUntilXWindowHandles(3)
      windowHandles = await driver.getAllWindowHandles()

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

    it('initiates a send from the dapp', async () => {
      const send3eth = await driver.findElement(By.xpath(`//button[contains(text(), 'Send')]`), 10000)
      await send3eth.click()
      await driver.delay(2000)

      windowHandles = await driver.getAllWindowHandles()
      await driver.switchToWindowWithTitle('MetaMask Notification', windowHandles)
      await driver.delay(regularDelayMs)

      await driver.assertElementNotPresent(By.xpath(`//li[contains(text(), 'Data')]`))

      const [gasPriceInput, gasLimitInput] = await driver.findElements(By.css('.advanced-gas-inputs__gas-edit-row__input'))
      await gasPriceInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await driver.delay(50)


      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasPriceInput.sendKeys('10')
      await driver.delay(50)
      await driver.delay(tinyDelayMs)
      await driver.delay(50)
      await gasLimitInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await driver.delay(50)
      await gasLimitInput.sendKeys('25000')

      await driver.delay(1000)

      const confirmButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Confirm')]`), 10000)
      await confirmButton.click()
      await driver.delay(regularDelayMs)

      await driver.waitUntilXWindowHandles(2)
      await driver.switchToWindow(extension)
      await driver.delay(regularDelayMs)
    })

    let txValues

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 4
      }, 10000)

      txValues = await driver.findElements(By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txValues[0], /-3\s*ETH/), 10000)
    })

    it('the transaction has the expected gas price', async function () {
      await driver.delay(largeDelayMs)
      let txGasPriceLabels
      let txGasPrices
      try {
        await txValues[0].click()
        txGasPrices = await driver.findElements(By.css('.transaction-breakdown__value'))
        txGasPriceLabels = await driver.findElements(By.css('.transaction-breakdown-row__title'))
        txGasPrices = await driver.findElements(By.css('.transaction-breakdown__value'))
        await driver.wait(until.elementTextMatches(txGasPrices[3], /^10$/), 10000)
      } catch (e) {
        console.log(e.message)
        txValues = await driver.findElements(By.css('.transaction-list-item__amount--primary'))
        await txValues[0].click()
        txGasPriceLabels = await driver.findElements(By.css('.transaction-breakdown-row__title'))
        txGasPrices = await driver.findElements(By.css('.transaction-breakdown__value'))
        await driver.wait(until.elementTextMatches(txGasPrices[3], /^10$/), 10000)
      }
      assert(txGasPriceLabels[2])

      await txValues[0].click()
    })
  })

  describe('Navigate transactions', () => {
    it('adds multiple transactions', async () => {
      await driver.delay(regularDelayMs)

      await driver.waitUntilXWindowHandles(2)
      const windowHandles = await driver.getAllWindowHandles()
      const extension = windowHandles[0]
      const dapp = windowHandles[1]

      await driver.switchToWindow(dapp)
      await driver.delay(largeDelayMs)

      const send3eth = await driver.findElement(By.xpath(`//button[contains(text(), 'Send')]`))
      await send3eth.click()
      await driver.delay(largeDelayMs)

      const contractDeployment = await driver.findElement(By.xpath(`//button[contains(text(), 'Deploy Contract')]`))
      await contractDeployment.click()
      await driver.delay(largeDelayMs)

      await send3eth.click()
      await driver.delay(largeDelayMs)
      await contractDeployment.click()
      await driver.delay(largeDelayMs)

      await driver.switchToWindow(extension)
      await driver.delay(regularDelayMs)

      let transactions = await driver.findElements(By.css('.transaction-list-item'))
      await transactions[0].click()
      await driver.delay(regularDelayMs)
      try {
        transactions = await driver.findElements(By.css('.transaction-list-item'))
        await transactions[0].click()
      } catch (e) {
        console.log(e)
      }
      await driver.delay(regularDelayMs)
    })

    it('navigates the transactions', async () => {
      let navigateTxButtons = await driver.findElements(By.css('.confirm-page-container-navigation__arrow'))
      assert.equal(navigateTxButtons.length, 4, 'navigation button present')

      await navigateTxButtons[2].click()
      let navigationElement = await driver.findElement(By.css('.confirm-page-container-navigation'))
      let navigationText = await navigationElement.getText()
      assert.equal(navigationText.includes('2'), true, 'changed transaction right')

      navigateTxButtons = await driver.findElements(By.css('.confirm-page-container-navigation__arrow'))
      await navigateTxButtons[2].click()
      navigationElement = await driver.findElement(By.css('.confirm-page-container-navigation'))
      navigationText = await navigationElement.getText()
      assert.equal(navigationText.includes('3'), true, 'changed transaction right')

      navigateTxButtons = await driver.findElements(By.css('.confirm-page-container-navigation__arrow'))
      await navigateTxButtons[2].click()
      navigationElement = await driver.findElement(By.css('.confirm-page-container-navigation'))
      navigationText = await navigationElement.getText()
      assert.equal(navigationText.includes('4'), true, 'changed transaction right')

      navigateTxButtons = await driver.findElements(By.css('.confirm-page-container-navigation__arrow'))
      await navigateTxButtons[0].click()
      navigationElement = await driver.findElement(By.css('.confirm-page-container-navigation'))
      navigationText = await navigationElement.getText()
      assert.equal(navigationText.includes('1'), true, 'navigate to first transaction')

      navigateTxButtons = await driver.findElements(By.css('.confirm-page-container-navigation__arrow'))
      await navigateTxButtons[3].click()
      navigationElement = await driver.findElement(By.css('.confirm-page-container-navigation'))
      navigationText = await navigationElement.getText()
      assert.equal(navigationText.split('4').length, 3, 'navigate to last transaction')

      navigateTxButtons = await driver.findElements(By.css('.confirm-page-container-navigation__arrow'))
      await navigateTxButtons[1].click()
      navigationElement = await driver.findElement(By.css('.confirm-page-container-navigation'))
      navigationText = await navigationElement.getText()
      assert.equal(navigationText.includes('3'), true, 'changed transaction left')

      navigateTxButtons = await driver.findElements(By.css('.confirm-page-container-navigation__arrow'))
      await navigateTxButtons[1].click()
      navigationElement = await driver.findElement(By.css('.confirm-page-container-navigation'))
      navigationText = await navigationElement.getText()
      assert.equal(navigationText.includes('2'), true, 'changed transaction left')
    })

    it('adds a transaction while confirm screen is in focus', async () => {
      let navigationElement = await driver.findElement(By.css('.confirm-page-container-navigation'))
      let navigationText = await navigationElement.getText()
      assert.equal(navigationText.includes('2'), true, 'second transaction in focus')

      const windowHandles = await driver.getAllWindowHandles()
      const extension = windowHandles[0]
      const dapp = windowHandles[1]

      await driver.switchToWindow(dapp)
      await driver.delay(regularDelayMs)

      const send3eth = await driver.findElement(By.xpath(`//button[contains(text(), 'Send')]`))
      await send3eth.click()
      await driver.delay(regularDelayMs)

      await driver.switchToWindow(extension)
      await driver.delay(regularDelayMs)

      navigationElement = await driver.findElement(By.css('.confirm-page-container-navigation'))
      navigationText = await navigationElement.getText()
      assert.equal(navigationText.includes('2'), true, 'correct (same) transaction in focus')
    })

    it('rejects a transaction', async () => {
      await driver.delay(tinyDelayMs)
      const confirmButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Reject')]`))
      await confirmButton.click()
      await driver.delay(largeDelayMs * 2)

      const navigationElement = await driver.findElement(By.css('.confirm-page-container-navigation'))
      await driver.delay(tinyDelayMs)
      const navigationText = await navigationElement.getText()
      assert.equal(navigationText.includes('4'), true, 'transaction rejected')
    })

    it('confirms a transaction', async () => {
      await driver.delay(tinyDelayMs / 2)
      const rejectButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Confirm')]`))
      await driver.delay(tinyDelayMs / 2)
      await rejectButton.click()
      await driver.delay(regularDelayMs)

      const navigationElement = await driver.findElement(By.css('.confirm-page-container-navigation'))
      await driver.delay(tinyDelayMs / 2)
      const navigationText = await navigationElement.getText()
      await driver.delay(tinyDelayMs / 2)
      assert.equal(navigationText.includes('3'), true, 'transaction confirmed')
    })

    it('rejects the rest of the transactions', async () => {
      const rejectAllButton = await driver.findElement(By.xpath(`//a[contains(text(), 'Reject 3')]`))
      await rejectAllButton.click()
      await driver.delay(regularDelayMs)

      const rejectButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Reject All')]`))
      await rejectButton.click()
      await driver.delay(largeDelayMs * 2)

      const confirmedTxes = await driver.findElements(By.css('.transaction-list__completed-transactions .transaction-list-item'))
      assert.equal(confirmedTxes.length, 5, '5 transactions present')
    })
  })

  describe('Deploy contract and call contract methods', () => {
    let extension
    let dapp
    it('creates a deploy contract transaction', async () => {
      const windowHandles = await driver.getAllWindowHandles()
      extension = windowHandles[0]
      dapp = windowHandles[1]
      await driver.delay(tinyDelayMs)

      await driver.switchToWindow(dapp)
      await driver.delay(regularDelayMs)

      const deployContractButton = await driver.findElement(By.css('#deployButton'))
      await deployContractButton.click()
      await driver.delay(regularDelayMs)

      await driver.switchToWindow(extension)
      await driver.delay(regularDelayMs)

      const txListItem = await driver.findElement(By.xpath(`//div[contains(text(), 'Contract Deployment')]`))
      await txListItem.click()
      await driver.delay(largeDelayMs)
    })

    it('displays the contract creation data', async () => {
      const dataTab = await driver.findElement(By.xpath(`//li[contains(text(), 'Data')]`))
      await dataTab.click()
      await driver.delay(regularDelayMs)

      await driver.findElement(By.xpath(`//div[contains(text(), '127.0.0.1')]`))

      const confirmDataDiv = await driver.findElement(By.css('.confirm-page-container-content__data-box'))
      const confirmDataText = await confirmDataDiv.getText()
      assert.equal(confirmDataText.match(/0x608060405234801561001057600080fd5b5033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff/))

      const detailsTab = await driver.findElement(By.xpath(`//li[contains(text(), 'Details')]`))
      await detailsTab.click()
      await driver.delay(regularDelayMs)
    })

    it('confirms a deploy contract transaction', async () => {
      const confirmButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await driver.delay(largeDelayMs)

      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 6
      }, 10000)

      const txAction = await driver.findElements(By.css('.transaction-list-item__action'))
      await driver.wait(until.elementTextMatches(txAction[0], /Contract\sDeployment/), 10000)
      await driver.delay(regularDelayMs)
    })

    it('calls and confirms a contract method where ETH is sent', async () => {
      await driver.switchToWindow(dapp)
      await driver.delay(regularDelayMs)

      let contractStatus = await driver.findElement(By.css('#contractStatus'))
      await driver.wait(until.elementTextMatches(contractStatus, /Deployed/), 15000)

      const depositButton = await driver.findElement(By.css('#depositButton'))
      await depositButton.click()
      await driver.delay(largeDelayMs)

      contractStatus = await driver.findElement(By.css('#contractStatus'))
      await driver.wait(until.elementTextMatches(contractStatus, /Deposit\sinitiated/), 10000)

      await driver.switchToWindow(extension)
      await driver.delay(largeDelayMs * 2)

      await driver.findElements(By.css('.transaction-list-item'))
      const [txListValue] = await driver.findElements(By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txListValue, /-4\s*ETH/), 10000)
      await txListValue.click()
      await driver.delay(regularDelayMs)

      // Set the gas limit
      const configureGas = await driver.findElement(By.css('.confirm-detail-row__header-text--edit'))
      await configureGas.click()
      await driver.delay(regularDelayMs)

      const gasModal = await driver.findElement(By.css('span .modal'))
      await driver.delay(regularDelayMs)
      const modalTabs = await driver.findElements(By.css('.page-container__tab'))
      await modalTabs[1].click()
      await driver.delay(regularDelayMs)

      const [gasPriceInput, gasLimitInput] = await driver.findElements(By.css('.advanced-gas-inputs__gas-edit-row__input'))
      const gasLimitValue = await gasLimitInput.getAttribute('value')
      assert(Number(gasLimitValue) < 100000, 'Gas Limit too high')
      await gasPriceInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await driver.delay(50)

      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasPriceInput.sendKeys('10')
      await driver.delay(50)
      await gasLimitInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await driver.delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasLimitInput.sendKeys('60001')

      await driver.delay(1000)

      const save = await driver.findElement(By.xpath(`//button[contains(text(), 'Save')]`))
      await save.click()
      await driver.delay(regularDelayMs)

      await driver.wait(until.stalenessOf(gasModal))

      const confirmButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await driver.delay(regularDelayMs)

      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 7
      }, 10000)

      const txValues = await driver.findElements(By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txValues[0], /-4\s*ETH/), 10000)
    })

    it('calls and confirms a contract method where ETH is received', async () => {
      await driver.switchToWindow(dapp)
      await driver.delay(regularDelayMs)

      const withdrawButton = await driver.findElement(By.css('#withdrawButton'))
      await withdrawButton.click()
      await driver.delay(regularDelayMs)

      await driver.switchToWindow(extension)
      await driver.delay(largeDelayMs * 2)

      const txListItem = await driver.findElement(By.css('.transaction-list-item'))
      await txListItem.click()
      await driver.delay(regularDelayMs)

      const confirmButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await driver.delay(regularDelayMs)

      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 8
      }, 10000)

      const txValues = await driver.findElement(By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txValues, /-0\s*ETH/), 10000)

      await driver.closeAllWindowHandlesExcept([extension, dapp])
      await driver.switchToWindow(extension)
    })

    it('renders the correct ETH balance', async () => {
      const balance = await driver.findElement(By.css('.transaction-view-balance__primary-balance'))
      await driver.delay(regularDelayMs)
      await driver.wait(until.elementTextMatches(balance, /^87.*\s*ETH.*$/), 10000)
      const tokenAmount = await balance.getText()
      assert.ok(/^87.*\s*ETH.*$/.test(tokenAmount))
      await driver.delay(regularDelayMs)
    })
  })

  describe('Add a custom token from a dapp', () => {
    it('creates a new token', async () => {
      let windowHandles = await driver.getAllWindowHandles()
      const extension = windowHandles[0]
      const dapp = windowHandles[1]
      await driver.delay(regularDelayMs * 2)

      await driver.switchToWindow(dapp)
      await driver.delay(regularDelayMs * 2)

      const createToken = await driver.findElement(By.xpath(`//button[contains(text(), 'Create Token')]`))
      await createToken.click()
      await driver.delay(largeDelayMs)

      windowHandles = await driver.getAllWindowHandles()
      const popup = windowHandles[2]
      await driver.switchToWindow(popup)
      await driver.delay(regularDelayMs)

      const configureGas = await driver.findElement(By.css('.confirm-detail-row__header-text--edit'))
      await configureGas.click()
      await driver.delay(regularDelayMs)

      const advancedTabButton = await driver.findElement(By.xpath(`//li[contains(text(), 'Advanced')]`))
      await advancedTabButton.click()
      await driver.delay(tinyDelayMs)

      const [gasPriceInput, gasLimitInput] = await driver.findElements(By.css('.advanced-gas-inputs__gas-edit-row__input'))
      assert(gasPriceInput.getAttribute('value'), 20)
      assert(gasLimitInput.getAttribute('value'), 4700000)

      const saveButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Save')]`))
      await saveButton.click()
      await driver.delay(regularDelayMs)

      const confirmButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await driver.delay(regularDelayMs)

      await driver.switchToWindow(dapp)
      await driver.delay(tinyDelayMs)

      const tokenContractAddress = await driver.findElement(By.css('#tokenAddress'))
      await driver.wait(until.elementTextMatches(tokenContractAddress, /0x/))
      tokenAddress = await tokenContractAddress.getText()

      await driver.delay(regularDelayMs)
      await driver.closeAllWindowHandlesExcept([extension, dapp])
      await driver.delay(regularDelayMs)
      await driver.switchToWindow(extension)
      await driver.delay(largeDelayMs)
    })

    it('clicks on the Add Token button', async () => {
      const addToken = await driver.findElement(By.xpath(`//div[contains(text(), 'Add Token')]`))
      await addToken.click()
      await driver.delay(regularDelayMs)
    })

    it('picks the newly created Test token', async () => {
      const addCustomToken = await driver.findElement(By.xpath("//li[contains(text(), 'Custom Token')]"))
      await addCustomToken.click()
      await driver.delay(regularDelayMs)

      const newTokenAddress = await driver.findElement(By.css('#custom-address'))
      await newTokenAddress.sendKeys(tokenAddress)
      await driver.delay(regularDelayMs)

      const nextScreen = await driver.findElement(By.xpath(`//button[contains(text(), 'Next')]`))
      await nextScreen.click()
      await driver.delay(regularDelayMs)

      const addTokens = await driver.findElement(By.xpath(`//button[contains(text(), 'Add Tokens')]`))
      await addTokens.click()
      await driver.delay(regularDelayMs)
    })

    it('renders the balance for the new token', async () => {
      const balance = await driver.findElement(By.css('.transaction-view-balance .transaction-view-balance__primary-balance'))
      await driver.wait(until.elementTextMatches(balance, /^10.000\s*TST\s*$/))
      const tokenAmount = await balance.getText()
      assert.ok(/^10.000\s*TST\s*$/.test(tokenAmount))
      await driver.delay(regularDelayMs)
    })
  })

  describe('Send token from inside MetaMask', () => {
    let gasModal
    it('starts to send a transaction', async function () {
      const sendButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Send')]`))
      await sendButton.click()
      await driver.delay(regularDelayMs)

      const inputAddress = await driver.findElement(By.css('input[placeholder="Search, public address (0x), or ENS"]'))
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970')

      const inputAmount = await driver.findElement(By.css('.unit-input__input'))
      await inputAmount.sendKeys('1')

      // Set the gas limit
      const configureGas = await driver.findElement(By.css('.advanced-gas-options-btn'))
      await configureGas.click()
      await driver.delay(regularDelayMs)

      gasModal = await driver.findElement(By.css('span .modal'))
      await driver.delay(regularDelayMs)
    })

    it('opens customize gas modal', async () => {
      await driver.findElement(By.css('.page-container__title'))
      const save = await driver.findElement(By.xpath(`//button[contains(text(), 'Save')]`))
      await save.click()
      await driver.delay(regularDelayMs)
    })

    it('transitions to the confirm screen', async () => {
      await driver.wait(until.stalenessOf(gasModal))

      // Continue to next screen
      const nextScreen = await driver.findElement(By.xpath(`//button[contains(text(), 'Next')]`))
      await driver.wait(until.elementIsEnabled(nextScreen))
      await nextScreen.click()
      await driver.delay(regularDelayMs)
    })

    it('displays the token transfer data', async () => {
      const dataTab = await driver.findElement(By.xpath(`//li[contains(text(), 'Data')]`))
      await dataTab.click()
      await driver.delay(regularDelayMs)

      const functionType = await driver.findElement(By.css('.confirm-page-container-content__function-type'))
      const functionTypeText = await functionType.getText()
      assert.equal(functionTypeText, 'Transfer')

      const tokenAmount = await driver.findElement(By.css('.confirm-page-container-summary__title-text'))
      const tokenAmountText = await tokenAmount.getText()
      assert.equal(tokenAmountText, '1 TST')

      const confirmDataDiv = await driver.findElement(By.css('.confirm-page-container-content__data-box'))
      const confirmDataText = await confirmDataDiv.getText()

      await driver.delay(regularDelayMs)
      assert(confirmDataText.match(/0xa9059cbb0000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c97/))

      const detailsTab = await driver.findElement(By.xpath(`//li[contains(text(), 'Details')]`))
      detailsTab.click()
      await driver.delay(regularDelayMs)
    })

    it('submits the transaction', async function () {
      const confirmButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await driver.delay(regularDelayMs)
    })

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 1
      }, 10000)

      const txValues = await driver.findElements(By.css('.transaction-list-item__amount--primary'))
      assert.equal(txValues.length, 1)
      await driver.wait(until.elementTextMatches(txValues[0], /-1\s*TST/), 10000)

      const txStatuses = await driver.findElements(By.css('.transaction-list-item__action'))
      await driver.wait(until.elementTextMatches(txStatuses[0], /Sent\sToken/i), 10000)
    })
  })

  describe('Send a custom token from dapp', () => {
    let gasModal
    it('sends an already created token', async () => {
      const windowHandles = await driver.getAllWindowHandles()
      const extension = windowHandles[0]
      const dapp = await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles)
      await driver.delay(regularDelayMs)

      await driver.switchToWindow(dapp)
      await driver.delay(tinyDelayMs)

      const transferTokens = await driver.findElement(By.xpath(`//button[contains(text(), 'Transfer Tokens')]`))
      await transferTokens.click()

      await driver.switchToWindow(extension)
      await driver.delay(largeDelayMs)

      await driver.findElements(By.css('.transaction-list__pending-transactions'))
      const [txListValue] = await driver.findElements(By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txListValue, /-1.5\s*TST/), 10000)
      await txListValue.click()
      await driver.delay(regularDelayMs)

      const transactionAmounts = await driver.findElements(By.css('.currency-display-component__text'))
      const transactionAmount = transactionAmounts[0]
      assert(await transactionAmount.getText(), '1.5 TST')

      // Set the gas limit
      const configureGas = await driver.findElement(By.css('.confirm-detail-row__header-text--edit'))
      await configureGas.click()
      await driver.delay(regularDelayMs)

      gasModal = await driver.findElement(By.css('span .modal'))
    })

    it('customizes gas', async () => {
      const modalTabs = await driver.findElements(By.css('.page-container__tab'))
      await modalTabs[1].click()
      await driver.delay(regularDelayMs)

      const [gasPriceInput, gasLimitInput] = await driver.findElements(By.css('.advanced-gas-inputs__gas-edit-row__input'))
      await gasPriceInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await driver.delay(50)

      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasPriceInput.sendKeys('10')
      await driver.delay(50)
      await gasLimitInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await driver.delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasLimitInput.sendKeys('60000')

      await driver.delay(1000)

      const save = await driver.findElement(By.css('.page-container__footer-button'))
      await save.click()
      await driver.wait(until.stalenessOf(gasModal))

      const gasFeeInputs = await driver.findElements(By.css('.confirm-detail-row__primary'))
      const renderedGasFee = await gasFeeInputs[0].getText()
      assert.equal(renderedGasFee, '0.0006')
    })

    it('submits the transaction', async function () {
      const tokenAmount = await driver.findElement(By.css('.confirm-page-container-summary__title-text'))
      const tokenAmountText = await tokenAmount.getText()
      assert.equal(tokenAmountText, '1.5 TST')

      const confirmButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await driver.delay(regularDelayMs)
    })

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 2
      }, 10000)

      const txValues = await driver.findElements(By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txValues[0], /-1.5\s*TST/))
      const txStatuses = await driver.findElements(By.css('.transaction-list-item__action'))
      await driver.wait(until.elementTextMatches(txStatuses[0], /Sent\sToken/), 10000)

      const walletBalance = await driver.findElement(By.css('.wallet-balance'))
      await walletBalance.click()

      const tokenListItems = await driver.findElements(By.css('.token-list-item'))
      await tokenListItems[0].click()
      await driver.delay(1000)

      const tokenBalanceAmount = await driver.findElements(By.css('.transaction-view-balance__primary-balance'))
      await driver.wait(until.elementTextMatches(tokenBalanceAmount[0], /7.500\s*TST/), 10000)
    })
  })

  describe('Approves a custom token from dapp', () => {
    let gasModal
    it('approves an already created token', async () => {
      const windowHandles = await driver.getAllWindowHandles()
      const extension = windowHandles[0]
      const dapp = await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles)
      await driver.closeAllWindowHandlesExcept([extension, dapp])
      await driver.delay(regularDelayMs)

      await driver.switchToWindow(dapp)
      await driver.delay(tinyDelayMs)

      const approveTokens = await driver.findElement(By.xpath(`//button[contains(text(), 'Approve Tokens')]`))
      await approveTokens.click()

      await driver.switchToWindow(extension)
      await driver.delay(regularDelayMs)

      await driver.wait(async () => {
        const pendingTxes = await driver.findElements(By.css('.transaction-list__pending-transactions .transaction-list-item'))
        return pendingTxes.length === 1
      }, 10000)

      const [txListItem] = await driver.findElements(By.css('.transaction-list-item'))
      const [txListValue] = await driver.findElements(By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txListValue, /-7\s*TST/))
      await txListItem.click()
      await driver.delay(regularDelayMs)
    })

    it('displays the token approval data', async () => {
      const fullTxDataButton = await driver.findElement(By.css('.confirm-approve-content__view-full-tx-button'))
      await fullTxDataButton.click()
      await driver.delay(regularDelayMs)

      const functionType = await driver.findElement(By.css('.confirm-approve-content__data .confirm-approve-content__small-text'))
      const functionTypeText = await functionType.getText()
      assert.equal(functionTypeText, 'Function: Approve')

      const confirmDataDiv = await driver.findElement(By.css('.confirm-approve-content__data__data-block'))
      const confirmDataText = await confirmDataDiv.getText()
      assert(confirmDataText.match(/0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef4/))
    })

    it('opens the gas edit modal', async () => {
      const editButtons = await driver.findElements(By.css('.confirm-approve-content__small-blue-text.cursor-pointer'))
      await editButtons[0].click()
      await driver.delay(regularDelayMs)

      gasModal = await driver.findElement(By.css('span .modal'))
    })

    it('customizes gas', async () => {
      const modalTabs = await driver.findElements(By.css('.page-container__tab'))
      await modalTabs[1].click()
      await driver.delay(regularDelayMs)

      const [gasPriceInput, gasLimitInput] = await driver.findElements(By.css('.advanced-gas-inputs__gas-edit-row__input'))
      await gasPriceInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await driver.delay(50)

      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasPriceInput.sendKeys('10')
      await driver.delay(50)
      await gasLimitInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await driver.delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasLimitInput.sendKeys('60001')

      await driver.delay(1000)

      const save = await driver.findElement(By.css('.page-container__footer-button'))
      await save.click()
      await driver.wait(until.stalenessOf(gasModal))

      const gasFeeInEth = await driver.findElement(By.css('.confirm-approve-content__transaction-details-content__secondary-fee'))
      assert.equal(await gasFeeInEth.getText(), '0.0006 ETH')
    })

    it('edits the permission', async () => {
      const editButtons = await driver.findElements(By.css('.confirm-approve-content__small-blue-text.cursor-pointer'))
      await editButtons[1].click()
      await driver.delay(regularDelayMs)

      const permissionModal = await driver.findElement(By.css('span .modal'))

      const radioButtons = await driver.findElements(By.css('.edit-approval-permission__edit-section__radio-button'))
      await radioButtons[1].click()

      const customInput = await driver.findElement(By.css('input'))
      await driver.delay(50)
      await customInput.sendKeys('5')
      await driver.delay(regularDelayMs)

      const saveButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Save')]`))
      await saveButton.click()
      await driver.delay(regularDelayMs)

      await driver.wait(until.stalenessOf(permissionModal))

      const permissionInfo = await driver.findElements(By.css('.confirm-approve-content__medium-text'))
      const amountDiv = permissionInfo[0]
      assert.equal(await amountDiv.getText(), '5 TST')
    })

    it('submits the transaction', async function () {
      const confirmButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await driver.delay(regularDelayMs)
    })

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 3
      }, 10000)

      const txValues = await driver.findElements(By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txValues[0], /-5\s*TST/))
      const txStatuses = await driver.findElements(By.css('.transaction-list-item__action'))
      await driver.wait(until.elementTextMatches(txStatuses[0], /Approve/))
    })
  })

  describe('Tranfers a custom token from dapp when no gas value is specified', () => {
    it('transfers an already created token, without specifying gas', async () => {
      const windowHandles = await driver.getAllWindowHandles()
      const extension = windowHandles[0]
      const dapp = await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles)
      await driver.closeAllWindowHandlesExcept([extension, dapp])
      await driver.delay(regularDelayMs)

      await driver.switchToWindow(dapp)

      const transferTokens = await driver.findElement(By.xpath(`//button[contains(text(), 'Transfer Tokens Without Gas')]`))
      await transferTokens.click()

      await driver.switchToWindow(extension)
      await driver.delay(regularDelayMs)

      await driver.wait(async () => {
        const pendingTxes = await driver.findElements(By.css('.transaction-list__pending-transactions .transaction-list-item'))
        return pendingTxes.length === 1
      }, 10000)

      const [txListItem] = await driver.findElements(By.css('.transaction-list-item'))
      const [txListValue] = await driver.findElements(By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txListValue, /-1.5\s*TST/))
      await txListItem.click()
      await driver.delay(regularDelayMs)
    })

    it('submits the transaction', async function () {
      await driver.delay(largeDelayMs * 2)
      const confirmButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await driver.delay(largeDelayMs * 2)
    })

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 4
      }, 10000)

      const txValues = await driver.findElements(By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txValues[0], /-1.5\s*TST/))
      const txStatuses = await driver.findElements(By.css('.transaction-list-item__action'))
      await driver.wait(until.elementTextMatches(txStatuses[0], /Sent Tokens/))
    })
  })

  describe('Approves a custom token from dapp when no gas value is specified', () => {
    it('approves an already created token', async () => {
      const windowHandles = await driver.getAllWindowHandles()
      const extension = windowHandles[0]
      const dapp = await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles)
      await driver.closeAllWindowHandlesExcept([extension, dapp])
      await driver.delay(regularDelayMs)

      await driver.switchToWindow(dapp)
      await driver.delay(tinyDelayMs)

      const transferTokens = await driver.findElement(By.xpath(`//button[contains(text(), 'Approve Tokens Without Gas')]`))
      await transferTokens.click()

      await driver.switchToWindow(extension)
      await driver.delay(regularDelayMs)

      await driver.wait(async () => {
        const pendingTxes = await driver.findElements(By.css('.transaction-list__pending-transactions .transaction-list-item'))
        return pendingTxes.length === 1
      }, 10000)

      const [txListItem] = await driver.findElements(By.css('.transaction-list-item'))
      const [txListValue] = await driver.findElements(By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txListValue, /-7\s*TST/))
      await txListItem.click()
      await driver.delay(regularDelayMs)
    })

    it('shows the correct recipient', async function () {
      const fullTxDataButton = await driver.findElement(By.css('.confirm-approve-content__view-full-tx-button'))
      await fullTxDataButton.click()
      await driver.delay(regularDelayMs)

      const permissionInfo = await driver.findElements(By.css('.confirm-approve-content__medium-text'))
      const recipientDiv = permissionInfo[1]
      assert.equal(await recipientDiv.getText(), '0x2f318C33...C970')
    })

    it('submits the transaction', async function () {
      await driver.delay(1000)
      const confirmButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await driver.delay(regularDelayMs)
    })

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 5
      }, 10000)

      const txValues = await driver.findElements(By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txValues[0], /-7\s*TST/))
      const txStatuses = await driver.findElements(By.css('.transaction-list-item__action'))
      await driver.wait(until.elementTextMatches(txStatuses[0], /Approve/))
    })
  })

  describe('Hide token', () => {
    it('hides the token when clicked', async () => {
      const [hideTokenEllipsis] = await driver.findElements(By.css('.token-list-item__ellipsis'))
      await hideTokenEllipsis.click()

      const byTokenMenuDropdownOption = By.css('.menu__item--clickable')
      const tokenMenuDropdownOption = await driver.findElement(byTokenMenuDropdownOption)

      await tokenMenuDropdownOption.click()

      const confirmHideModal = await driver.findElement(By.css('span .modal'))

      const byHideTokenConfirmationButton = By.css('.hide-token-confirmation__button')
      const hideTokenConfirmationButton = await driver.findElement(byHideTokenConfirmationButton)
      await hideTokenConfirmationButton.click()

      await driver.wait(until.stalenessOf(confirmHideModal))
    })
  })

  describe('Add existing token using search', () => {
    it('clicks on the Add Token button', async () => {
      const addToken = await driver.findElement(By.xpath(`//div[contains(text(), 'Add Token')]`))
      await addToken.click()
      await driver.delay(regularDelayMs)
    })

    it('can pick a token from the existing options', async () => {
      const tokenSearch = await driver.findElement(By.css('#search-tokens'))
      await tokenSearch.sendKeys('BAT')
      await driver.delay(regularDelayMs)

      const token = await driver.findElement(By.xpath("//span[contains(text(), 'BAT')]"))
      await token.click()
      await driver.delay(regularDelayMs)

      const nextScreen = await driver.findElement(By.xpath(`//button[contains(text(), 'Next')]`))
      await nextScreen.click()
      await driver.delay(regularDelayMs)

      const addTokens = await driver.findElement(By.xpath(`//button[contains(text(), 'Add Tokens')]`))
      await addTokens.click()
      await driver.delay(largeDelayMs)
    })

    it('renders the balance for the chosen token', async () => {
      const balance = await driver.findElement(By.css('.transaction-view-balance__primary-balance'))
      await driver.wait(until.elementTextMatches(balance, /0\s*BAT/))
      await driver.delay(regularDelayMs)
    })
  })

  describe('Stores custom RPC history', () => {
    const customRpcUrls = [
      'http://127.0.0.1:8545/1',
      'http://127.0.0.1:8545/2',
      'http://127.0.0.1:8545/3',
      'http://127.0.0.1:8545/4',
    ]

    customRpcUrls.forEach(customRpcUrl => {
      it(`creates custom RPC: ${customRpcUrl}`, async () => {
        const networkDropdown = await driver.findElement(By.css('.network-name'))
        await networkDropdown.click()
        await driver.delay(regularDelayMs)

        const customRpcButton = await driver.findElement(By.xpath(`//span[contains(text(), 'Custom RPC')]`))
        await customRpcButton.click()
        await driver.delay(regularDelayMs)

        await driver.findElement(By.css('.settings-page__sub-header-text'))

        const customRpcInputs = await driver.findElements(By.css('input[type="text"]'))
        const customRpcInput = customRpcInputs[1]
        await customRpcInput.clear()
        await customRpcInput.sendKeys(customRpcUrl)

        const customRpcSave = await driver.findElement(By.css('.network-form__footer .btn-secondary'))
        await customRpcSave.click()
        await driver.delay(largeDelayMs * 2)
      })
    })

    it('selects another provider', async () => {
      const networkDropdown = await driver.findElement(By.css('.network-name'))
      await networkDropdown.click()
      await driver.delay(regularDelayMs)

      const customRpcButton = await driver.findElement(By.xpath(`//span[contains(text(), 'Main Ethereum Network')]`))
      await customRpcButton.click()
      await driver.delay(largeDelayMs * 2)
    })

    it('finds all recent RPCs in history', async () => {
      const networkDropdown = await driver.findElement(By.css('.network-name'))
      await networkDropdown.click()
      await driver.delay(regularDelayMs)

      // only recent 3 are found and in correct order (most recent at the top)
      const customRpcs = await driver.findElements(By.xpath(`//span[contains(text(), 'http://127.0.0.1:8545/')]`))

      assert.equal(customRpcs.length, customRpcUrls.length)
    })

    it('deletes a custom RPC', async () => {
      const networkListItems = await driver.findElements(By.css('.networks-tab__networks-list-name'))
      const lastNetworkListItem = networkListItems[networkListItems.length - 1]
      await lastNetworkListItem.click()
      await driver.delay(100)

      const deleteButton = await driver.findElement(By.css('.btn-danger'))
      await deleteButton.click()
      await driver.delay(regularDelayMs)

      const confirmDeleteNetworkModal = await driver.findElement(By.css('span .modal'))

      const byConfirmDeleteNetworkButton = By.css('.button.btn-danger.modal-container__footer-button')
      const confirmDeleteNetworkButton = await driver.findElement(byConfirmDeleteNetworkButton)
      await confirmDeleteNetworkButton.click()

      await driver.wait(until.stalenessOf(confirmDeleteNetworkModal))

      const newNetworkListItems = await driver.findElements(By.css('.networks-tab__networks-list-name'))

      assert.equal(networkListItems.length - 1, newNetworkListItems.length)
    })
  })
})
