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
const enLocaleMessages = require('../../app/_locales/en/messages.json')

describe('MetaMask', function () {
  let driver

  const testSeedPhrase = 'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent'
  const tinyDelayMs = 200
  const regularDelayMs = tinyDelayMs * 2
  const largeDelayMs = regularDelayMs * 2

  this.timeout(0)
  this.bail(true)

  before(async function () {
    const result = await prepareExtensionForTesting({ responsive: true })
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
      const welcomeScreenBtn = await findElement(driver, By.xpath(`//button[contains(text(), '${enLocaleMessages.getStarted.message}')]`))
      welcomeScreenBtn.click()
      await delay(largeDelayMs)
    })

    it('clicks the "Create New Wallet" option', async () => {
      const customRpcButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Create a Wallet')]`))
      customRpcButton.click()
      await delay(largeDelayMs)
    })

    it('clicks the "I agree" option on the metametrics opt-in screen', async () => {
      const optOutButton = await findElement(driver, By.css('.btn-primary'))
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

      const nextScreen = await findElement(driver, By.xpath(`//button[contains(text(), '${enLocaleMessages.next.message}')]`))
      await nextScreen.click()
      await delay(regularDelayMs)
    })

    async function clickWordAndWait (word) {
      const xpath = `//div[contains(@class, 'confirm-seed-phrase__seed-word--shuffled') and not(contains(@class, 'confirm-seed-phrase__seed-word--selected')) and contains(text(), '${word}')]`
      const word0 = await findElement(driver, By.xpath(xpath), 10000)

      await word0.click()
      await delay(tinyDelayMs)
    }

    it('can retype the seed phrase', async () => {
      const words = seedPhrase.split(' ')

      for (const word of words) {
        await clickWordAndWait(word)
      }

      const confirm = await findElement(driver, By.xpath(`//button[contains(text(), 'Confirm')]`))
      await confirm.click()
      await delay(regularDelayMs)
    })

    it('clicks through the success screen', async () => {
      await findElement(driver, By.xpath(`//div[contains(text(), 'Congratulations')]`))
      const doneButton = await findElement(driver, By.xpath(`//button[contains(text(), '${enLocaleMessages.endOfFlowMessage10.message}')]`))
      await doneButton.click()
      await delay(regularDelayMs)
    })
  })

  describe('Show account information', () => {
    it('show account details dropdown menu', async () => {
      await driver.findElement(By.css('div.menu-bar__open-in-browser')).click()
      const options = await driver.findElements(By.css('div.menu.account-details-dropdown div.menu__item'))
      assert.equal(options.length, 4) // HD Wallet type does not have to show the Remove Account option
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
      await driver.findElement(By.xpath(`//button[contains(text(), '${enLocaleMessages.restore.message}')]`)).click()
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
      const balance = await findElement(driver, By.css('.transaction-view-balance__primary-balance'))
      await driver.wait(until.elementTextMatches(balance, /100\s*ETH/))
      await delay(regularDelayMs)
    })
  })

  describe('Send ETH from inside MetaMask', () => {
    it('starts to send a transaction', async function () {
      const sendButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Send')]`))
      await sendButton.click()
      await delay(regularDelayMs)

      const inputAddress = await findElement(driver, By.css('input[placeholder="Search, public address (0x), or ENS"]'))
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970')

      const inputAmount = await findElement(driver, By.css('.unit-input__input'))
      await inputAmount.sendKeys('1')

      const inputValue = await inputAmount.getAttribute('value')
      assert.equal(inputValue, '1')
      await delay(regularDelayMs)
    })

    it('opens and closes the gas modal', async function () {
      // Set the gas limit
      const configureGas = await findElement(driver, By.css('.advanced-gas-options-btn'))
      await configureGas.click()
      await delay(regularDelayMs)

      const gasModal = await driver.findElement(By.css('span .modal'))

      const save = await findElement(driver, By.css('.page-container__header-close-text'))
      await save.click()
      await driver.wait(until.stalenessOf(gasModal), 10000)
      await delay(regularDelayMs)
    })

    it('clicks through to the confirm screen', async function () {
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
      await driver.wait(async () => {
        const confirmedTxes = await findElements(driver, By.css('.transaction-list__completed-transactions .transaction-list-item'))
        return confirmedTxes.length === 1
      }, 10000)

      const txValues = await findElement(driver, By.css('.transaction-list-item__amount--primary'))
      await driver.wait(until.elementTextMatches(txValues, /-1\s*ETH/), 10000)
    })
  })
})
