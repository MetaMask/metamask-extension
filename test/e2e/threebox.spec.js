const assert = require('assert')
const webdriver = require('selenium-webdriver')
const getPort = require('get-port')

const { By, until } = webdriver
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
    const result = await buildWebDriver({ port: await getPort() })
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

  describe('set up data to be restored by 3box', () => {

    describe('First time flow starting from an existing seed phrase', () => {
      it('clicks the continue button on the welcome screen', async () => {
        await driver.findElement(By.css('.welcome-page__header'))
        const welcomeScreenBtn = await driver.findElement(By.xpath(`//button[contains(text(), '${enLocaleMessages.getStarted.message}')]`))
        await welcomeScreenBtn.click()
        await driver.delay(largeDelayMs)
      })

      it('clicks the "Import Wallet" option', async () => {
        const customRpcButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Import Wallet')]`))
        await customRpcButton.click()
        await driver.delay(largeDelayMs)
      })

      it('clicks the "No thanks" option on the metametrics opt-in screen', async () => {
        const optOutButton = await driver.findElement(By.css('.btn-default'))
        await optOutButton.click()
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

      it('balance renders', async () => {
        const balance = await driver.findElement(By.css('.balance-display .token-amount'))
        await driver.wait(until.elementTextMatches(balance, /25\s*ETH/))
        await driver.delay(regularDelayMs)
      })
    })

    describe('turns on threebox syncing', () => {
      it('goes to the settings screen', async () => {
        const accountMenuButton = await driver.findElement(By.css('.account-menu__icon'))
        await accountMenuButton.click()
        await driver.delay(regularDelayMs)

        const settingsButton = await driver.findElement(By.xpath(`//div[contains(text(), 'Settings')]`))
        await settingsButton.click()
      })

      it('turns on threebox syncing', async () => {
        const advancedButton = await driver.findElement(By.xpath(`//div[contains(text(), 'Advanced')]`))
        await advancedButton.click()

        const threeBoxToggleButton = await driver.findElement(By.css('[data-testid="advanced-setting-3box"] .toggle-button div'))
        await threeBoxToggleButton.click()
      })

    })

    describe('updates settings and address book', () => {
      it('adds an address to the contact list', async () => {
        const generalButton = await driver.findElement(By.xpath(`//div[contains(text(), 'General')]`))
        await generalButton.click()
      })

      it('turns on use of blockies', async () => {
        const toggleButton = await driver.findElement(By.css('.toggle-button > div'))
        await toggleButton.click()
      })

      it('adds an address to the contact list', async () => {
        const contactsButton = await driver.findElement(By.xpath(`//div[contains(text(), 'Contacts')]`))
        await contactsButton.click()

        const addressBookAddButton = await driver.findElement(By.css('.address-book-add-button__button'))
        await addressBookAddButton.click()
        await driver.delay(tinyDelayMs)

        const addAddressInputs = await driver.findElements(By.css('input'))
        await addAddressInputs[0].sendKeys('Test User Name 11')

        await driver.delay(tinyDelayMs)

        await addAddressInputs[1].sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970')

        await driver.delay(largeDelayMs * 2)

        const saveButton = await driver.findElement(By.xpath(`//button[contains(text(), 'Save')]`))
        await saveButton.click()

        await driver.findElement(By.xpath(`//div[contains(text(), 'Test User Name 11')]`))
        await driver.delay(regularDelayMs)
      })
    })

  })

  describe('restoration from 3box', () => {
    let driver2

    before(async function () {
      const result = await buildWebDriver({ port: await getPort() })
      driver2 = result.driver
    })

    after(async function () {
      await driver2.quit()
    })

    describe('First time flow starting from an existing seed phrase', () => {
      it('clicks the continue button on the welcome screen', async () => {
        await driver2.findElement(By.css('.welcome-page__header'))
        const welcomeScreenBtn = await driver2.findElement(By.xpath(`//button[contains(text(), '${enLocaleMessages.getStarted.message}')]`))
        await welcomeScreenBtn.click()
        await driver2.delay(largeDelayMs)
      })

      it('clicks the "Import Wallet" option', async () => {
        const customRpcButton = await driver2.findElement(By.xpath(`//button[contains(text(), 'Import Wallet')]`))
        await customRpcButton.click()
        await driver2.delay(largeDelayMs)
      })

      it('clicks the "No thanks" option on the metametrics opt-in screen', async () => {
        const optOutButton = await driver2.findElement(By.css('.btn-default'))
        await optOutButton.click()
        await driver2.delay(largeDelayMs)
      })

      it('imports a seed phrase', async () => {
        const [seedTextArea] = await driver2.findElements(By.css('textarea.first-time-flow__textarea'))
        await seedTextArea.sendKeys(testSeedPhrase)
        await driver2.delay(regularDelayMs)

        const [password] = await driver2.findElements(By.id('password'))
        await password.sendKeys('correct horse battery staple')
        const [confirmPassword] = await driver2.findElements(By.id('confirm-password'))
        confirmPassword.sendKeys('correct horse battery staple')

        const tosCheckBox = await driver2.findElement(By.css('.first-time-flow__checkbox'))
        await tosCheckBox.click()

        const [importButton] = await driver2.findElements(By.xpath(`//button[contains(text(), 'Import')]`))
        await importButton.click()
        await driver2.delay(regularDelayMs)
      })

      it('clicks through the success screen', async () => {
        await driver2.findElement(By.xpath(`//div[contains(text(), 'Congratulations')]`))
        const doneButton = await driver2.findElement(By.xpath(`//button[contains(text(), '${enLocaleMessages.endOfFlowMessage10.message}')]`))
        await doneButton.click()
        await driver2.delay(regularDelayMs)
      })

      it('balance renders', async () => {
        const balance = await driver2.findElement(By.css('.balance-display .token-amount'))
        await driver2.wait(until.elementTextMatches(balance, /25\s*ETH/))
        await driver2.delay(regularDelayMs)
      })
    })

    describe('restores 3box data', () => {
      it('confirms the 3box restore notification', async () => {
        const restoreButton = await driver2.findElement(By.css('.home-notification__accept-button'))
        await restoreButton.click()
      })

      // TODO: Fix tests from here forward; they're using the wrong driver
      it('goes to the settings screen', async () => {
        const accountMenuButton = await driver.findElement(By.css('.account-menu__icon'))
        await accountMenuButton.click()
        await driver.delay(regularDelayMs)

        const settingsButton = await driver.findElement(By.xpath(`//div[contains(text(), 'Settings')]`))
        await settingsButton.click()
      })

      it('finds the blockies toggle turned on', async () => {
        await driver.delay(regularDelayMs)
        const toggleLabel = await driver.findElement(By.css('.toggle-button__status-label'))
        const toggleLabelText = await toggleLabel.getText()
        assert.equal(toggleLabelText, 'ON')
      })

      it('finds the restored address in the contact list', async () => {
        const contactsButton = await driver.findElement(By.xpath(`//div[contains(text(), 'Contacts')]`))
        await contactsButton.click()
        await driver.delay(regularDelayMs)

        await driver.findElement(By.xpath(`//div[contains(text(), 'Test User Name 11')]`))
        await driver.delay(regularDelayMs)
      })
    })
  })
})
