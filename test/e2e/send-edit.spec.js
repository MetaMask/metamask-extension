const assert = require('assert')
const webdriver = require('selenium-webdriver')

const { By, Key, until } = webdriver
const {
  prepareExtensionForTesting,
  tinyDelayMs,
  regularDelayMs,
  largeDelayMs,
} = require('./helpers')
const Ganache = require('./ganache')
const enLocaleMessages = require('../../app/_locales/en/messages.json')

const ganacheServer = new Ganache()

describe('Using MetaMask with an existing account', function () {
  let driver

  const testSeedPhrase = 'forum vessel pink push lonely enact gentle tail admit parrot grunt dress'

  this.timeout(0)
  this.bail(true)

  before(async function () {
    await ganacheServer.start({
      accounts: [
        {
          secretKey: '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
          balance: 25000000000000000000,
        },
      ],
    })
    const result = await prepareExtensionForTesting()
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

  describe('First time flow starting from an existing seed phrase', () => {
    it('clicks the continue button on the welcome screen', async () => {
      await driver.findElement(By.css('.welcome-page__header'))
      const welcomeScreenBtn = await driver.findElement(By.xpath(`//button[contains(text(), '${enLocaleMessages.getStarted.message}')]`))
      welcomeScreenBtn.click()
      await driver.delay(largeDelayMs)
    })

    it('clicks the "Import Wallet" option', async () => {
      const customRpcButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Import Wallet')]`))
      customRpcButton.click()
      await driver.delay(largeDelayMs)
    })

    it('clicks the "No thanks" option on the metametrics opt-in screen', async () => {
      const optOutButton = await driver.findElement(By.css('.btn-default'))
      optOutButton.click()
      await driver.delay(largeDelayMs)
    })

    it('imports a seed phrase', async () => {
      const [seedTextArea] = await driver.findElements(By.css('textarea.first-time-flow__textarea'))
      await seedTextArea.sendKeys(testSeedPhrase)
      await driver.delay(regularDelayMs)

      const [password] = await driver.findElements(By.id('password'))
      await password.sendKeys('correct horse battery staple')
      const [confirmPassword] = await driver.findElements(By.id('confirm-password'))
      confirmPassword.sendKeys('correct horse battery staple')

      const tosCheckBox = await driver.findElement(By.css('.first-time-flow__checkbox'))
      await tosCheckBox.click()

      const [importButton] = await driver.findElements(By.xpath(`//button[contains(text(), 'Import')]`))
      await importButton.click()
      await driver.delay(regularDelayMs)
    })

    it('clicks through the success screen', async () => {
      await driver.findElement(By.xpath(`//div[contains(text(), 'Congratulations')]`))
      const doneButton = await driver.findElement(By.xpath(`//button[contains(text(), '${enLocaleMessages.endOfFlowMessage10.message}')]`))
      await doneButton.click()
      await driver.delay(regularDelayMs)
    })
  })

  describe('Send ETH from inside MetaMask', () => {
    it('starts a send transaction', async function () {
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

      const gasModal = await driver.findElement(By.css('span .modal'))

      const [gasPriceInput, gasLimitInput] = await driver.findElements(By.css('.advanced-gas-inputs__gas-edit-row__input'))
      await gasPriceInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await driver.delay(50)


      await gasPriceInput.sendKeys(Key.BACK_SPACE)
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

      const save = await driver.findElement(By.xpath(`//button[contains(text(), 'Save')]`))
      await save.click()
      await driver.wait(until.stalenessOf(gasModal))
      await driver.delay(regularDelayMs)

      // Continue to next screen
      const nextScreen = await driver.findElement(By.xpath(`//button[contains(text(), 'Next')]`))
      await nextScreen.click()
      await driver.delay(regularDelayMs)
    })

    it('has correct value and fee on the confirm screen the transaction', async function () {
      const transactionAmounts = await driver.findElements(By.css('.currency-display-component__text'))
      const transactionAmount = transactionAmounts[0]
      assert.equal(await transactionAmount.getText(), '1')

      const transactionFee = transactionAmounts[1]
      assert.equal(await transactionFee.getText(), '0.00025')
    })

    it('edits the transaction', async function () {
      const editButton = await driver.findElement(By.css('.confirm-page-container-header__back-button'))
      await editButton.click()

      await driver.delay(regularDelayMs)

      const inputAmount = await driver.findElement(By.css('.unit-input__input'))
      await inputAmount.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await driver.delay(50)
      await inputAmount.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await inputAmount.sendKeys('2.2')

      const configureGas = await driver.findElement(By.css('.advanced-gas-options-btn'))
      await configureGas.click()
      await driver.delay(regularDelayMs)

      const gasModal = await driver.findElement(By.css('span .modal'))

      const [gasPriceInput, gasLimitInput] = await driver.findElements(By.css('.advanced-gas-inputs__gas-edit-row__input'))
      await gasPriceInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await driver.delay(50)

      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasPriceInput.sendKeys('8')
      await driver.delay(50)
      await driver.delay(tinyDelayMs)
      await driver.delay(50)
      await gasLimitInput.sendKeys(Key.chord(Key.CONTROL, 'a'))
      await driver.delay(50)

      await gasLimitInput.sendKeys('100000')

      await driver.delay(1000)

      const save = await driver.findElement(By.xpath(`//button[contains(text(), 'Save')]`))
      await save.click()
      await driver.wait(until.stalenessOf(gasModal))
      await driver.delay(regularDelayMs)

      const nextScreen = await driver.findElement(By.xpath(`//button[contains(text(), 'Next')]`))
      await nextScreen.click()
      await driver.delay(regularDelayMs)
    })

    it('has correct updated value on the confirm screen the transaction', async function () {
      const transactionAmounts = await driver.findElements(By.css('.currency-display-component__text'))
      const transactionAmount = transactionAmounts[0]
      assert.equal(await transactionAmount.getText(), '2.2')

      const transactionFee = transactionAmounts[1]
      assert.equal(await transactionFee.getText(), '0.0008')
    })

    it('confirms the transaction', async function () {
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
      assert.ok(/-2.2\s*ETH/.test(await txValues[0].getText()))
    })
  })
})
