const assert = require('assert')
const webdriver = require('selenium-webdriver')
const { By, until } = webdriver
const {
  delay,
} = require('./func')
const {
  assertElementNotPresent,
  checkBrowserForConsoleErrors,
  findElement,
  findElements,
  loadExtension,
  openNewPage,
  verboseReportOnFailure,
  setupFetchMocking,
  prepareExtensionForTesting,
} = require('./helpers')

describe('MetaMask', function () {
  let extensionId
  let driver
  let publicAddress

  const tinyDelayMs = 200
  const regularDelayMs = tinyDelayMs * 2
  const largeDelayMs = regularDelayMs * 2

  this.timeout(0)
  this.bail(true)

  before(async function () {
    const result = await prepareExtensionForTesting()
    driver = result.driver
    extensionId = result.extensionId
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

  describe('Going through the first time flow, but skipping the seed phrase challenge', () => {
    it('clicks the continue button on the welcome screen', async () => {
      await findElement(driver, By.css('.welcome-page__header'))
      const welcomeScreenBtn = await findElement(driver, By.css('.first-time-flow__button'))
      welcomeScreenBtn.click()
      await delay(largeDelayMs)
    })

    it('clicks the "Create New Wallet" option', async () => {
      const customRpcButton = await findElement(driver, By.xpath(`//button[contains(text(), 'Create a Wallet')]`))
      customRpcButton.click()
      await delay(largeDelayMs)
    })

    it('clicks the "No thanks" option on the metametrics opt-in screen', async () => {
      const optOutButton = await findElement(driver, By.css('.btn-default'))
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

    it('skips the seed phrase challenge', async () => {
      const buttons = await findElements(driver, By.css('.first-time-flow__button'))
      await buttons[0].click()
      await delay(regularDelayMs)

      const detailsButton = await findElement(driver, By.css('.account-details__details-button'))
      await detailsButton.click()
      await delay(regularDelayMs)
    })

    it('gets the current accounts address', async () => {
      const addressInput = await findElement(driver, By.css('.qr-ellip-address'))
      publicAddress = await addressInput.getAttribute('value')

      const accountModal = await driver.findElement(By.css('span .modal'))

      await driver.executeScript("document.querySelector('.account-modal-close').click()")

      await driver.wait(until.stalenessOf(accountModal))
      await delay(regularDelayMs)
    })

  })

  describe('send to current account from dapp with different provider', () => {
    let extension

    it('switches to dapp screen', async () => {
      const windowHandles = await driver.getAllWindowHandles()
      extension = windowHandles[0]

      await openNewPage(driver, 'http://127.0.0.1:8080/')
      await delay(regularDelayMs)
    })

    it('sends eth to the current account', async () => {
      const addressInput = await findElement(driver, By.css('#address'))
      await addressInput.sendKeys(publicAddress)
      await delay(regularDelayMs)

      const sendButton = await findElement(driver, By.css('#send'))
      await sendButton.click()

      const txStatus = await findElement(driver, By.css('#success'))
      await driver.wait(until.elementTextMatches(txStatus, /Success/), 15000)
    })

    it('switches back to MetaMask', async () => {
      await driver.switchTo().window(extension)
    })

    it('should have the correct amount of eth', async () => {
      const balances = await findElements(driver, By.css('.currency-display-component__text'))
      await driver.wait(until.elementTextMatches(balances[0], /1/), 15000)
      const balance = await balances[0].getText()

      assert.equal(balance, '1')
    })
  })

  describe('backs up the seed phrase', () => {
    it('should show a backup reminder', async () => {
      const backupReminder = await findElements(driver, By.xpath("//div[contains(@class, 'home-notification__text') and contains(text(), 'Backup your Secret Recovery code to keep your wallet and funds secure')]"))
      assert.equal(backupReminder.length, 1)
    })

    it('should take the user to the seedphrase backup screen', async () => {
      const backupButton = await findElement(driver, By.css('.home-notification__accept-button'))
      await backupButton.click()
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

      const nextScreen = (await findElements(driver, By.css('button.first-time-flow__button')))[1]
      await nextScreen.click()
      await delay(regularDelayMs)
    })

    async function clickWordAndWait (word) {
      const xpath = `//div[contains(@class, 'confirm-seed-phrase__seed-word--shuffled') and not(contains(@class, 'confirm-seed-phrase__seed-word--selected')) and contains(text(), '${word}')]`
      const word0 = await findElement(driver, By.xpath(xpath), 10000)

      await word0.click()
      await delay(tinyDelayMs)
    }

    async function retypeSeedPhrase (words, wasReloaded, count = 0) {
      try {
        if (wasReloaded) {
          const byRevealButton = By.css('.reveal-seed-phrase__secret-blocker .reveal-seed-phrase__reveal-button')
          await driver.wait(until.elementLocated(byRevealButton, 10000))
          const revealSeedPhraseButton = await findElement(driver, byRevealButton, 10000)
          await revealSeedPhraseButton.click()
          await delay(regularDelayMs)

          const nextScreen = await findElement(driver, By.css('button.first-time-flow__button'))
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

    it('can click through the success screen', async () => {
      const confirm = await findElement(driver, By.xpath(`//button[contains(text(), 'All Done')]`))
      await confirm.click()
      await delay(regularDelayMs)
    })

    it('should have the correct amount of eth', async () => {
      const balances = await findElements(driver, By.css('.currency-display-component__text'))
      await driver.wait(until.elementTextMatches(balances[0], /1/), 15000)
      const balance = await balances[0].getText()

      assert.equal(balance, '1')
    })

    it('should not show a backup reminder', async () => {
      await assertElementNotPresent(webdriver, driver, By.css('.backup-notification'))
    })
  })
})
