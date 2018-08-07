const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const assert = require('assert')
const pify = require('pify')
const webdriver = require('selenium-webdriver')
const { By, Key, until } = webdriver
const { delay, buildChromeWebDriver, buildFirefoxWebdriver, installWebExt, getExtensionIdChrome, getExtensionIdFirefox } = require('./func')

describe('Metamask popup page', function () {
  let driver, accountAddress, tokenAddress, extensionId

  this.timeout(0)

  before(async function () {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      const extPath = path.resolve('dist/chrome')
      driver = buildChromeWebDriver(extPath)
      extensionId = await getExtensionIdChrome(driver)
      await driver.get(`chrome-extension://${extensionId}/popup.html`)

    } else if (process.env.SELENIUM_BROWSER === 'firefox') {
      const extPath = path.resolve('dist/firefox')
      driver = buildFirefoxWebdriver()
      await installWebExt(driver, extPath)
      await delay(700)
      extensionId = await getExtensionIdFirefox(driver)
      await driver.get(`moz-extension://${extensionId}/popup.html`)
    }
  })

  afterEach(async function () {
    // logs command not supported in firefox
    // https://github.com/SeleniumHQ/selenium/issues/2910
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      // check for console errors
      const errors = await checkBrowserForConsoleErrors()
      if (errors.length) {
        const errorReports = errors.map(err => err.message)
        const errorMessage = `Errors found in browser console:\n${errorReports.join('\n')}`
        this.test.error(new Error(errorMessage))
      }
    }
    // gather extra data if test failed
    if (this.currentTest.state === 'failed') {
      await verboseReportOnFailure(this.currentTest)
    }
  })

  after(async function () {
    await driver.quit()
  })

  describe('Setup', function () {

    it('switches to Chrome extensions list', async function () {
      await delay(300)
      const windowHandles = await driver.getAllWindowHandles()
      await driver.switchTo().window(windowHandles[0])
    })

    it('does not select the new UI option', async () => {
      await delay(300)
      const button = await driver.findElement(By.xpath("//button[contains(text(), 'No thanks, maybe later')]"))
      await button.click()
      await delay(1000)
    })

    it('sets provider type to localhost', async function () {
      await delay(300)
      await setProviderType('localhost')
    })

  })

  describe('Account Creation', () => {

    it('matches MetaMask title', async () => {
      const title = await driver.getTitle()
      assert.equal(title, 'MetaMask', 'title matches MetaMask')
      await delay(300)
    })

    it('show terms of use', async () => {
      const terms = await driver.findElement(By.css('.terms-header')).getText()
      assert.equal(terms, 'TERMS OF USE', 'shows terms of use')
      delay(300)
    })

    it('checks if the TOU button is disabled', async () => {
      const button = await driver.findElement(By.css('button')).isEnabled()
      assert.equal(button, false, 'disabled continue button')
      const element = await driver.findElement(By.linkText('Attributions'))
      await driver.executeScript('arguments[0].scrollIntoView(true)', element)
      await delay(700)
    })

    it('allows the button to be clicked when scrolled to the bottom of TOU', async () => {
      const button = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div.flex-column.flex-center.flex-grow > button'))
      await button.click()
    })

    it('shows privacy notice', async () => {
      const privacy = await driver.findElement(By.css('.terms-header')).getText()
      assert.equal(privacy, 'PRIVACY NOTICE', 'shows privacy notice')
      await driver.findElement(By.css('button')).click()
      await delay(300)
    })

    it('shows phishing notice', async () => {
      await delay(300)
      const noticeHeader = await driver.findElement(By.css('.terms-header')).getText()
      assert.equal(noticeHeader, 'PHISHING WARNING', 'shows phishing warning')
      const element = await driver.findElement(By.css('.markdown'))
      await driver.executeScript('arguments[0].scrollTop = arguments[0].scrollHeight', element)
      await delay(300)
      await driver.findElement(By.css('button')).click()
      await delay(300)
    })

    it('accepts password with length of eight', async () => {
      const passwordBox = await driver.findElement(By.id('password-box'))
      const passwordBoxConfirm = await driver.findElement(By.id('password-box-confirm'))
      const button = await driver.findElements(By.css('button'))

      await passwordBox.sendKeys('123456789')
      await passwordBoxConfirm.sendKeys('123456789')
      await button[0].click()
      await delay(500)
    })

    it('shows value was created and seed phrase', async () => {
      await delay(300)
      const seedPhrase = await driver.findElement(By.css('.twelve-word-phrase')).getText()
      assert.equal(seedPhrase.split(' ').length, 12)
      const continueAfterSeedPhrase = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > button:nth-child(4)'))
      assert.equal(await continueAfterSeedPhrase.getText(), `I'VE COPIED IT SOMEWHERE SAFE`)
      await continueAfterSeedPhrase.click()
      await delay(300)
    })

    it('adds a second account', async function () {
      await driver.findElement(By.css('div.full-width > div > div:nth-child(2) > span > div')).click()
      await delay(300)
      await driver.findElement(By.css('div.full-width > div > div:nth-child(2) > span > div > div > span > div > li:nth-child(3) > span')).click()
    })

    it('shows account address', async function () {
      await delay(300)
      accountAddress = await driver.findElement(By.css('#app-content > div > div.app-primary.from-left > div > div > div:nth-child(1) > flex-column > div.flex-row > div')).getText()
    })

    it('logs out of the vault', async () => {
      await driver.findElement(By.css('.sandwich-expando')).click()
      await delay(500)
      const logoutButton = await driver.findElement(By.css('.menu-droppo > li:nth-child(3)'))
      assert.equal(await logoutButton.getText(), 'Log Out')
      await logoutButton.click()
    })

    it('accepts account password after lock', async () => {
      await delay(500)
      await driver.findElement(By.id('password-box')).sendKeys('123456789')
      await driver.findElement(By.id('password-box')).sendKeys(Key.ENTER)
      await delay(500)
    })

    it('shows QR code option', async () => {
      await delay(300)
      await driver.findElement(By.css('.fa-ellipsis-h')).click()
      await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div > div:nth-child(1) > flex-column > div.name-label > div > span > i > div > div > li:nth-child(3)')).click()
      await delay(300)
    })

    it('checks QR code address is the same as account details address', async () => {
      const QRaccountAddress = await driver.findElement(By.css('.ellip-address')).getText()
      assert.equal(accountAddress.toLowerCase(), QRaccountAddress)
      await driver.findElement(By.css('.fa-arrow-left')).click()
      await delay(500)
    })
  })

  describe('Import Ganache seed phrase', function () {

    it('logs out', async function () {
      await driver.findElement(By.css('.sandwich-expando')).click()
      await delay(200)
      const logOut = await driver.findElement(By.css('.menu-droppo > li:nth-child(3)'))
      assert.equal(await logOut.getText(), 'Log Out')
      await logOut.click()
      await delay(300)
    })

    it('restores from seed phrase', async function () {
      const restoreSeedLink = await driver.findElement(By.css('#app-content > div > div.app-primary.from-left > div > div.flex-row.flex-center.flex-grow > p'))
      assert.equal(await restoreSeedLink.getText(), 'Restore from seed phrase')
      await restoreSeedLink.click()
      await delay(100)
    })

    it('adds seed phrase', async function () {
      const testSeedPhrase = 'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent'
      const seedTextArea = await driver.findElement(By.css('#app-content > div > div.app-primary.from-left > div > textarea'))
      await seedTextArea.sendKeys(testSeedPhrase)

      await driver.findElement(By.id('password-box')).sendKeys('123456789')
      await driver.findElement(By.id('password-box-confirm')).sendKeys('123456789')
      await driver.findElement(By.css('#app-content > div > div.app-primary.from-left > div > div > button:nth-child(2)')).click()
      await delay(500)
    })

    it('balance renders', async function () {
      await delay(200)
      const balance = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div > div.flex-row > div.ether-balance.ether-balance-amount > div > div > div:nth-child(1) > div:nth-child(1)'))
      assert.equal(await balance.getText(), '100.000')
      await delay(200)
    })

    it('sends transaction', async function () {
     const sendButton = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div > div.flex-row > button:nth-child(4)'))
     assert.equal(await sendButton.getText(), 'SEND')
     await sendButton.click()
     await delay(200)
    })

    it('adds recipient address and amount', async function () {
      const sendTranscationScreen = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > h3:nth-child(2)')).getText()
      assert.equal(sendTranscationScreen, 'SEND TRANSACTION')
      const inputAddress = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > section:nth-child(3) > div > input'))
      const inputAmmount = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > section:nth-child(4) > input'))
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970')
      await inputAmmount.sendKeys('10')
      await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > section:nth-child(4) > button')).click()
      await delay(300)
    })

    it('confirms transaction', async function () {
      await delay(300)
      const bySubmitButton = By.css('#pending-tx-form > div.flex-row.flex-space-around.conf-buttons > input')
      const submitButton = await driver.wait(until.elementLocated(bySubmitButton))

      submitButton.click()

      await delay(1500)
    })

    it('finds the transaction in the transactions list', async function () {
      const tranasactionAmount = await driver.findElement(By.css('#app-content > div > div.app-primary.from-left > div > section > section > div > div > div > div.ether-balance.ether-balance-amount > div > div > div > div:nth-child(1)'))
      assert.equal(await tranasactionAmount.getText(), '10.0')
    })
  })

  describe('Token Factory', function () {

    it('navigates to token factory', async function () {
      await driver.get('http://tokenfactory.surge.sh/')
    })

    it('navigates to create token contract link', async function () {
      const createToken = await driver.findElement(By.css('#bs-example-navbar-collapse-1 > ul > li:nth-child(3) > a'))
      await createToken.click()
    })

    it('adds input for token', async function () {
      const totalSupply = await driver.findElement(By.css('#main > div > div > div > div:nth-child(2) > div > div:nth-child(5) > input'))
      const tokenName = await driver.findElement(By.css('#main > div > div > div > div:nth-child(2) > div > div:nth-child(6) > input'))
      const tokenDecimal = await driver.findElement(By.css('#main > div > div > div > div:nth-child(2) > div > div:nth-child(7) > input'))
      const tokenSymbol = await driver.findElement(By.css('#main > div > div > div > div:nth-child(2) > div > div:nth-child(8) > input'))
      const createToken = await driver.findElement(By.css('#main > div > div > div > div:nth-child(2) > div > button'))

      await totalSupply.sendKeys('100')
      await tokenName.sendKeys('Test')
      await tokenDecimal.sendKeys('0')
      await tokenSymbol.sendKeys('TST')
      await createToken.click()
      await delay(1000)
    })

    // There is an issue with blank confirmation window in Firefox, but the button is still there and the driver is able to clicked (?.?)
    it('confirms transaction in MetaMask popup', async function () {
      const windowHandles = await driver.getAllWindowHandles()
      await driver.switchTo().window(windowHandles[windowHandles.length - 1])
      const byMetamaskSubmit = By.css('#pending-tx-form > div.flex-row.flex-space-around.conf-buttons > input')
      const metamaskSubmit = await driver.wait(until.elementLocated(byMetamaskSubmit))
      await metamaskSubmit.click()
      await delay(1000)
    })

    it('switches back to Token Factory to grab the token contract address', async function () {
      const windowHandles = await driver.getAllWindowHandles()
      await driver.switchTo().window(windowHandles[0])
      const tokenContactAddress = await driver.findElement(By.css('#main > div > div > div > div:nth-child(2) > span:nth-child(3)'))
      tokenAddress = await tokenContactAddress.getText()
      await delay(500)
    })

    it('navigates back to MetaMask popup in the tab', async function () {
      if (process.env.SELENIUM_BROWSER === 'chrome') {
        await driver.get(`chrome-extension://${extensionId}/popup.html`)
      } else if (process.env.SELENIUM_BROWSER === 'firefox') {
        await driver.get(`moz-extension://${extensionId}/popup.html`)
      }
      await delay(700)
    })
  })

  describe('Add Token', function () {

    it('switches to the add token screen', async function () {
      const tokensTab = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > section > div > div.inactiveForm.pointer'))
      assert.equal(await tokensTab.getText(), 'TOKENS')
      await tokensTab.click()
      await delay(300)
    })

    it('navigates to the add token screen', async function () {
      const addTokenButton = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > section > div.full-flex-height > div > button'))
      assert.equal(await addTokenButton.getText(), 'ADD TOKEN')
      await addTokenButton.click()
    })

    it('checks add token screen rendered', async function () {
      const addTokenScreen = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div.section-title.flex-row.flex-center > h2'))
      assert.equal(await addTokenScreen.getText(), 'ADD TOKEN')
    })

    it('adds token parameters', async function () {
      const tokenContractAddress = await driver.findElement(By.css('#token-address'))
      await tokenContractAddress.sendKeys(tokenAddress)
      await delay(300)
      await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div.flex-column.flex-justify-center.flex-grow.select-none > div > button')).click()
      await delay(200)
    })

    it('checks the token balance', async function () {
      const tokenBalance = await driver.findElement(By.css('#app-content > div > div.app-primary.from-left > div > section > div.full-flex-height > ol > li:nth-child(2) > h3'))
      assert.equal(await tokenBalance.getText(), '100 TST')
    })
  })

  async function setProviderType (type) {
    await driver.executeScript('window.metamask.setProviderType(arguments[0])', type)
  }

  async function checkBrowserForConsoleErrors () {
    const ignoredLogTypes = ['WARNING']
    const ignoredErrorMessages = [
      // React throws error warnings on "dataset", but still sets the data-* properties correctly
      'Warning: Unknown prop `dataset` on ',
      // Third-party Favicon 404s show up as errors
      'favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)',
      // React Development build - known issue blocked by test build sys
      'Warning: It looks like you\'re using a minified copy of the development build of React.',
      // Redux Development build - known issue blocked by test build sys
      'This means that you are running a slower development build of Redux.',
    ]
    const browserLogs = await driver.manage().logs().get('browser')
    const errorEntries = browserLogs.filter(entry => !ignoredLogTypes.includes(entry.level.toString()))
    const errorObjects = errorEntries.map(entry => entry.toJSON())
    // ignore all errors that contain a message in `ignoredErrorMessages`
    const matchedErrorObjects = errorObjects.filter(entry => !ignoredErrorMessages.some(message => entry.message.includes(message)))
    return matchedErrorObjects
  }

  async function verboseReportOnFailure (test) {
    let artifactDir
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      artifactDir = `./test-artifacts/chrome/${test.title}`
    } else if (process.env.SELENIUM_BROWSER === 'firefox') {
      artifactDir = `./test-artifacts/firefox/${test.title}`
    }
    const filepathBase = `${artifactDir}/test-failure`
    await pify(mkdirp)(artifactDir)
    // capture screenshot
    const screenshot = await driver.takeScreenshot()
    await pify(fs.writeFile)(`${filepathBase}-screenshot.png`, screenshot, { encoding: 'base64' })
    // capture dom source
    const htmlSource = await driver.getPageSource()
    await pify(fs.writeFile)(`${filepathBase}-dom.html`, htmlSource)
  }

})
