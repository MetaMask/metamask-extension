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
} = require('../func')
const {
  checkBrowserForConsoleErrors,
  closeAllWindowHandlesExcept,
  findElement,
  findElements,
  loadExtension,
  openNewPage,
  verboseReportOnFailure,
  waitUntilXWindowHandles,
} = require('./helpers')

describe('MetaMask', function () {
  let extensionId
  let driver

  const testSeedPhrase = 'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent'
  const tinyDelayMs = 200
  const regularDelayMs = tinyDelayMs * 2
  const largeDelayMs = regularDelayMs * 2

  this.timeout(0)
  this.bail(true)

  before(async function () {
    switch (process.env.SELENIUM_BROWSER) {
      case 'chrome': {
        const extPath = path.resolve('dist/chrome')
        driver = buildChromeWebDriver(extPath)
        extensionId = await getExtensionIdChrome(driver)
        await driver.get(`chrome-extension://${extensionId}/popup.html`)
        break
      }
      case 'firefox': {
        const extPath = path.resolve('dist/firefox')
        driver = buildFirefoxWebdriver()
        await installWebExt(driver, extPath)
        await delay(700)
        extensionId = await getExtensionIdFirefox(driver)
        await driver.get(`moz-extension://${extensionId}/popup.html`)
      }
    }
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


  describe('New UI setup', async function () {
    it('switches to first tab', async function () {
      await delay(tinyDelayMs)
      const [firstTab] = await driver.getAllWindowHandles()
      await driver.switchTo().window(firstTab)
      await delay(regularDelayMs)
    })

    it('selects the new UI option', async () => {
      try {
        const overlay = await findElement(driver, By.css('.full-flex-height'))
        await driver.wait(until.stalenessOf(overlay))
      } catch (e) {}

      let button
      try {
        button = await findElement(driver, By.xpath("//button[contains(text(), 'Try it now')]"))
      } catch (e) {
        await loadExtension(driver, extensionId)
        await delay(largeDelayMs)
        button = await findElement(driver, By.xpath("//button[contains(text(), 'Try it now')]"))
      }
      await button.click()
      await delay(regularDelayMs)

      // Close all other tabs
      const [tab0, tab1, tab2] = await driver.getAllWindowHandles()
      await driver.switchTo().window(tab0)
      await delay(tinyDelayMs)

      let selectedUrl = await driver.getCurrentUrl()
      await delay(tinyDelayMs)
      if (tab0 && selectedUrl.match(/popup.html/)) {
        await closeAllWindowHandlesExcept(driver, tab0)
      } else if (tab1) {
        await driver.switchTo().window(tab1)
        selectedUrl = await driver.getCurrentUrl()
        await delay(tinyDelayMs)
        if (selectedUrl.match(/popup.html/)) {
          await closeAllWindowHandlesExcept(driver, tab1)
        } else if (tab2) {
          await driver.switchTo().window(tab2)
          selectedUrl = await driver.getCurrentUrl()
          selectedUrl.match(/popup.html/) && await closeAllWindowHandlesExcept(driver, tab2)
        }
      } else {
        throw new Error('popup.html not found')
      }
      await delay(regularDelayMs)
      const [appTab] = await driver.getAllWindowHandles()
      await driver.switchTo().window(appTab)
      await delay(tinyDelayMs)

      await loadExtension(driver, extensionId)
      await delay(regularDelayMs)

      const continueBtn = await findElement(driver, By.css('.welcome-screen__button'))
      await continueBtn.click()
      await delay(regularDelayMs)
    })
  })


  describe('First time flow starting from an existing seed phrase', () => {
    it('imports a seed phrase', async () => {
      const [seedPhrase] = await findElements(driver, By.xpath(`//a[contains(text(), 'Import with seed phrase')]`))
      await seedPhrase.click()
      await delay(regularDelayMs)

      const [seedTextArea] = await findElements(driver, By.css('textarea.import-account__secret-phrase'))
      await seedTextArea.sendKeys(testSeedPhrase)
      await delay(regularDelayMs)

      const [password] = await findElements(driver, By.id('password'))
      await password.sendKeys('correct horse battery staple')
      const [confirmPassword] = await findElements(driver, By.id('confirm-password'))
      confirmPassword.sendKeys('correct horse battery staple')

      const [importButton] = await findElements(driver, By.xpath(`//button[contains(text(), 'Import')]`))
      await importButton.click()
      await delay(regularDelayMs)
    })

    it('clicks through the ToS', async () => {
      // terms of use
      const canClickThrough = await driver.findElement(By.css('.tou button')).isEnabled()
      assert.equal(canClickThrough, false, 'disabled continue button')
      const bottomOfTos = await findElement(driver, By.linkText('Attributions'))
      await driver.executeScript('arguments[0].scrollIntoView(true)', bottomOfTos)
      await delay(regularDelayMs)
      const acceptTos = await findElement(driver, By.css('.tou button'))
      await acceptTos.click()
      await delay(regularDelayMs)
    })

    it('clicks through the privacy notice', async () => {
      // privacy notice
      const nextScreen = await findElement(driver, By.css('.tou button'))
      await nextScreen.click()
      await delay(regularDelayMs)
    })

    it('clicks through the phishing notice', async () => {
      // phishing notice
      const noticeElement = await driver.findElement(By.css('.markdown'))
      await driver.executeScript('arguments[0].scrollTop = arguments[0].scrollHeight', noticeElement)
      await delay(regularDelayMs)
      const nextScreen = await findElement(driver, By.css('.tou button'))
      await nextScreen.click()
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

  })

  describe('Drizzle', () => {
    it('should be able to detect our eth address', async () => {
      await openNewPage(driver, 'http://127.0.0.1:3000/')
      await delay(regularDelayMs)

      await waitUntilXWindowHandles(driver, 2)
      const windowHandles = await driver.getAllWindowHandles()
      const dapp = windowHandles[1]

      await driver.switchTo().window(dapp)
      await delay(regularDelayMs)


      const addressElement = await findElement(driver, By.css(`.pure-u-1-1 h4`))
      const addressText = await addressElement.getText()
      assert(addressText.match(/^0x[a-fA-F0-9]{40}$/))
    })
  })
})
