const assert = require('assert')
const webdriver = require('selenium-webdriver')

const { By, until } = webdriver
const { tinyDelayMs, regularDelayMs, largeDelayMs } = require('./helpers')
const { buildWebDriver } = require('./webdriver')
const Ganache = require('./ganache')
const enLocaleMessages = require('../../app/_locales/en/messages.json')

const ganacheServer = new Ganache()

describe('MetaMask', function () {
  let driver
  let publicAddress

  this.timeout(0)
  this.bail(true)

  before(async function () {
    await ganacheServer.start({
      accounts: [
        {
          secretKey:
            '0x250F458997A364988956409A164BA4E16F0F99F916ACDD73ADCD3A1DE30CF8D1',
          balance: 0,
        },
        {
          secretKey:
            '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
          balance: 25000000000000000000,
        },
      ],
    })
    const result = await buildWebDriver()
    driver = result.driver
  })

  afterEach(async function () {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      const errors = await driver.checkBrowserForConsoleErrors(driver)
      if (errors.length) {
        const errorReports = errors.map(err => err.message)
        const errorMessage = `Errors found in browser console:\n${errorReports.join(
          '\n'
        )}`
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

  describe('Going through the first time flow, but skipping the seed phrase challenge', () => {
    it('clicks the continue button on the welcome screen', async () => {
      await driver.findElement(By.css('.welcome-page__header'))
      const welcomeScreenBtn = await driver.findElement(
        By.xpath(
          `//button[contains(text(), '${enLocaleMessages.getStarted.message}')]`
        )
      )
      await welcomeScreenBtn.click()
      await driver.delay(largeDelayMs)
    })

    it('clicks the "Create New Wallet" option', async () => {
      const customRpcButton = await driver.findElement(
        By.xpath(`//button[contains(text(), 'Create a Wallet')]`)
      )
      await customRpcButton.click()
      await driver.delay(largeDelayMs)
    })

    it('clicks the "No thanks" option on the metametrics opt-in screen', async () => {
      const optOutButton = await driver.findElement(By.css('.btn-default'))
      await optOutButton.click()
      await driver.delay(largeDelayMs)
    })

    it('accepts a secure password', async () => {
      const passwordBox = await driver.findElement(
        By.css('.first-time-flow__form #create-password')
      )
      const passwordBoxConfirm = await driver.findElement(
        By.css('.first-time-flow__form #confirm-password')
      )
      const button = await driver.findElement(
        By.css('.first-time-flow__form button')
      )

      await passwordBox.sendKeys('correct horse battery staple')
      await passwordBoxConfirm.sendKeys('correct horse battery staple')

      const tosCheckBox = await driver.findElement(
        By.css('.first-time-flow__checkbox')
      )
      await tosCheckBox.click()

      await button.click()
      await driver.delay(regularDelayMs)
    })

    it('skips the seed phrase challenge', async () => {
      const button = await driver.findElement(
        By.xpath(
          `//button[contains(text(), '${enLocaleMessages.remindMeLater.message}')]`
        )
      )
      await button.click()
      await driver.delay(regularDelayMs)

      const detailsButton = await driver.findElement(
        By.css('.account-details__details-button')
      )
      await detailsButton.click()
      await driver.delay(regularDelayMs)
    })

    it('gets the current accounts address', async () => {
      const addressInput = await driver.findElement(By.css('.qr-ellip-address'))
      publicAddress = await addressInput.getAttribute('value')

      const accountModal = await driver.findElement(By.css('span .modal'))

      const accountModalClose = await driver.findElement(
        By.css('.account-modal-close')
      )
      await accountModalClose.click()

      await driver.wait(until.stalenessOf(accountModal))
      await driver.delay(regularDelayMs)
    })
  })

  describe('send to current account from dapp with different provider', () => {
    let extension

    it('switches to dapp screen', async () => {
      const windowHandles = await driver.getAllWindowHandles()
      extension = windowHandles[0]

      await driver.openNewPage('http://127.0.0.1:8080/')
      await driver.delay(regularDelayMs)
    })

    it('sends eth to the current account', async () => {
      const addressInput = await driver.findElement(By.css('#address'))
      await addressInput.sendKeys(publicAddress)
      await driver.delay(regularDelayMs)

      const sendButton = await driver.findElement(By.css('#send'))
      await sendButton.click()

      const txStatus = await driver.findElement(By.css('#success'))
      await driver.wait(until.elementTextMatches(txStatus, /Success/), 15000)
    })

    it('switches back to MetaMask', async () => {
      await driver.switchToWindow(extension)
    })

    it('should have the correct amount of eth', async () => {
      const balances = await driver.findElements(
        By.css('.currency-display-component__text')
      )
      await driver.wait(until.elementTextMatches(balances[0], /1/), 15000)
      const balance = await balances[0].getText()

      assert.equal(balance, '1')
    })
  })

  describe('backs up the seed phrase', () => {
    it('should show a backup reminder', async () => {
      const backupReminder = await driver.findElements(
        By.xpath(
          "//div[contains(@class, 'home-notification__text') and contains(text(), 'Backup your Secret Recovery code to keep your wallet and funds secure')]"
        )
      )
      assert.equal(backupReminder.length, 1)
    })

    it('should take the user to the seedphrase backup screen', async () => {
      const backupButton = await driver.findElement(
        By.css('.home-notification__accept-button')
      )
      await backupButton.click()
      await driver.delay(regularDelayMs)
    })

    let seedPhrase

    it('reveals the seed phrase', async () => {
      const byRevealButton = By.css(
        '.reveal-seed-phrase__secret-blocker .reveal-seed-phrase__reveal-button'
      )
      const revealSeedPhraseButton = await driver.findElement(byRevealButton)
      await revealSeedPhraseButton.click()
      await driver.delay(regularDelayMs)

      const revealedSeedPhrase = await driver.findElement(
        By.css('.reveal-seed-phrase__secret-words')
      )
      seedPhrase = await revealedSeedPhrase.getText()
      assert.equal(seedPhrase.split(' ').length, 12)
      await driver.delay(regularDelayMs)

      const nextScreen = await driver.findElement(
        By.xpath(
          `//button[contains(text(), '${enLocaleMessages.next.message}')]`
        )
      )
      await nextScreen.click()
      await driver.delay(regularDelayMs)
    })

    async function clickWordAndWait (word) {
      const xpath = `//div[contains(@class, 'confirm-seed-phrase__seed-word--shuffled') and not(contains(@class, 'confirm-seed-phrase__seed-word--selected')) and contains(text(), '${word}')]`
      const word0 = await driver.findElement(By.xpath(xpath))

      await word0.click()
      await driver.delay(tinyDelayMs)
    }

    it('can retype the seed phrase', async () => {
      const words = seedPhrase.split(' ')

      for (const word of words) {
        await clickWordAndWait(word)
      }

      const confirm = await driver.findElement(
        By.xpath(`//button[contains(text(), 'Confirm')]`)
      )
      await confirm.click()
      await driver.delay(regularDelayMs)
    })

    it('can click through the success screen', async () => {
      const confirm = await driver.findElement(
        By.xpath(`//button[contains(text(), 'All Done')]`)
      )
      await confirm.click()
      await driver.delay(regularDelayMs)
    })

    it('should have the correct amount of eth', async () => {
      const balances = await driver.findElements(
        By.css('.currency-display-component__text')
      )
      await driver.wait(until.elementTextMatches(balances[0], /1/), 15000)
      const balance = await balances[0].getText()

      assert.equal(balance, '1')
    })

    it('should not show a backup reminder', async () => {
      await driver.assertElementNotPresent(By.css('.backup-notification'))
    })
  })
})
