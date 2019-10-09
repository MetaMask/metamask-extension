const assert = require('assert')
const webdriver = require('selenium-webdriver')
const { By, Key, until } = webdriver
const {
  delay,
} = require('./func')
const {
  assertElementNotPresent,
  checkBrowserForConsoleErrors,
  closeAllWindowHandlesExcept,
  findElement,
  findElements,
  loadExtension,
  openNewPage,
  switchToWindowWithTitle,
  verboseReportOnFailure,
  waitUntilXWindowHandles,
  setupFetchMocking,
  prepareExtensionForTesting,
} = require('./helpers')

describe('MetaMask', function () {
  let extensionId
  let driver
  let tokenAddress

  const testSeedPhrase = 'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent'
  const tinyDelayMs = 200
  const regularDelayMs = tinyDelayMs * 2
  const largeDelayMs = regularDelayMs * 2

  this.timeout(0)
  this.bail(true)

  before(async function () {
    const result = await prepareExtensionForTesting()
    driver = result.driver
    extensionId = result.extensionId
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

  describe('Going through the first time flow', () => {
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
      await delay(regularDelayMs)
    })

    let seedPhrase

    it('reveals the seed phrase', async () => {
      const byRevealButton = By.css('.reveal-seed-phrase__secret-blocker .reveal-seed-phrase__reveal-button')
      await driver.wait(until.elementLocated(byRevealButton, 10000))
      const revealSeedPhraseButton = await findElement(driver, byRevealButton, 10000)
      await revealSeedPhraseButton.click()
      await delay(regularDelayMs)

      seedPhrase = await driver.findElement(By.css('.reveal-seed-phrase__secret-words')).getText()
      assert.equal(seedPhrase.split(' ').length, 12)
      await delay(regularDelayMs)

      const nextScreen = (await findElements(driver, By.css('button.first-time-flow__button')))[1]
      await nextScreen.click()
      await delay(regularDelayMs)
    })

    async function clickWordAndWait (word) {
      const xpath = `//div[contains(@class, 'confirm-seed-phrase__seed-word--shuffled') and not(contains(@class, 'confirm-seed-phrase__seed-word--selected')) and contains(text(), '${word}')]`
      const word0 = await findElement(driver, By.xpath(xpath), 10000)

      await word0.click()
      await delay(tinyDelayMs)
    }

    async function retypeSeedPhrase (words, wasReloaded, count = 0) {
      try {
        if (wasReloaded) {
          const byRevealButton = By.css('.reveal-seed-phrase__secret-blocker .reveal-seed-phrase__reveal-button')
          await driver.wait(until.elementLocated(byRevealButton, 10000))
          const revealSeedPhraseButton = await findElement(driver, byRevealButton, 10000)
          await revealSeedPhraseButton.click()
          await delay(regularDelayMs)

          const nextScreen = await findElement(driver, By.css('button.first-time-flow__button'))
          await nextScreen.click()
          await delay(regularDelayMs)
        }

        for (let i = 0; i < 12; i++) {
          await clickWordAndWait(words[i])
        }
      } catch (e) {
        if (count > 2) {
          throw e
        } else {
          await loadExtension(driver, extensionId)
          await retypeSeedPhrase(words, true, count + 1)
        }
      }
    }

    it('can retype the seed phrase', async () => {
      const words = seedPhrase.split(' ')

      await retypeSeedPhrase(words)

      const confirm = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirm.click()
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
    it('shows the QR code for the account', async () => {
      await driver.findElement(By.css('.account-details__details-button')).click()
      await driver.findElement(By.css('.qr-wrapper')).isDisplayed()
      await delay(regularDelayMs)

      const accountModal = await driver.findElement(By.css('span .modal'))

      await driver.executeScript("document.querySelector('.account-modal-close').click()")

      await driver.wait(until.stalenessOf(accountModal))
      await delay(regularDelayMs)
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
      await delay(largeDelayMs * 4)
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
      await delay(largeDelayMs)
    })

    it('should display correct account name', async () => {
      const accountName = await findElement(driver, By.css('.account-details__account-name'))
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

      const passwordInputs = await driver.findElements(By.css('input'))
      await delay(regularDelayMs)

      await passwordInputs[0].sendKeys('correct horse battery staple')
      await passwordInputs[1].sendKeys('correct horse battery staple')
      await driver.findElement(By.css('.first-time-flow__button')).click()
      await delay(regularDelayMs)
    })

    it('balance renders', async () => {
      const balance = await findElement(driver, By.css('.balance-display .token-amount'))
      await driver.wait(until.elementTextMatches(balance, /100\s*ETH/))
      await delay(regularDelayMs)
    })
  })

  describe('Send ETH from inside MetaMask using default gas', () => {
    it('starts a send transaction', async function () {
      const sendButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Send')]`))
      await sendButton.click()
      await delay(regularDelayMs)

      const inputAddress = await findElement(driver, By.css('input[placeholder="Search, public address (0x), or ENS"]'))
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970')

      const inputAmount = await findElement(driver, By.css('.unit-input__input'))
      await inputAmount.sendKeys('1000')

      const errorAmount = await findElement(driver, By.css('.send-v2__error-amount'))
      assert.equal(await errorAmount.getText(), 'Insufficient funds.', 'send screen should render an insufficient fund error message')

      await inputAmount.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await inputAmount.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await inputAmount.sendKeys(Key.BACK_SPACE)
      await delay(tinyDelayMs)

      await assertElementNotPresent(webdriver, driver, By.css('.send-v2__error-amount'))

      const amountMax = await findElement(driver, By.css('.send-v2__amount-max'))
      await amountMax.click()

      assert.equal(await inputAmount.isEnabled(), false)

      let inputValue = await inputAmount.getAttribute('value')

      assert(Number(inputValue) > 99)

      await amountMax.click()

      assert.equal(await inputAmount.isEnabled(), true)

      await inputAmount.sendKeys('1')

      inputValue = await inputAmount.getAttribute('value')
      assert.equal(inputValue, '1')
      await delay(regularDelayMs)

      // Continue to next screen
      const nextScreen = await findElement(driver, By.xpath(`//button[contains(text(), 'Next')]`))
      await nextScreen.click()
      await delay(regularDelayMs)
    })

    it('confirms the transaction', async function () {
      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await delay(largeDelayMs * 2)
    })

    it('finds the transaction in the transactions list', async function () {
      const transactions = await findElements(driver, By.css('.transaction-list-item'))
      assert.equal(transactions.length, 1)

      if (process.env.SELENIUM_BROWSER !== 'firefox') {
        const txValues = await findElement(driver, By.css('.transaction-list-item__amount--primary'))
        await driver.wait(until.elementTextMatches(txValues, /-1\s*ETH/), 10000)
      }
    })
  })

  describe('Send ETH from inside MetaMask using fast gas option', () => {
    it('starts a send transaction', async function () {
      const sendButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Send')]`))
      await sendButton.click()
      await delay(regularDelayMs)

      const inputAddress = await findElement(driver, By.css('input[placeholder="Search, public address (0x), or ENS"]'))
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970')

      const inputAmount = await findElement(driver, By.css('.unit-input__input'))
      await inputAmount.sendKeys('1')

      const inputValue = await inputAmount.getAttribute('value')
      assert.equal(inputValue, '1')

      // Set the gas price
      const fastGas = await findElement(driver, By.xpath(`//button/div/div[contains(text(), "Fast")]`))
      await fastGas.click()
      await delay(regularDelayMs)

      // Continue to next screen
      const nextScreen = await findElement(driver, By.xpath(`//button[contains(text(), 'Next')]`))
      await nextScreen.click()
      await delay(regularDelayMs)
    })

    it('confirms the transaction', async function () {
      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await delay(largeDelayMs)
    })

    it('finds the transaction in the transactions list', async function () {
      const transactions = await findElements(driver, By.css('.transaction-list-item'))
      assert.equal(transactions.length, 2)

      if (process.env.SELENIUM_BROWSER !== 'firefox') {
        const txValues = await findElement(driver, By.css('.transaction-list-item__amount--primary'))
        await driver.wait(until.elementTextMatches(txValues, /-1\s*ETH/), 10000)
      }
    })
  })

  describe('Send ETH from inside MetaMask using advanced gas modal', () => {
    it('starts a send transaction', async function () {
      const sendButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Send')]`))
      await sendButton.click()
      await delay(regularDelayMs)

      const inputAddress = await findElement(driver, By.css('input[placeholder="Search, public address (0x), or ENS"]'))
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970')

      const inputAmount = await findElement(driver, By.css('.unit-input__input'))
      await inputAmount.sendKeys('1')

      const inputValue = await inputAmount.getAttribute('value')
      assert.equal(inputValue, '1')

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
      const transactionAmounts = await findElements(driver, By.css('.currency-display-component__text'))
      const transactionAmount = transactionAmounts[0]
      assert.equal(await transactionAmount.getText(), '1')

      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await delay(largeDelayMs)
    })

    it('finds the transaction in the transactions list', async function () {
      const transactions = await findElements(driver, By.css('.transaction-list-item'))
      assert.equal(transactions.length, 3)

      if (process.env.SELENIUM_BROWSER !== 'firefox') {
        const txValues = await findElement(driver, By.css('.transaction-list-item__amount--primary'))
        await driver.wait(until.elementTextMatches(txValues, /-1\s*ETH/), 10000)
      }
    })
  })

  describe('Send ETH from dapp using advanced gas controls', () => {
    let windowHandles
    let extension
    let popup
    let dapp

    it('goes to the settings screen', async () => {
      await driver.findElement(By.css('.account-menu__icon')).click()
      await delay(regularDelayMs)

      const settingsButton = await findElement(driver, By.xpath(`//div[contains(text(), 'Settings')]`))
      settingsButton.click()

      // await findElement(driver, By.css('.tab-bar'))

      const advancedTab = await findElement(driver, By.xpath(`//div[contains(text(), 'Advanced')]`))
      await advancedTab.click()
      await delay(regularDelayMs)

      const showConversionToggle = await findElement(driver, By.css('.settings-page__content-row:nth-of-type(6) .settings-page__content-item-col > div > div'))
      await showConversionToggle.click()

      const advancedGasTitle = await findElement(driver, By.xpath(`//span[contains(text(), 'Advanced gas controls')]`))
      await driver.executeScript('arguments[0].scrollIntoView(true)', advancedGasTitle)

      const advancedGasToggle = await findElement(driver, By.css('.settings-page__content-row:nth-of-type(4) .settings-page__content-item-col > div > div'))
      await advancedGasToggle.click()
      windowHandles = await driver.getAllWindowHandles()
      extension = windowHandles[0]
      await closeAllWindowHandlesExcept(driver, [extension])

      const metamaskHomeButton = await findElement(driver, By.css('.app-header__logo-container'))
      await metamaskHomeButton.click()

      await delay(largeDelayMs)
    })

    it('starts a send transaction inside the dapp', async () => {
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
    })

    it('initiates a send from the dapp', async () => {
      const send3eth = await findElement(driver, By.xpath(`//button[contains(text(), 'Send')]`), 10000)
      await send3eth.click()
      await delay(5000)

      windowHandles = await driver.getAllWindowHandles()
      await switchToWindowWithTitle(driver, 'MetaMask Notification', windowHandles)
      await delay(regularDelayMs)

      await assertElementNotPresent(webdriver, driver, By.xpath(`//li[contains(text(), 'Data')]`))

      const [gasPriceInput, gasLimitInput] = await findElements(driver, By.css('.advanced-gas-inputs__gas-edit-row__input'))
      await gasPriceInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await delay(50)


      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasPriceInput.sendKeys('10')
      await delay(50)
      await delay(tinyDelayMs)
      await delay(50)
      await gasLimitInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await delay(50)

      await gasLimitInput.sendKeys('25000')
      await delay(largeDelayMs * 2)

      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`), 10000)
      await confirmButton.click()
      await delay(regularDelayMs)

      await waitUntilXWindowHandles(driver, 2)
      await driver.switchTo().window(extension)
      await delay(regularDelayMs)
    })

    let txValues

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await findElements(driver, By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 4
      }, 10000)

      txValues = await findElements(driver, By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txValues[0], /-3\s*ETH/), 10000)
    })

    it('the transaction has the expected gas price', async function () {
      await delay(largeDelayMs)
      let txGasPriceLabels
      let txGasPrices
      try {
        await txValues[0].click()
        txGasPrices = await findElements(driver, By.css('.transaction-breakdown__value'))
        txGasPriceLabels = await findElements(driver, By.css('.transaction-breakdown-row__title'))
        txGasPrices = await findElements(driver, By.css('.transaction-breakdown__value'))
        await driver.wait(until.elementTextMatches(txGasPrices[3], /^10$/), 10000)
      } catch (e) {
        console.log(e.message)
        txValues = await findElements(driver, By.css('.transaction-list-item__amount--primary'))
        await txValues[0].click()
        txGasPriceLabels = await findElements(driver, By.css('.transaction-breakdown-row__title'))
        txGasPrices = await findElements(driver, By.css('.transaction-breakdown__value'))
        await driver.wait(until.elementTextMatches(txGasPrices[3], /^10$/), 10000)
      }
      assert(txGasPriceLabels[2])

      await txValues[0].click()
    })
  })

  describe('Navigate transactions', () => {
    it('adds multiple transactions', async () => {
      await delay(regularDelayMs)

      await waitUntilXWindowHandles(driver, 2)
      const windowHandles = await driver.getAllWindowHandles()
      const extension = windowHandles[0]
      const dapp = windowHandles[1]

      await driver.switchTo().window(dapp)
      await delay(largeDelayMs)

      const send3eth = await findElement(driver, By.xpath(`//button[contains(text(), 'Send')]`), 10000)
      await send3eth.click()
      await delay(largeDelayMs)

      const contractDeployment = await findElement(driver, By.xpath(`//button[contains(text(), 'Deploy Contract')]`), 10000)
      await contractDeployment.click()
      await delay(largeDelayMs)

      await send3eth.click()
      await delay(largeDelayMs)
      await contractDeployment.click()
      await delay(largeDelayMs)

      await driver.switchTo().window(extension)
      await delay(regularDelayMs)

      let transactions = await findElements(driver, By.css('.transaction-list-item'))
      await transactions[3].click()
      await delay(regularDelayMs)
      try {
        transactions = await findElements(driver, By.css('.transaction-list-item'), 1000)
        await transactions[3].click()
      } catch (e) {
        console.log(e)
      }
      await delay(regularDelayMs)
    })

    it('navigates the transactions', async () => {
      let navigateTxButtons = await findElements(driver, By.css('.confirm-page-container-navigation__arrow'), 20000)
      assert.equal(navigateTxButtons.length, 4, 'navigation button present')

      await navigateTxButtons[2].click()
      let navigationElement = await findElement(driver, By.css('.confirm-page-container-navigation'))
      let navigationText = await navigationElement.getText()
      assert.equal(navigationText.includes('2'), true, 'changed transaction right')

      navigateTxButtons = await findElements(driver, By.css('.confirm-page-container-navigation__arrow'))
      await navigateTxButtons[2].click()
      navigationElement = await findElement(driver, By.css('.confirm-page-container-navigation'))
      navigationText = await navigationElement.getText()
      assert.equal(navigationText.includes('3'), true, 'changed transaction right')

      navigateTxButtons = await findElements(driver, By.css('.confirm-page-container-navigation__arrow'))
      await navigateTxButtons[2].click()
      navigationElement = await findElement(driver, By.css('.confirm-page-container-navigation'))
      navigationText = await navigationElement.getText()
      assert.equal(navigationText.includes('4'), true, 'changed transaction right')

      navigateTxButtons = await findElements(driver, By.css('.confirm-page-container-navigation__arrow'))
      await navigateTxButtons[0].click()
      navigationElement = await findElement(driver, By.css('.confirm-page-container-navigation'))
      navigationText = await navigationElement.getText()
      assert.equal(navigationText.includes('1'), true, 'navigate to first transaction')

      navigateTxButtons = await findElements(driver, By.css('.confirm-page-container-navigation__arrow'))
      await navigateTxButtons[3].click()
      navigationElement = await findElement(driver, By.css('.confirm-page-container-navigation'))
      navigationText = await navigationElement.getText()
      assert.equal(navigationText.split('4').length, 3, 'navigate to last transaction')

      navigateTxButtons = await findElements(driver, By.css('.confirm-page-container-navigation__arrow'))
      await navigateTxButtons[1].click()
      navigationElement = await findElement(driver, By.css('.confirm-page-container-navigation'))
      navigationText = await navigationElement.getText()
      assert.equal(navigationText.includes('3'), true, 'changed transaction left')

      navigateTxButtons = await findElements(driver, By.css('.confirm-page-container-navigation__arrow'))
      await navigateTxButtons[1].click()
      navigationElement = await findElement(driver, By.css('.confirm-page-container-navigation'))
      navigationText = await navigationElement.getText()
      assert.equal(navigationText.includes('2'), true, 'changed transaction left')
    })

    it('adds a transaction while confirm screen is in focus', async () => {
      let navigationElement = await findElement(driver, By.css('.confirm-page-container-navigation'))
      let navigationText = await navigationElement.getText()
      assert.equal(navigationText.includes('2'), true, 'second transaction in focus')

      const windowHandles = await driver.getAllWindowHandles()
      const extension = windowHandles[0]
      const dapp = windowHandles[1]

      await driver.switchTo().window(dapp)
      await delay(regularDelayMs)

      const send3eth = await findElement(driver, By.xpath(`//button[contains(text(), 'Send')]`), 10000)
      await send3eth.click()
      await delay(regularDelayMs)

      await driver.switchTo().window(extension)
      await delay(regularDelayMs)

      navigationElement = await findElement(driver, By.css('.confirm-page-container-navigation'))
      navigationText = await navigationElement.getText()
      assert.equal(navigationText.includes('3'), true, 'correct transaction in focus')
    })

    it('confirms a transaction', async () => {
      await delay(tinyDelayMs)
      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`), 10000)
      await confirmButton.click()
      await delay(largeDelayMs * 2)

      const navigationElement = await findElement(driver, By.css('.confirm-page-container-navigation'))
      await delay(tinyDelayMs)
      const navigationText = await navigationElement.getText()
      assert.equal(navigationText.includes('4'), true, 'transaction confirmed')
    })

    it('rejects a transaction', async () => {
      await delay(tinyDelayMs / 2)
      const rejectButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Reject')]`), 10000)
      await delay(tinyDelayMs / 2)
      await rejectButton.click()
      await delay(regularDelayMs)

      const navigationElement = await findElement(driver, By.css('.confirm-page-container-navigation'))
      await delay(tinyDelayMs / 2)
      const navigationText = await navigationElement.getText()
      await delay(tinyDelayMs / 2)
      assert.equal(navigationText.includes('3'), true, 'transaction rejected')
    })

    it('rejects the rest of the transactions', async () => {
      const rejectAllButton = await findElement(driver, By.xpath(`//a[contains(text(), 'Reject 3')]`), 10000)
      await rejectAllButton.click()
      await delay(regularDelayMs)

      const rejectButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Reject All')]`), 10000)
      await rejectButton.click()
      await delay(largeDelayMs * 2)

      const confirmedTxes = await findElements(driver, By.css('.transaction-list__completed-transactions .transaction-list-item'))
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
      await delay(tinyDelayMs)

      await driver.switchTo().window(dapp)
      await delay(regularDelayMs)

      const deployContractButton = await findElement(driver, By.css('#deployButton'))
      await deployContractButton.click()
      await delay(regularDelayMs)

      await driver.switchTo().window(extension)
      await delay(regularDelayMs)

      const txListItem = await findElement(driver, By.xpath(`//div[contains(text(), 'Contract Deployment')]`))
      await txListItem.click()
      await delay(largeDelayMs)
    })

    it('displays the contract creation data', async () => {
      const dataTab = await findElement(driver, By.xpath(`//li[contains(text(), 'Data')]`))
      await dataTab.click()
      await delay(regularDelayMs)

      await findElement(driver, By.xpath(`//div[contains(text(), '127.0.0.1')]`))

      const confirmDataDiv = await findElement(driver, By.css('.confirm-page-container-content__data-box'))
      const confirmDataText = await confirmDataDiv.getText()
      assert.equal(confirmDataText.match(/0x608060405234801561001057600080fd5b5033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff/))

      const detailsTab = await findElement(driver, By.xpath(`//li[contains(text(), 'Details')]`))
      await detailsTab.click()
      await delay(regularDelayMs)
    })

    it('confirms a deploy contract transaction', async () => {
      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await delay(largeDelayMs)

      await driver.wait(async () => {
        const confirmedTxes = await findElements(driver, By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 6
      }, 10000)

      const txAction = await findElements(driver, By.css('.transaction-list-item__action'))
      await driver.wait(until.elementTextMatches(txAction[0], /Contract\sDeployment/), 10000)
      await delay(regularDelayMs)
    })

    it('calls and confirms a contract method where ETH is sent', async () => {
      await driver.switchTo().window(dapp)
      await delay(regularDelayMs)

      let contractStatus = await findElement(driver, By.css('#contractStatus'))
      await driver.wait(until.elementTextMatches(contractStatus, /Deployed/), 15000)

      const depositButton = await findElement(driver, By.css('#depositButton'))
      await depositButton.click()
      await delay(largeDelayMs)

      contractStatus = await findElement(driver, By.css('#contractStatus'))
      await driver.wait(until.elementTextMatches(contractStatus, /Deposit\sinitiated/), 10000)

      await driver.switchTo().window(extension)
      await delay(largeDelayMs * 2)

      await findElements(driver, By.css('.transaction-list-item'))
      const [txListValue] = await findElements(driver, By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txListValue, /-4\s*ETH/), 10000)
      await txListValue.click()
      await delay(regularDelayMs)

      // Set the gas limit
      const configureGas = await findElement(driver, By.css('.confirm-detail-row__header-text--edit'))
      await configureGas.click()
      await delay(regularDelayMs)

      const gasModal = await findElement(driver, By.css('span .modal'))
      await delay(regularDelayMs)
      const modalTabs = await findElements(driver, By.css('.page-container__tab'))
      await modalTabs[1].click()
      await delay(regularDelayMs)

      const [gasPriceInput, gasLimitInput] = await findElements(driver, By.css('.advanced-tab__gas-edit-row__input'))
      const gasLimitValue = await gasLimitInput.getAttribute('value')
      assert(Number(gasLimitValue) < 100000, 'Gas Limit too high')
      await gasPriceInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await delay(50)

      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasPriceInput.sendKeys('10')
      await delay(50)
      await gasLimitInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasLimitInput.sendKeys('60001')
      await delay(50)
      await gasLimitInput.sendKeys(Key.chord(Key.CONTROL, 'e'))
      await delay(50)

      const save = await findElement(driver, By.xpath(`//button[contains(text(), 'Save')]`))
      await save.click()
      await delay(regularDelayMs)

      await driver.wait(until.stalenessOf(gasModal))

      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await delay(regularDelayMs)

      await driver.wait(async () => {
        const confirmedTxes = await findElements(driver, By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 7
      }, 10000)

      const txValues = await findElements(driver, By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txValues[0], /-4\s*ETH/), 10000)

      // const txAccounts = await findElements(driver, By.css('.tx-list-account'))
      // const firstTxAddress = await txAccounts[0].getText()
      // assert(firstTxAddress.match(/^0x\w{8}\.{3}\w{4}$/))
    })

    it('calls and confirms a contract method where ETH is received', async () => {
      await driver.switchTo().window(dapp)
      await delay(regularDelayMs)

      const withdrawButton = await findElement(driver, By.css('#withdrawButton'))
      await withdrawButton.click()
      await delay(regularDelayMs)

      await driver.switchTo().window(extension)
      await delay(largeDelayMs * 2)

      const txListItem = await findElement(driver, By.css('.transaction-list-item'))
      await txListItem.click()
      await delay(regularDelayMs)

      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await delay(regularDelayMs)

      await driver.wait(async () => {
        const confirmedTxes = await findElements(driver, By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 8
      }, 10000)

      const txValues = await findElement(driver, By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txValues, /-0\s*ETH/), 10000)

      await closeAllWindowHandlesExcept(driver, [extension, dapp])
      await driver.switchTo().window(extension)
    })

    it('renders the correct ETH balance', async () => {
      const balance = await findElement(driver, By.css('.transaction-view-balance__primary-balance'))
      await delay(regularDelayMs)
      if (process.env.SELENIUM_BROWSER !== 'firefox') {
        await driver.wait(until.elementTextMatches(balance, /^87.*\s*ETH.*$/), 10000)
        const tokenAmount = await balance.getText()
        assert.ok(/^87.*\s*ETH.*$/.test(tokenAmount))
        await delay(regularDelayMs)
      }
    })
  })

  describe('Add a custom token from a dapp', () => {
    it('creates a new token', async () => {
      let windowHandles = await driver.getAllWindowHandles()
      const extension = windowHandles[0]
      const dapp = windowHandles[1]
      await delay(regularDelayMs * 2)

      await driver.switchTo().window(dapp)
      await delay(regularDelayMs * 2)

      const createToken = await findElement(driver, By.xpath(`//button[contains(text(), 'Create Token')]`))
      await createToken.click()
      await delay(largeDelayMs)

      windowHandles = await driver.getAllWindowHandles()
      const popup = windowHandles[2]
      await driver.switchTo().window(popup)
      await delay(regularDelayMs)

      const configureGas = await driver.wait(until.elementLocated(By.css('.confirm-detail-row__header-text--edit')), 10000)
      await configureGas.click()
      await delay(regularDelayMs)

      const advancedTabButton = await driver.wait(until.elementLocated(By.xpath(`//li[contains(text(), 'Advanced')]`)), 10000)
      await advancedTabButton.click()
      await delay(tinyDelayMs)

      const [gasPriceInput, gasLimitInput] = await findElements(driver, By.css('.advanced-tab__gas-edit-row__input'))
      assert(gasPriceInput.getAttribute('value'), 20)
      assert(gasLimitInput.getAttribute('value'), 4700000)

      const saveButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Save')]`))
      await saveButton.click()
      await delay(regularDelayMs)

      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await delay(regularDelayMs)

      await driver.switchTo().window(dapp)
      await delay(tinyDelayMs)

      const tokenContractAddress = await driver.findElement(By.css('#tokenAddress'))
      await driver.wait(until.elementTextMatches(tokenContractAddress, /0x/))
      tokenAddress = await tokenContractAddress.getText()

      await delay(regularDelayMs)
      await closeAllWindowHandlesExcept(driver, [extension, dapp])
      await delay(regularDelayMs)
      await driver.switchTo().window(extension)
      await delay(largeDelayMs)
    })

    it('clicks on the Add Token button', async () => {
      const addToken = await driver.findElement(By.xpath(`//div[contains(text(), 'Add Token')]`))
      await addToken.click()
      await delay(regularDelayMs)
    })

    it('picks the newly created Test token', async () => {
      const addCustomToken = await findElement(driver, By.xpath("//li[contains(text(), 'Custom Token')]"))
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
      const balance = await findElement(driver, By.css('.transaction-view-balance .transaction-view-balance__primary-balance'))
      await driver.wait(until.elementTextMatches(balance, /^10.000\s*TST\s*$/))
      const tokenAmount = await balance.getText()
      assert.ok(/^10.000\s*TST\s*$/.test(tokenAmount))
      await delay(regularDelayMs)
    })
  })

  describe('Send token from inside MetaMask', () => {
    let gasModal
    it('starts to send a transaction', async function () {
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

      gasModal = await driver.findElement(By.css('span .modal'))
      await delay(regularDelayMs)
    })

    it('opens customize gas modal', async () => {
      await driver.wait(until.elementLocated(By.css('.page-container__title')))
      const save = await findElement(driver, By.xpath(`//button[contains(text(), 'Save')]`))
      await save.click()
      await delay(regularDelayMs)
    })

    it('transitions to the confirm screen', async () => {
      await driver.wait(until.stalenessOf(gasModal))

      // Continue to next screen
      const nextScreen = await findElement(driver, By.xpath(`//button[contains(text(), 'Next')]`))
      await nextScreen.click()
      await delay(regularDelayMs)
    })

    it('displays the token transfer data', async () => {
      const dataTab = await findElement(driver, By.xpath(`//li[contains(text(), 'Data')]`))
      dataTab.click()
      await delay(regularDelayMs)

      const functionType = await findElement(driver, By.css('.confirm-page-container-content__function-type'))
      const functionTypeText = await functionType.getText()
      assert.equal(functionTypeText, 'Transfer')

      const tokenAmount = await findElement(driver, By.css('.confirm-page-container-summary__title-text'))
      const tokenAmountText = await tokenAmount.getText()
      assert.equal(tokenAmountText, '1 TST')

      const confirmDataDiv = await findElement(driver, By.css('.confirm-page-container-content__data-box'))
      const confirmDataText = await confirmDataDiv.getText()

      await delay(regularDelayMs)
      assert(confirmDataText.match(/0xa9059cbb0000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c97/))

      const detailsTab = await findElement(driver, By.xpath(`//li[contains(text(), 'Details')]`))
      detailsTab.click()
      await delay(regularDelayMs)
    })

    it('submits the transaction', async function () {
      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await delay(regularDelayMs)
    })

    it('finds the transaction in the transactions list', async function () {
      const transactions = await findElements(driver, By.css('.transaction-list-item'))
      assert.equal(transactions.length, 1)

      const txValues = await findElements(driver, By.css('.transaction-list-item__amount--primary'))
      assert.equal(txValues.length, 1)

      // test cancelled on firefox until https://github.com/mozilla/geckodriver/issues/906 is resolved,
      // or possibly until we use latest version of firefox in the tests
      if (process.env.SELENIUM_BROWSER !== 'firefox') {
        await driver.wait(until.elementTextMatches(txValues[0], /-1\s*TST/), 10000)
      }

      await driver.wait(async () => {
        const confirmedTxes = await findElements(driver, By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 1
      }, 10000)
      const txStatuses = await findElements(driver, By.css('.transaction-list-item__action'))
      await driver.wait(until.elementTextMatches(txStatuses[0], /Sent\sToken/i), 10000)
    })
  })

  describe('Send a custom token from dapp', () => {
    let gasModal
    it('sends an already created token', async () => {
      const windowHandles = await driver.getAllWindowHandles()
      const extension = windowHandles[0]
      const dapp = await switchToWindowWithTitle(driver, 'E2E Test Dapp', windowHandles)
      await delay(regularDelayMs)

      await driver.switchTo().window(dapp)
      await delay(tinyDelayMs)

      const transferTokens = await findElement(driver, By.xpath(`//button[contains(text(), 'Transfer Tokens')]`))
      await transferTokens.click()

      await driver.switchTo().window(extension)
      await delay(largeDelayMs)

      await findElements(driver, By.css('.transaction-list__pending-transactions'))
      const [txListValue] = await findElements(driver, By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txListValue, /-1.5\s*TST/), 10000)
      await txListValue.click()
      await delay(regularDelayMs)

      const transactionAmounts = await findElements(driver, By.css('.currency-display-component__text'))
      const transactionAmount = transactionAmounts[0]
      assert(await transactionAmount.getText(), '1.5 TST')

      // Set the gas limit
      const configureGas = await driver.wait(until.elementLocated(By.css('.confirm-detail-row__header-text--edit')), 10000)
      await configureGas.click()
      await delay(regularDelayMs)

      gasModal = await driver.findElement(By.css('span .modal'))
    })

    it('customizes gas', async () => {
      const modalTabs = await findElements(driver, By.css('.page-container__tab'))
      await modalTabs[1].click()
      await delay(regularDelayMs)

      const [gasPriceInput, gasLimitInput] = await findElements(driver, By.css('.advanced-tab__gas-edit-row__input'))
      await gasPriceInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await delay(50)

      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasPriceInput.sendKeys('10')
      await delay(50)
      await gasLimitInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasLimitInput.sendKeys('60000')
      await delay(50)
      await gasLimitInput.sendKeys(Key.chord(Key.CONTROL, 'e'))
      await delay(50)

      const save = await findElement(driver, By.css('.page-container__footer-button'))
      await save.click()
      await driver.wait(until.stalenessOf(gasModal))

      const gasFeeInputs = await findElements(driver, By.css('.confirm-detail-row__primary'))
      const renderedGasFee = await gasFeeInputs[0].getText()
      assert.equal(renderedGasFee, '0.0006')
    })

    it('submits the transaction', async function () {
      const tokenAmount = await findElement(driver, By.css('.confirm-page-container-summary__title-text'))
      const tokenAmountText = await tokenAmount.getText()
      assert.equal(tokenAmountText, '1.5 TST')

      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await delay(regularDelayMs)
    })

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await findElements(driver, By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 2
      }, 10000)

      await delay(regularDelayMs)
      const txValues = await findElements(driver, By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txValues[0], /-1.5\s*TST/))
      const txStatuses = await findElements(driver, By.css('.transaction-list-item__action'))
      await driver.wait(until.elementTextMatches(txStatuses[0], /Sent\sToken/), 10000)

      const walletBalance = await findElement(driver, By.css('.wallet-balance'))
      await walletBalance.click()

      const tokenListItems = await findElements(driver, By.css('.token-list-item'))
      await tokenListItems[0].click()
      await delay(regularDelayMs)

      // test cancelled on firefox until https://github.com/mozilla/geckodriver/issues/906 is resolved,
      // or possibly until we use latest version of firefox in the tests
      if (process.env.SELENIUM_BROWSER !== 'firefox') {
        const tokenBalanceAmount = await findElements(driver, By.css('.transaction-view-balance__primary-balance'))
        await driver.wait(until.elementTextMatches(tokenBalanceAmount[0], /7.500\s*TST/), 10000)
      }
    })
  })

  describe('Approves a custom token from dapp', () => {
    let gasModal
    it('approves an already created token', async () => {
      const windowHandles = await driver.getAllWindowHandles()
      const extension = windowHandles[0]
      const dapp = await switchToWindowWithTitle(driver, 'E2E Test Dapp', windowHandles)
      await closeAllWindowHandlesExcept(driver, [extension, dapp])
      await delay(regularDelayMs)

      await driver.switchTo().window(dapp)
      await delay(tinyDelayMs)

      const transferTokens = await findElement(driver, By.xpath(`//button[contains(text(), 'Approve Tokens')]`))
      await transferTokens.click()

      if (process.env.SELENIUM_BROWSER !== 'firefox') {
        await closeAllWindowHandlesExcept(driver, [extension, dapp])
      }
      await driver.switchTo().window(extension)
      await delay(regularDelayMs)

      await driver.wait(async () => {
        const pendingTxes = await findElements(driver, By.css('.transaction-list__pending-transactions .transaction-list-item'))
        return pendingTxes.length === 1
      }, 10000)

      const [txListItem] = await findElements(driver, By.css('.transaction-list-item'))
      const [txListValue] = await findElements(driver, By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txListValue, /-7\s*TST/))
      await txListItem.click()
      await delay(regularDelayMs)
    })

    it('displays the token approval data', async () => {
      const dataTab = await findElement(driver, By.xpath(`//li[contains(text(), 'Data')]`))
      dataTab.click()
      await delay(regularDelayMs)

      const functionType = await findElement(driver, By.css('.confirm-page-container-content__function-type'))
      const functionTypeText = await functionType.getText()
      assert.equal(functionTypeText, 'Approve')

      const confirmDataDiv = await findElement(driver, By.css('.confirm-page-container-content__data-box'))
      const confirmDataText = await confirmDataDiv.getText()
      assert(confirmDataText.match(/0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef4/))

      const detailsTab = await findElement(driver, By.xpath(`//li[contains(text(), 'Details')]`))
      detailsTab.click()
      await delay(regularDelayMs)

      const approvalWarning = await findElement(driver, By.css('.confirm-page-container-warning__warning'))
      const approvalWarningText = await approvalWarning.getText()
      assert(approvalWarningText.match(/By approving this/))
      await delay(regularDelayMs)
    })

    it('opens the gas edit modal', async () => {
      const configureGas = await driver.wait(until.elementLocated(By.css('.confirm-detail-row__header-text--edit')))
      await configureGas.click()
      await delay(regularDelayMs)

      gasModal = await driver.findElement(By.css('span .modal'))
    })

    it('customizes gas', async () => {
      const modalTabs = await findElements(driver, By.css('.page-container__tab'))
      await modalTabs[1].click()
      await delay(regularDelayMs)

      const [gasPriceInput, gasLimitInput] = await findElements(driver, By.css('.advanced-tab__gas-edit-row__input'))
      await gasPriceInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await delay(50)

      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasPriceInput.sendKeys('10')
      await delay(50)
      await gasLimitInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasLimitInput.sendKeys('60001')
      await delay(50)
      await gasLimitInput.sendKeys(Key.chord(Key.CONTROL, 'e'))
      await delay(50)

      const save = await findElement(driver, By.css('.page-container__footer-button'))
      await save.click()
      await driver.wait(until.stalenessOf(gasModal))

      const gasFeeInputs = await findElements(driver, By.css('.confirm-detail-row__primary'))
      assert.equal(await gasFeeInputs[0].getText(), '0.0006')
    })

    it('shows the correct recipient', async function () {
      const senderToRecipientDivs = await findElements(driver, By.css('.sender-to-recipient__name'))
      const recipientDiv = senderToRecipientDivs[1]
      assert.equal(await recipientDiv.getText(), '0x9bc5...fEF4')
    })

    it('submits the transaction', async function () {
      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await delay(regularDelayMs)
    })

    it('finds the transaction in the transactions list', async function () {
      if (process.env.SELENIUM_BROWSER === 'firefox') {
        this.skip()
      }

      await driver.wait(async () => {
        const confirmedTxes = await findElements(driver, By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 3
      }, 10000)

      const txValues = await findElements(driver, By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txValues[0], /-7\s*TST/))
      const txStatuses = await findElements(driver, By.css('.transaction-list-item__action'))
      await driver.wait(until.elementTextMatches(txStatuses[0], /Approve/))
    })
  })

  describe('Tranfers a custom token from dapp when no gas value is specified', () => {
    before(function () {
      if (process.env.SELENIUM_BROWSER === 'firefox') {
        this.skip()
      }
    })

    it('transfers an already created token, without specifying gas', async () => {
      const windowHandles = await driver.getAllWindowHandles()
      const extension = windowHandles[0]
      const dapp = await switchToWindowWithTitle(driver, 'E2E Test Dapp', windowHandles)
      await closeAllWindowHandlesExcept(driver, [extension, dapp])
      await delay(regularDelayMs)

      await driver.switchTo().window(dapp)

      const transferTokens = await findElement(driver, By.xpath(`//button[contains(text(), 'Transfer Tokens Without Gas')]`))
      await transferTokens.click()

      await closeAllWindowHandlesExcept(driver, [extension, dapp])
      await driver.switchTo().window(extension)
      await delay(regularDelayMs)

      await driver.wait(async () => {
        const pendingTxes = await findElements(driver, By.css('.transaction-list__pending-transactions .transaction-list-item'))
        return pendingTxes.length === 1
      }, 10000)

      const [txListItem] = await findElements(driver, By.css('.transaction-list-item'))
      const [txListValue] = await findElements(driver, By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txListValue, /-1.5\s*TST/))
      await txListItem.click()
      await delay(regularDelayMs)
    })

    it('submits the transaction', async function () {
      await delay(largeDelayMs * 2)
      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await delay(largeDelayMs * 2)
    })

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await findElements(driver, By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 4
      }, 10000)

      const txValues = await findElements(driver, By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txValues[0], /-1.5\s*TST/))
      const txStatuses = await findElements(driver, By.css('.transaction-list-item__action'))
      await driver.wait(until.elementTextMatches(txStatuses[0], /Sent Tokens/))
    })
  })

  describe('Approves a custom token from dapp when no gas value is specified', () => {
    before(function () {
      if (process.env.SELENIUM_BROWSER === 'firefox') {
        this.skip()
      }
    })

    it('approves an already created token', async () => {
      const windowHandles = await driver.getAllWindowHandles()
      const extension = windowHandles[0]
      const dapp = await switchToWindowWithTitle(driver, 'E2E Test Dapp', windowHandles)
      await closeAllWindowHandlesExcept(driver, [extension, dapp])
      await delay(regularDelayMs)

      await driver.switchTo().window(dapp)
      await delay(tinyDelayMs)

      const transferTokens = await findElement(driver, By.xpath(`//button[contains(text(), 'Approve Tokens Without Gas')]`))
      await transferTokens.click()

      await closeAllWindowHandlesExcept(driver, extension)
      await driver.switchTo().window(extension)
      await delay(regularDelayMs)

      await driver.wait(async () => {
        const pendingTxes = await findElements(driver, By.css('.transaction-list__pending-transactions .transaction-list-item'))
        return pendingTxes.length === 1
      }, 10000)

      const [txListItem] = await findElements(driver, By.css('.transaction-list-item'))
      const [txListValue] = await findElements(driver, By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txListValue, /-7\s*TST/))
      await txListItem.click()
      await delay(regularDelayMs)
    })

    it('shows the correct recipient', async function () {
      const senderToRecipientDivs = await findElements(driver, By.css('.sender-to-recipient__name'))
      const recipientDiv = senderToRecipientDivs[1]
      assert.equal(await recipientDiv.getText(), 'Account 2')
    })

    it('submits the transaction', async function () {
      await delay(regularDelayMs)
      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await delay(regularDelayMs)
    })

    it('finds the transaction in the transactions list', async function () {
      await driver.wait(async () => {
        const confirmedTxes = await findElements(driver, By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 5
      }, 10000)

      const txValues = await findElements(driver, By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txValues[0], /-7\s*TST/))
      const txStatuses = await findElements(driver, By.css('.transaction-list-item__action'))
      await driver.wait(until.elementTextMatches(txStatuses[0], /Approve/))
    })
  })

  describe('Hide token', () => {
    it('hides the token when clicked', async () => {
      const [hideTokenEllipsis] = await findElements(driver, By.css('.token-list-item__ellipsis'))
      await hideTokenEllipsis.click()

      const byTokenMenuDropdownOption = By.css('.menu__item--clickable')
      const tokenMenuDropdownOption = await driver.wait(until.elementLocated(byTokenMenuDropdownOption))

      await tokenMenuDropdownOption.click()

      const confirmHideModal = await findElement(driver, By.css('span .modal'))

      const byHideTokenConfirmationButton = By.css('.hide-token-confirmation__button')
      const hideTokenConfirmationButton = await driver.wait(until.elementLocated(byHideTokenConfirmationButton))
      await hideTokenConfirmationButton.click()

      await driver.wait(until.stalenessOf(confirmHideModal))
    })
  })

  describe('Add existing token using search', () => {
    it('clicks on the Add Token button', async () => {
      const addToken = await findElement(driver, By.xpath(`//div[contains(text(), 'Add Token')]`))
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
      const balance = await findElement(driver, By.css('.transaction-view-balance__primary-balance'))
      await driver.wait(until.elementTextMatches(balance, /0\s*BAT/))
      await delay(regularDelayMs)
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
        const networkDropdown = await findElement(driver, By.css('.network-name'))
        await networkDropdown.click()
        await delay(regularDelayMs)

        const customRpcButton = await findElement(driver, By.xpath(`//span[contains(text(), 'Custom RPC')]`))
        await customRpcButton.click()
        await delay(regularDelayMs)

        await findElement(driver, By.css('.settings-page__sub-header-text'))

        const customRpcInputs = await findElements(driver, By.css('input[type="text"]'))
        const customRpcInput = customRpcInputs[1]
        await customRpcInput.clear()
        await customRpcInput.sendKeys(customRpcUrl)

        const customRpcSave = await findElement(driver, By.css('.network-form__footer .btn-secondary'))
        await customRpcSave.click()
        await delay(largeDelayMs * 2)
      })
    })

    it('selects another provider', async () => {
      const networkDropdown = await findElement(driver, By.css('.network-name'))
      await networkDropdown.click()
      await delay(regularDelayMs)

      const customRpcButton = await findElement(driver, By.xpath(`//span[contains(text(), 'Main Ethereum Network')]`))
      await customRpcButton.click()
      await delay(largeDelayMs * 2)
    })

    it('finds all recent RPCs in history', async () => {
      const networkDropdown = await findElement(driver, By.css('.network-name'))
      await networkDropdown.click()
      await delay(regularDelayMs)

      // only recent 3 are found and in correct order (most recent at the top)
      const customRpcs = await findElements(driver, By.xpath(`//span[contains(text(), 'http://127.0.0.1:8545/')]`))

      assert.equal(customRpcs.length, customRpcUrls.length)
    })

    it('deletes a custom RPC', async () => {
      const networkListItems = await findElements(driver, By.css('.networks-tab__networks-list-name'))
      const lastNetworkListItem = networkListItems[networkListItems.length - 1]
      await lastNetworkListItem.click()
      await delay(100)

      const deleteButton = await findElement(driver, By.css('.btn-danger'))
      await deleteButton.click()
      await delay(regularDelayMs)

      const confirmDeleteNetworkModal = await findElement(driver, By.css('span .modal'))

      const byConfirmDeleteNetworkButton = By.css('.button.btn-danger.modal-container__footer-button')
      const confirmDeleteNetworkButton = await driver.wait(until.elementLocated(byConfirmDeleteNetworkButton))
      await confirmDeleteNetworkButton.click()

      await driver.wait(until.stalenessOf(confirmDeleteNetworkModal))

      const newNetworkListItems = await findElements(driver, By.css('.networks-tab__networks-list-name'))

      assert.equal(networkListItems.length - 1, newNetworkListItems.length)
    })
  })
})
