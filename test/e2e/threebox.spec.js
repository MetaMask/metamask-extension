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

  describe('set up data to be restored by 3box', () => {

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

      it('balance renders', async () => {
        const balance = await findElement(driver, By.css('.balance-display .token-amount'))
        await driver.wait(until.elementTextMatches(balance, /25\s*ETH/))
        await delay(regularDelayMs)
      })
    })

    describe('turns on threebox syncing', () => {
      it('goes to the settings screen', async () => {
        await driver.findElement(By.css('.account-menu__icon')).click()
        await delay(regularDelayMs)

        const settingsButton = await findElement(driver, By.xpath(`//div[contains(text(), 'Settings')]`))
        settingsButton.click()
      })

      it('turns on threebox syncing', async () => {
        const advancedButton = await findElement(driver, By.xpath(`//div[contains(text(), 'Advanced')]`))
        await advancedButton.click()

        const threeBoxToggle = await findElements(driver, By.css('.toggle-button'))
        const threeBoxToggleButton = await threeBoxToggle[4].findElement(By.css('div'))
        await threeBoxToggleButton.click()
      })

    })

    describe('updates settings and address book', () => {
      it('adds an address to the contact list', async () => {
        const generalButton = await findElement(driver, By.xpath(`//div[contains(text(), 'General')]`))
        await generalButton.click()
      })

      it('turns on use of blockies', async () => {
        const toggleButton = await findElement(driver, By.css('.toggle-button > div'))
        await toggleButton.click()
      })

      it('adds an address to the contact list', async () => {
        const contactsButton = await findElement(driver, By.xpath(`//div[contains(text(), 'Contacts')]`))
        await contactsButton.click()

        const addressBookAddButton = await findElement(driver, By.css('.address-book-add-button__button'))
        await addressBookAddButton.click()
        await delay(tinyDelayMs)

        const addAddressInputs = await findElements(driver, By.css('input'))
        await addAddressInputs[0].sendKeys('Test User Name 11')

        await delay(tinyDelayMs)

        await addAddressInputs[1].sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970')

        await delay(largeDelayMs * 2)

        const saveButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Save')]`))
        await saveButton.click()

        await findElement(driver, By.xpath(`//div[contains(text(), 'Test User Name 11')]`))
        await delay(regularDelayMs)
      })
    })

  })

  describe('restoration from 3box', () => {
    let driver2

    before(async function () {
      const result = await prepareExtensionForTesting()
      driver2 = result.driver
      await setupFetchMocking(driver2)
    })

    after(async function () {
      await driver2.quit()
    })

    describe('First time flow starting from an existing seed phrase', () => {
      it('clicks the continue button on the welcome screen', async () => {
        await findElement(driver2, By.css('.welcome-page__header'))
        const welcomeScreenBtn = await findElement(driver2, By.css('.first-time-flow__button'))
        welcomeScreenBtn.click()
        await delay(largeDelayMs)
      })

      it('clicks the "Import Wallet" option', async () => {
        const customRpcButton = await findElement(driver2, By.xpath(`//button[contains(text(), 'Import Wallet')]`))
        customRpcButton.click()
        await delay(largeDelayMs)
      })

      it('clicks the "No thanks" option on the metametrics opt-in screen', async () => {
        const optOutButton = await findElement(driver2, By.css('.btn-default'))
        optOutButton.click()
        await delay(largeDelayMs)
      })

      it('imports a seed phrase', async () => {
        const [seedTextArea] = await findElements(driver2, By.css('textarea.first-time-flow__textarea'))
        await seedTextArea.sendKeys(testSeedPhrase)
        await delay(regularDelayMs)

        const [password] = await findElements(driver2, By.id('password'))
        await password.sendKeys('correct horse battery staple')
        const [confirmPassword] = await findElements(driver2, By.id('confirm-password'))
        confirmPassword.sendKeys('correct horse battery staple')

        const tosCheckBox = await findElement(driver2, By.css('.first-time-flow__checkbox'))
        await tosCheckBox.click()

        const [importButton] = await findElements(driver2, By.xpath(`//button[contains(text(), 'Import')]`))
        await importButton.click()
        await delay(regularDelayMs)
      })

      it('clicks through the success screen', async () => {
        await findElement(driver2, By.xpath(`//div[contains(text(), 'Congratulations')]`))
        const doneButton = await findElement(driver2, By.css('button.first-time-flow__button'))
        await doneButton.click()
        await delay(regularDelayMs)
      })

      it('balance renders', async () => {
        const balance = await findElement(driver2, By.css('.balance-display .token-amount'))
        await driver2.wait(until.elementTextMatches(balance, /25\s*ETH/))
        await delay(regularDelayMs)
      })
    })

    describe('restores 3box data', () => {
      it('confirms the 3box restore notification', async () => {
        const restoreButton = await findElement(driver2, By.css('.home-notification__accept-button'))
        await restoreButton.click()
      })

      it('goes to the settings screen', async () => {
        await driver.findElement(By.css('.account-menu__icon')).click()
        await delay(regularDelayMs)

        const settingsButton = await findElement(driver, By.xpath(`//div[contains(text(), 'Settings')]`))
        settingsButton.click()
      })

      it('finds the blockies toggle turned on', async () => {
        await delay(regularDelayMs)
        const toggleLabel = await findElement(driver, By.css('.toggle-button__status-label'))
        const toggleLabelText = await toggleLabel.getText()
        assert.equal(toggleLabelText, 'ON')
      })

      it('finds the restored address in the contact list', async () => {
        const contactsButton = await findElement(driver, By.xpath(`//div[contains(text(), 'Contacts')]`))
        await contactsButton.click()
        await delay(regularDelayMs)

        await findElement(driver, By.xpath(`//div[contains(text(), 'Test User Name 11')]`))
        await delay(regularDelayMs)
      })
    })
  })
})
