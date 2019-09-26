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

      const [gasPriceInput, gasLimitInput] = await findElements(driver, By.css('.advanced-tab__gas-edit-row__input'))
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

      const save = await findElement(driver, By.xpath(`//button[contains(text(), 'Save')]`))
      await save.click()
      await driver.wait(until.stalenessOf(gasModal))
      await delay(regularDelayMs)

      // Continue to next screen
      const nextScreen = await findElement(driver, By.xpath(`//button[contains(text(), 'Next')]`))
      await nextScreen.click()
      await delay(regularDelayMs)
    })

    it('has correct value and fee on the confirm screen the transaction', async function () {
      const transactionAmounts = await findElements(driver, By.css('.currency-display-component__text'))
      const transactionAmount = transactionAmounts[0]
      assert.equal(await transactionAmount.getText(), '1')

      const transactionFee = transactionAmounts[1]
      assert.equal(await transactionFee.getText(), '0.00025')
    })

    it('edits the transaction', async function () {
      const editButton = await findElement(driver, By.css('.confirm-page-container-header__back-button'))
      await editButton.click()

      await delay(regularDelayMs)

      const inputAmount = await findElement(driver, By.css('.unit-input__input'))
      await inputAmount.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await delay(50)
      await inputAmount.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await inputAmount.sendKeys('2.2')

      const configureGas = await findElement(driver, By.css('.advanced-gas-options-btn'))
      await configureGas.click()
      await delay(regularDelayMs)

      const gasModal = await driver.findElement(By.css('span .modal'))

      const [gasPriceInput, gasLimitInput] = await findElements(driver, By.css('.advanced-tab__gas-edit-row__input'))
      await gasPriceInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await delay(50)

      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await delay(50)
      await gasPriceInput.sendKeys('8')
      await delay(50)
      await delay(tinyDelayMs)
      await delay(50)
      await gasLimitInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await delay(50)

      await gasLimitInput.sendKeys('100000')

      const save = await findElement(driver, By.xpath(`//button[contains(text(), 'Save')]`))
      await save.click()
      await driver.wait(until.stalenessOf(gasModal))
      await delay(regularDelayMs)

      const nextScreen = await findElement(driver, By.xpath(`//button[contains(text(), 'Next')]`))
      await nextScreen.click()
      await delay(regularDelayMs)
    })

    it('has correct updated value on the confirm screen the transaction', async function () {
      const transactionAmounts = await findElements(driver, By.css('.currency-display-component__text'))
      const transactionAmount = transactionAmounts[0]
      assert.equal(await transactionAmount.getText(), '2.2')

      const transactionFee = transactionAmounts[1]
      assert.equal(await transactionFee.getText(), '0.0008')
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
      assert.ok(/-2.2\s*ETH/.test(await txValues[0].getText()))
    })
  })
})
