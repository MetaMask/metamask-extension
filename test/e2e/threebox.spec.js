const path = require('path')
const assert = require('assert')
const webdriver = require('selenium-webdriver')
const { By, until } = webdriver
const {
  delay,
  buildChromeWebDriver,
  buildFirefoxWebdriver,
  installWebExt,
  getExtensionIdChrome,
  getExtensionIdFirefox,
} = require('./func')
const {
  checkBrowserForConsoleErrors,
  closeAllWindowHandlesExcept,
  findElement,
  findElements,
  verboseReportOnFailure,
} = require('./helpers')
const fetchMockResponses = require('./fetch-mocks.js')

describe('MetaMask', function () {
  let extensionId
  let driver

  const testSeedPhrase = 'forum vessel pink push lonely enact gentle tail admit parrot grunt dress'
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
    console.log('tab1', tab1)
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
      '(args[0].match(/chromeextensionmm/)) { return ' +
      'Promise.resolve({ json: () => Promise.resolve(JSON.parse(\'' + fetchMockResponses.metametrics + '\')) }); } else if ' +
      '(args[0] === "https://dev.blockscale.net/api/gasexpress.json") { return ' +
      'Promise.resolve({ json: () => Promise.resolve(JSON.parse(\'' + fetchMockResponses.gasExpress + '\')) }); } ' +
      'return window.origFetch(...args); };' +
      'function cancelInfuraRequest(requestDetails) {' +
        'console.log("Canceling: " + requestDetails.url);' +
        'return {' +
          'cancel: true' +
        '};' +
     ' }' +
      'window.chrome && window.chrome.webRequest && window.chrome.webRequest.onBeforeRequest.addListener(' +
        'cancelInfuraRequest,' +
        '{urls: ["https://*.infura.io/*"]},' +
        '["blocking"]' +
      ');'
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

    describe('updates settings and address book', () => {
      it('goes to the settings screen', async () => {
        await driver.findElement(By.css('.account-menu__icon')).click()
        await delay(regularDelayMs)

        const settingsButton = await findElement(driver, By.xpath(`//div[contains(text(), 'Settings')]`))
        settingsButton.click()
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
    let extensionId2
    let driver2

    before(async function () {
      let extensionUrl2
      switch (process.env.SELENIUM_BROWSER) {
        case 'chrome': {
          const extPath2 = path.resolve('dist/chrome')
          driver2 = buildChromeWebDriver(extPath2)
          extensionId2 = await getExtensionIdChrome(driver2)
          await delay(largeDelayMs)
          extensionUrl2 = `chrome-extension://${extensionId2}/home.html`
          break
        }
        case 'firefox': {
          const extPath2 = path.resolve('dist/firefox')
          driver2 = buildFirefoxWebdriver()
          await installWebExt(driver2, extPath2)
          await delay(largeDelayMs)
          extensionId2 = await getExtensionIdFirefox(driver2)
          extensionUrl2 = `moz-extension://${extensionId2}/home.html`
          break
        }
      }

      // Depending on the state of the application built into the above directory (extPath) and the value of
      // METAMASK_DEBUG we will see different post-install behaviour and possibly some extra windows. Here we
      // are closing any extraneous windows to reset us to a single window before continuing.
      const [tab2] = await driver2.getAllWindowHandles()
      await closeAllWindowHandlesExcept(driver2, [tab2])
      await driver2.switchTo().window(tab2)
      await driver2.get(extensionUrl2)
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
