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
  loadExtension,
  openNewPage,
  verboseReportOnFailure,
  waitUntilXWindowHandles,
  switchToWindowWithTitle,
} = require('./helpers')

describe('MetaMask', function () {
  let extensionId
  let driver

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

  describe('Going through the first time flow', () => {
    it('accepts a secure password', async () => {
      const passwordBox = await findElement(driver, By.css('.create-password #create-password'))
      const passwordBoxConfirm = await findElement(driver, By.css('.create-password #confirm-password'))
      const button = await findElement(driver, By.css('.create-password button'))

      await passwordBox.sendKeys('correct horse battery staple')
      await passwordBoxConfirm.sendKeys('correct horse battery staple')
      await button.click()
      await delay(regularDelayMs)
    })

    it('clicks through the unique image screen', async () => {
      const nextScreen = await findElement(driver, By.css('.unique-image button'))
      await nextScreen.click()
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
      driver.wait(until.elementIsEnabled(acceptTos))
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

    let seedPhrase

    it('reveals the seed phrase', async () => {
      const byRevealButton = By.css('.backup-phrase__secret-blocker .backup-phrase__reveal-button')
      await driver.wait(until.elementLocated(byRevealButton, 10000))
      const revealSeedPhraseButton = await findElement(driver, byRevealButton, 10000)
      await revealSeedPhraseButton.click()
      await delay(regularDelayMs)

      seedPhrase = await driver.findElement(By.css('.backup-phrase__secret-words')).getText()
      assert.equal(seedPhrase.split(' ').length, 12)
      await delay(regularDelayMs)

      const nextScreen = await findElement(driver, By.css('.backup-phrase button'))
      await nextScreen.click()
      await delay(regularDelayMs)
    })

    async function clickWordAndWait (word) {
      const xpathClass = 'backup-phrase__confirm-seed-option backup-phrase__confirm-seed-option--unselected'
      const xpath = `//button[@class='${xpathClass}' and contains(text(), '${word}')]`
      const word0 = await findElement(driver, By.xpath(xpath), 10000)

      await word0.click()
      await delay(tinyDelayMs)
    }

    async function retypeSeedPhrase (words, wasReloaded, count = 0) {
      try {
        if (wasReloaded) {
          const byRevealButton = By.css('.backup-phrase__secret-blocker .backup-phrase__reveal-button')
          await driver.wait(until.elementLocated(byRevealButton, 10000))
          const revealSeedPhraseButton = await findElement(driver, byRevealButton, 10000)
          await revealSeedPhraseButton.click()
          await delay(regularDelayMs)

          const nextScreen = await findElement(driver, By.css('.backup-phrase button'))
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
    let windowHandles
    let extension
    let popup
    let dapp

    it('should be able to connect the account', async () => {
      await openNewPage(driver, 'http://127.0.0.1:3000/')
      await delay(regularDelayMs)

      await waitUntilXWindowHandles(driver, 3)
      windowHandles = await driver.getAllWindowHandles()

      extension = windowHandles[0]
      popup = await switchToWindowWithTitle(driver, 'MetaMask Notification', windowHandles)
      dapp = windowHandles.find(handle => handle !== extension && handle !== popup)

      await delay(regularDelayMs)
      const approveButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Connect')]`))
      await approveButton.click()
    })

    it('should be able to detect our eth address', async () => {
      // Check if address exposed
      await driver.switchTo().window(dapp)
      await delay(regularDelayMs)

      const addressElement = await findElement(driver, By.css(`.pure-u-1-1 h4`))
      const addressText = await addressElement.getText()
      assert(addressText.match(/^0x[a-fA-F0-9]{40}$/))
    })
  })
})
