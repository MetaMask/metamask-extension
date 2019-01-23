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
} = require('./helpers')
const fetchMockResponses = require('./fetch-mocks.js')

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
    let extensionUrl
    switch (process.env.SELENIUM_BROWSER) {
      case 'chrome': {
        const extPath = path.resolve('dist/chrome')
        driver = buildChromeWebDriver(extPath)
        extensionId = await getExtensionIdChrome(driver)
        await delay(largeDelayMs)
        extensionUrl = `chrome-extension://${extensionId}/home.html`
        break
      }
      case 'firefox': {
        const extPath = path.resolve('dist/firefox')
        driver = buildFirefoxWebdriver()
        await installWebExt(driver, extPath)
        await delay(largeDelayMs)
        extensionId = await getExtensionIdFirefox(driver)
        extensionUrl = `moz-extension://${extensionId}/home.html`
        break
      }
    }
    // Depending on the state of the application built into the above directory (extPath) and the value of
    // METAMASK_DEBUG we will see different post-install behaviour and possibly some extra windows. Here we
    // are closing any extraneous windows to reset us to a single window before continuing.
    const [tab1] = await driver.getAllWindowHandles()
    await closeAllWindowHandlesExcept(driver, [tab1])
    await driver.switchTo().window(tab1)
    await driver.get(extensionUrl)
  })

  beforeEach(async function () {
    await driver.executeScript(
      'window.origFetch = window.fetch.bind(window);' +
      'window.fetch = ' +
      '(...args) => { ' +
      'if (args[0] === "https://ethgasstation.info/json/ethgasAPI.json") { return ' +
      'Promise.resolve({ json: () => Promise.resolve(JSON.parse(\'' + fetchMockResponses.ethGasBasic + '\')) }); } else if ' +
      '(args[0] === "https://ethgasstation.info/json/predictTable.json") { return ' +
      'Promise.resolve({ json: () => Promise.resolve(JSON.parse(\'' + fetchMockResponses.ethGasPredictTable + '\')) }); } else if ' +
      '(args[0] === "https://dev.blockscale.net/api/gasexpress.json") { return ' +
      'Promise.resolve({ json: () => Promise.resolve(JSON.parse(\'' + fetchMockResponses.gasExpress + '\')) }); } ' +
      'return window.origFetch(...args); }'
    )
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
      const welcomeScreenBtn = await findElement(driver, By.css('.welcome-page .first-time-flow__button'))
      welcomeScreenBtn.click()
      await delay(largeDelayMs)
    })

    it('accepts a secure password', async () => {
      const passwordBox = await findElement(driver, By.css('.first-time-flow__form #create-password'))
      const passwordBoxConfirm = await findElement(driver, By.css('.first-time-flow__form #confirm-password'))
      const button = await findElement(driver, By.css('.first-time-flow__form button'))

      await passwordBox.sendKeys('correct horse battery staple')
      await passwordBoxConfirm.sendKeys('correct horse battery staple')
      await button.click()
      await delay(regularDelayMs)
    })

    it('clicks through the unique image screen', async () => {
      await findElement(driver, By.css('.first-time-flow__unique-image'))
      const nextScreen = await findElement(driver, By.css('button.first-time-flow__button'))
      await nextScreen.click()
      await delay(regularDelayMs)
    })

    it('clicks through the ToS', async () => {
      // terms of use
      await findElement(driver, By.css('.first-time-flow__markdown'))
      const canClickThrough = await driver.findElement(By.css('button.first-time-flow__button')).isEnabled()
      assert.equal(canClickThrough, false, 'disabled continue button')
      const bottomOfTos = await findElement(driver, By.linkText('Attributions'))
      await driver.executeScript('arguments[0].scrollIntoView(true)', bottomOfTos)
      await delay(regularDelayMs)
      const acceptTos = await findElement(driver, By.css('button.first-time-flow__button'))
      driver.wait(until.elementIsEnabled(acceptTos))
      await acceptTos.click()
      await delay(regularDelayMs)
    })

    it('clicks through the privacy notice', async () => {
      // privacy notice
      const nextScreen = await findElement(driver, By.css('button.first-time-flow__button'))
      await nextScreen.click()
      await delay(regularDelayMs)
    })

    it('clicks through the phishing notice', async () => {
      // phishing notice
      const noticeElement = await driver.findElement(By.css('.first-time-flow__markdown'))
      await driver.executeScript('arguments[0].scrollTop = arguments[0].scrollHeight', noticeElement)
      await delay(regularDelayMs)
      const nextScreen = await findElement(driver, By.css('button.first-time-flow__button'))
      await nextScreen.click()
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

      const nextScreen = await findElement(driver, By.css('button.first-time-flow__button'))
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

    it('clicks through the deposit modal', async () => {
      const byBuyModal = By.css('span .modal')
      const buyModal = await driver.wait(until.elementLocated(byBuyModal))
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

      const accountModal = await driver.findElement(By.css('span .modal'))

      await driver.executeScript("document.querySelector('.account-modal-close').click()")

      await driver.wait(until.stalenessOf(accountModal))
      await delay(regularDelayMs)
    })
  })

  describe('Enable privacy mode', () => {
    it('enables privacy mode', async () => {
      const networkDropdown = await findElement(driver, By.css('.network-name'))
      await networkDropdown.click()
      await delay(regularDelayMs)

      const customRpcButton = await findElement(driver, By.xpath(`//span[contains(text(), 'Custom RPC')]`))
      await customRpcButton.click()
      await delay(regularDelayMs)

      const privacyToggle = await findElement(driver, By.css('.settings-page__content-row:nth-of-type(10) .settings-page__content-item-col > div'))
      await privacyToggle.click()
      await delay(largeDelayMs * 2)
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

      const passwordInputs = await driver.findElements(By.css('input'))
      await delay(regularDelayMs)

      await passwordInputs[0].sendKeys('correct horse battery staple')
      await passwordInputs[1].sendKeys('correct horse battery staple')
      await driver.findElement(By.css('.first-time-flow__button')).click()
      await delay(regularDelayMs)
    })

    it('switches to localhost', async () => {
      const networkDropdown = await findElement(driver, By.css('.network-name'))
      await networkDropdown.click()
      await delay(regularDelayMs)

      const [localhost] = await findElements(driver, By.xpath(`//span[contains(text(), 'Localhost')]`))
      await localhost.click()
      await delay(largeDelayMs * 2)
    })

    it('balance renders', async () => {
      const balance = await findElement(driver, By.css('.balance-display .token-amount'))
      await driver.wait(until.elementTextMatches(balance, /100\s*ETH/))
      await delay(regularDelayMs)
    })
  })

  describe('Send ETH from inside MetaMask', () => {
    it('starts a send transaction', async function () {
      const sendButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Send')]`))
      await sendButton.click()
      await delay(regularDelayMs)

      const inputAddress = await findElement(driver, By.css('input[placeholder="Recipient Address"]'))
      const inputAmount = await findElement(driver, By.css('.unit-input__input'))
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970')
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
      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await delay(largeDelayMs)
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

  describe('Send ETH from dapp', () => {
    let windowHandles
    let extension
    let popup
    let dapp

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

      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`), 10000)
      await confirmButton.click()
      await delay(regularDelayMs)

      await waitUntilXWindowHandles(driver, 2)
      await driver.switchTo().window(extension)
      await delay(regularDelayMs)
    })

    it('finds the transaction in the transactions list', async function () {
      const transactions = await findElements(driver, By.css('.transaction-list-item'))
      assert.equal(transactions.length, 2)

      const txValues = await findElement(driver, By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txValues, /-3\s*ETH/), 10000)
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
      await delay(regularDelayMs)

      const send3eth = await findElement(driver, By.xpath(`//button[contains(text(), 'Send')]`), 10000)
      await send3eth.click()
      await delay(regularDelayMs)

      const contractDeployment = await findElement(driver, By.xpath(`//button[contains(text(), 'Deploy Contract')]`), 10000)
      await contractDeployment.click()
      await delay(regularDelayMs)

      await send3eth.click()
      await contractDeployment.click()
      await delay(regularDelayMs)

      await driver.switchTo().window(extension)
      await delay(regularDelayMs)

      const transactions = await findElements(driver, By.css('.transaction-list-item'))
      await transactions[3].click()
      await delay(regularDelayMs)
    })

    it('navigates the transactions', async () => {
      let navigateTxButtons = await findElements(driver, By.css('.confirm-page-container-navigation__arrow'))
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
      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`), 10000)
      await confirmButton.click()
      await delay(regularDelayMs)

      const navigationElement = await findElement(driver, By.css('.confirm-page-container-navigation'))
      const navigationText = await navigationElement.getText()
      assert.equal(navigationText.includes('4'), true, 'transaction confirmed')
    })

    it('rejects a transaction', async () => {
      const rejectButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Reject')]`), 10000)
      await rejectButton.click()
      await delay(regularDelayMs)

      const navigationElement = await findElement(driver, By.css('.confirm-page-container-navigation'))
      const navigationText = await navigationElement.getText()
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
      assert.equal(confirmedTxes.length, 3, '3 transactions present')
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

      driver.wait(async () => {
        const confirmedTxes = await findElements(driver, By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 4
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
      await delay(largeDelayMs)

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
      await gasPriceInput.clear()
      await gasPriceInput.sendKeys('10')
      await gasLimitInput.clear()
      await gasLimitInput.sendKeys('60001')

      const save = await findElement(driver, By.xpath(`//button[contains(text(), 'Save')]`))
      await save.click()
      await delay(regularDelayMs)

      await driver.wait(until.stalenessOf(gasModal))

      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await delay(regularDelayMs)

      driver.wait(async () => {
        const confirmedTxes = await findElements(driver, By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 5
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
      await delay(regularDelayMs)

      const txListItem = await findElement(driver, By.css('.transaction-list-item'))
      await txListItem.click()
      await delay(regularDelayMs)

      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await delay(regularDelayMs)

      driver.wait(async () => {
        const confirmedTxes = await findElements(driver, By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 6
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
        await driver.wait(until.elementTextMatches(balance, /^89.*\s*ETH.*$/), 10000)
        const tokenAmount = await balance.getText()
        assert.ok(/^89.*\s*ETH.*$/.test(tokenAmount))
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
      await driver.wait(until.elementTextMatches(balance, /^100\s*TST\s*$/))
      const tokenAmount = await balance.getText()
      assert.ok(/^100\s*TST\s*$/.test(tokenAmount))
      await delay(regularDelayMs)
    })
  })

  describe('Send token from inside MetaMask', () => {
    let gasModal
    it('starts to send a transaction', async function () {
      const sendButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Send')]`))
      await sendButton.click()
      await delay(regularDelayMs)

      const inputAddress = await findElement(driver, By.css('input[placeholder="Recipient Address"]'))
      const inputAmount = await findElement(driver, By.css('.unit-input__input'))
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970')
      await inputAmount.sendKeys('50')

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

      const confirmDataDiv = await findElement(driver, By.css('.confirm-page-container-content__data-box'))
      const confirmDataText = await confirmDataDiv.getText()
      assert.equal(confirmDataText.match(/0xa9059cbb0000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c97/))

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
        await driver.wait(until.elementTextMatches(txValues[0], /-50\s*TST/), 10000)
      }

      driver.wait(async () => {
        const confirmedTxes = await findElements(driver, By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 1
      }, 10000)
      const txStatuses = await findElements(driver, By.css('.transaction-list-item__action'))
      const tx = await driver.wait(until.elementTextMatches(txStatuses[0], /Sent\sToken|Failed/), 10000)
      assert.equal(await tx.getText(), 'Sent Tokens')
    })
  })

  describe('Send a custom token from dapp', () => {
    let gasModal
    it('sends an already created token', async () => {
      const windowHandles = await driver.getAllWindowHandles()
      const extension = windowHandles[0]
      const dapp = await switchToWindowWithTitle(driver, 'E2E Test Dapp', windowHandles)
      await closeAllWindowHandlesExcept(driver, [extension, dapp])
      await delay(regularDelayMs)

      await driver.switchTo().window(dapp)
      await delay(tinyDelayMs)

      const transferTokens = await findElement(driver, By.xpath(`//button[contains(text(), 'Transfer Tokens')]`))
      await transferTokens.click()

      await closeAllWindowHandlesExcept(driver, [extension, dapp])
      await driver.switchTo().window(extension)
      await delay(largeDelayMs)

      await findElements(driver, By.css('.transaction-list__pending-transactions'))
      const [txListValue] = await findElements(driver, By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txListValue, /-7\s*TST/), 10000)
      await txListValue.click()
      await delay(regularDelayMs)

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
      await gasPriceInput.clear()
      await delay(tinyDelayMs)
      await gasPriceInput.sendKeys('10')
      await delay(tinyDelayMs)
      await gasLimitInput.clear()
      await delay(tinyDelayMs)
      await gasLimitInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await gasLimitInput.sendKeys('60000')
      await gasLimitInput.sendKeys(Key.chord(Key.CONTROL, 'e'))

      // Needed for different behaviour of input in different versions of firefox
      const gasLimitInputValue = await gasLimitInput.getAttribute('value')
      if (gasLimitInputValue === '600001') {
        await gasLimitInput.sendKeys(Key.BACK_SPACE)
      }

      const save = await findElement(driver, By.css('.page-container__footer-button'))
      await save.click()
      await driver.wait(until.stalenessOf(gasModal))

      const gasFeeInputs = await findElements(driver, By.css('.confirm-detail-row__primary'))
      assert.equal(await gasFeeInputs[0].getText(), '0.0006')
    })

    it('submits the transaction', async function () {
      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await delay(regularDelayMs)
    })

    it('finds the transaction in the transactions list', async function () {
      driver.wait(async () => {
        const confirmedTxes = await findElements(driver, By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 2
      }, 10000)

      const txValues = await findElements(driver, By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txValues[0], /-7\s*TST/))
      const txStatuses = await findElements(driver, By.css('.transaction-list-item__action'))
      await driver.wait(until.elementTextMatches(txStatuses[0], /Sent\sToken/))

      const walletBalance = await findElement(driver, By.css('.wallet-balance'))
      await walletBalance.click()

      const tokenListItems = await findElements(driver, By.css('.token-list-item'))
      await tokenListItems[0].click()
      await delay(regularDelayMs)

      // test cancelled on firefox until https://github.com/mozilla/geckodriver/issues/906 is resolved,
      // or possibly until we use latest version of firefox in the tests
      if (process.env.SELENIUM_BROWSER !== 'firefox') {
        const tokenBalanceAmount = await findElements(driver, By.css('.transaction-view-balance__primary-balance'))
        await driver.wait(until.elementTextMatches(tokenBalanceAmount[0], /43\s*TST/))
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

      await closeAllWindowHandlesExcept(driver, extension)
      await driver.switchTo().window(extension)
      await delay(regularDelayMs)

      driver.wait(async () => {
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
      assert.equal(confirmDataText.match(/0x095ea7b30000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c97/))

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
      await gasPriceInput.clear()
      await delay(tinyDelayMs)
      await gasPriceInput.sendKeys('10')
      await delay(tinyDelayMs)
      await gasLimitInput.clear()
      await delay(tinyDelayMs)
      await gasLimitInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await gasLimitInput.sendKeys('60000')
      await gasLimitInput.sendKeys(Key.chord(Key.CONTROL, 'e'))

      // Needed for different behaviour of input in different versions of firefox
      const gasLimitInputValue = await gasLimitInput.getAttribute('value')
      if (gasLimitInputValue === '600001') {
        await gasLimitInput.sendKeys(Key.BACK_SPACE)
      }

      const save = await findElement(driver, By.css('.page-container__footer-button'))
      await save.click()
      await driver.wait(until.stalenessOf(gasModal))

      const gasFeeInputs = await findElements(driver, By.css('.confirm-detail-row__primary'))
      assert.equal(await gasFeeInputs[0].getText(), '0.0006')
    })

    it('submits the transaction', async function () {
      const confirmButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirmButton.click()
      await delay(regularDelayMs)
    })

    it('finds the transaction in the transactions list', async function () {
      driver.wait(async () => {
        const confirmedTxes = await findElements(driver, By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 3
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
      'https://mainnet.infura.io/1',
      'https://mainnet.infura.io/2',
      'https://mainnet.infura.io/3',
      'https://mainnet.infura.io/4',
    ]

    customRpcUrls.forEach(customRpcUrl => {
      it(`creates custom RPC: ${customRpcUrl}`, async () => {
        const networkDropdown = await findElement(driver, By.css('.network-name'))
        await networkDropdown.click()
        await delay(regularDelayMs)

        const customRpcButton = await findElement(driver, By.xpath(`//span[contains(text(), 'Custom RPC')]`))
        await customRpcButton.click()
        await delay(regularDelayMs)

        const customRpcInput = await findElement(driver, By.css('input[placeholder="New RPC URL"]'))
        await customRpcInput.clear()
        await customRpcInput.sendKeys(customRpcUrl)

        const customRpcSave = await findElement(driver, By.css('.settings-tab__rpc-save-button'))
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
      const customRpcs = await findElements(driver, By.xpath(`//span[contains(text(), 'https://mainnet.infura.io/')]`))

      assert.equal(customRpcs.length, customRpcUrls.length)
    })
  })
})
