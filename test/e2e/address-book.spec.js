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
  verboseReportOnFailure,
  setupFetchMocking,
  prepareExtensionForTesting,
} = require('./helpers')

describe('MetaMask', function () {
  let driver

  const testSeedPhrase = 'forum vessel pink push lonely enact gentle tail admit parrot grunt dress'
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

  describe('Going through the first time flow', () => {
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

    it('imports seed phrase', async () => {
      const seedTextArea = await findElement(driver, By.css('textarea'))
      await seedTextArea.sendKeys(testSeedPhrase)
      await delay(regularDelayMs)

      const passwordInputs = await driver.findElements(By.css('input'))
      await delay(regularDelayMs)

      await passwordInputs[0].sendKeys('correct horse battery staple')
      await passwordInputs[1].sendKeys('correct horse battery staple')

      const tosCheckBox = await findElement(driver, By.css('.first-time-flow__checkbox'))
      await tosCheckBox.click()

      await driver.findElement(By.css('.first-time-flow__button')).click()
      await delay(regularDelayMs)
    })

    it('clicks through the success screen', async () => {
      await findElement(driver, By.xpath(`//div[contains(text(), 'Congratulations')]`))
      const doneButton = await findElement(driver, By.css('button.first-time-flow__button'))
      await doneButton.click()
      await delay(regularDelayMs)
    })

    it('balance renders', async () => {
      const balance = await findElement(driver, By.css('.balance-display .token-amount'))
      await driver.wait(until.elementTextMatches(balance, /25\s*ETH/))
      await delay(regularDelayMs)
    })
  })

  describe('Adds an entry to the address book and sends eth to that address', () => {
    it('starts a send transaction', async function () {
      const sendButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Send')]`))
      await sendButton.click()
      await delay(regularDelayMs)

      const inputAddress = await findElement(driver, By.css('input[placeholder="Search, public address (0x), or ENS"]'))
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970')
      await delay(regularDelayMs)

      const addToAddressBookButton = await findElement(driver, By.css('.dialog.send__dialog.dialog--message'))
      await addToAddressBookButton.click()

      const addressBookAddModal = await driver.findElement(By.css('span .modal'))
      await findElement(driver, By.css('.add-to-address-book-modal'))
      const addressBookInput = await findElement(driver, By.css('.add-to-address-book-modal__input'))
      await addressBookInput.sendKeys('Test Name 1')
      await delay(tinyDelayMs)
      const addressBookSaveButton = await findElement(driver, By.css('.add-to-address-book-modal__footer .btn-primary'))
      await addressBookSaveButton.click()

      await driver.wait(until.stalenessOf(addressBookAddModal))

      const inputAmount = await findElement(driver, By.css('.unit-input__input'))
      await inputAmount.sendKeys('1')

      const inputValue = await inputAmount.getAttribute('value')
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

  describe('Sends to an address book entry', () => {
    it('starts a send transaction by clicking address book entry', async function () {
      const sendButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Send')]`))
      await sendButton.click()
      await delay(regularDelayMs)

      const recipientRow = await findElement(driver, By.css('.send__select-recipient-wrapper__group-item'))
      const recipientRowTitle = await findElement(driver, By.css('.send__select-recipient-wrapper__group-item__title'))
      const recipientRowTitleString = await recipientRowTitle.getText()
      assert.equal(recipientRowTitleString, 'Test Name 1')

      await recipientRow.click()

      await delay(regularDelayMs)
      const inputAmount = await findElement(driver, By.css('.unit-input__input'))
      await inputAmount.sendKeys('2')
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
      assert.equal(transactions.length, 2)

      if (process.env.SELENIUM_BROWSER !== 'firefox') {
        const txValues = await findElement(driver, By.css('.transaction-list-item__amount--primary'))
        await driver.wait(until.elementTextMatches(txValues, /-2\s*ETH/), 10000)
      }
    })
  })
})
