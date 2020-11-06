const assert = require('assert')
const webdriver = require('selenium-webdriver')

const { By, Key } = webdriver
const {
  tinyDelayMs,
  regularDelayMs,
  largeDelayMs,
  loadFixtures,
} = require('./helpers')
const enLocaleMessages = require('../../app/_locales/en/messages.json')

describe('Using MetaMask with an existing account', function() {
  let driver
  let unloadFixtures

  const testSeedPhrase =
    'forum vessel pink push lonely enact gentle tail admit parrot grunt dress'

  this.timeout(0)
  this.bail(true)

  before(async function() {
    const [d, u] = await loadFixtures({
      fixtures: 'default-state',
      ganacheOptions: {
        accounts: [
          {
            secretKey:
              '0x57ED903454DEC7321ABB1729A7A3BB0F39B617109F610A74F9B402AAEF955333',
            balance: 25000000000000000000,
          },
        ],
      },
    })
    driver = d
    unloadFixtures = u
  })

  afterEach(async function() {
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

  after(async function() {
    await unloadFixtures()
  })

  describe('First time flow starting from an existing seed phrase', function() {
    it('clicks the continue button on the welcome screen', async function() {
      await driver.findElement(By.css('.welcome-page__header'))
      await driver.clickElement(
        By.xpath(
          `//button[contains(text(), '${enLocaleMessages.getStarted.message}')]`
        )
      )
      await driver.delay(largeDelayMs)
    })

    it('clicks the "Import Wallet" option', async function() {
      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Import Wallet')]`)
      )
      await driver.delay(largeDelayMs)
    })

    it('clicks the "No thanks" option on the metametrics opt-in screen', async function() {
      await driver.clickElement(By.css('.btn-default'))
      await driver.delay(largeDelayMs)
    })

    it('imports a seed phrase', async function() {
      const [seedTextArea] = await driver.findElements(
        By.css('textarea.first-time-flow__textarea')
      )
      await seedTextArea.sendKeys(testSeedPhrase)
      await driver.delay(regularDelayMs)

      const [password] = await driver.findElements(By.id('password'))
      await password.sendKeys('correct horse battery staple')
      const [confirmPassword] = await driver.findElements(
        By.id('confirm-password')
      )
      confirmPassword.sendKeys('correct horse battery staple')

      await driver.clickElement(By.css('.first-time-flow__checkbox'))

      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Import')]`)
      )
      await driver.delay(regularDelayMs)
    })

    it('clicks through the success screen', async function() {
      await driver.findElement(
        By.xpath(`//div[contains(text(), 'Congratulations')]`)
      )
      await driver.clickElement(
        By.xpath(
          `//button[contains(text(), '${enLocaleMessages.endOfFlowMessage10.message}')]`
        )
      )
      await driver.delay(regularDelayMs)
    })
  })

  describe('Send ETH from inside MetaMask', function() {
    it('starts a send transaction', async function() {
      await driver.clickElement(By.xpath(`//button[contains(text(), 'Send')]`))
      await driver.delay(regularDelayMs)

      const inputAddress = await driver.findElement(
        By.css('input[placeholder="Search, public address (0x1 or 0x8)"]')
      )
      await inputAddress.sendKeys('0x1f318c334780961fb129d2a6c30d0763d9a5c970')

      const inputAmount = await driver.findElement(By.css('.unit-input__input'))
      await inputAmount.sendKeys('1')

      // Set the gas limit
      // await driver.clickElement(By.css('.advanced-gas-options-btn'))
      await driver.delay(regularDelayMs)

      // const gasModal = await driver.findElement(By.css('span .modal'))

      const [gasPriceInput, gasLimitInput] = await driver.findElements(
        By.css('.advanced-gas-inputs__gas-edit-row__input')
      )

      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasPriceInput.sendKeys('10')
      await driver.delay(50)
      await driver.delay(tinyDelayMs)
      await driver.delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)

      await gasLimitInput.sendKeys('25000')

      await driver.delay(1000)

      // await driver.clickElement(By.xpath(`//button[contains(text(), 'Save')]`))
      // await driver.wait(until.stalenessOf(gasModal))
      // await driver.delay(regularDelayMs)

      // Continue to next screen
      await driver.clickElement(By.xpath(`//button[contains(text(), 'Next')]`))
      await driver.delay(regularDelayMs)
    })

    it('has correct value and fee on the confirm screen the transaction', async function() {
      const transactionAmounts = await driver.findElements(
        By.css('.currency-display-component__text')
      )
      const transactionAmount = transactionAmounts[0]
      assert.equal(await transactionAmount.getText(), '1')

      // const transactionFee = transactionAmounts[1]
      // assert.equal(await transactionFee.getText(), '0.00025')
    })

    it('edits the transaction', async function() {
      await driver.clickElement(
        By.css('.confirm-page-container-header__back-button')
      )

      await driver.delay(regularDelayMs)

      const inputAmount = await driver.findElement(By.css('.unit-input__input'))
      await inputAmount.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await inputAmount.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await inputAmount.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await inputAmount.sendKeys('2.2')

      // await driver.clickElement(By.css('.advanced-gas-options-btn'))
      await driver.delay(regularDelayMs)

      // const gasModal = await driver.findElement(By.css('span .modal'))

      const [gasPriceInput, gasLimitInput] = await driver.findElements(
        By.css('.advanced-gas-inputs__gas-edit-row__input')
      )

      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasPriceInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasPriceInput.sendKeys('8')
      await driver.delay(50)
      await driver.delay(tinyDelayMs)
      await driver.delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)
      await gasLimitInput.sendKeys(Key.BACK_SPACE)
      await driver.delay(50)

      await gasLimitInput.sendKeys('100000')

      await driver.delay(1000)

      // await driver.clickElement(By.xpath(`//button[contains(text(), 'Save')]`))
      // await driver.wait(until.stalenessOf(gasModal))
      // await driver.delay(regularDelayMs)

      await driver.clickElement(By.xpath(`//button[contains(text(), 'Next')]`))
      await driver.delay(regularDelayMs)
    })

    it('has correct updated value on the confirm screen the transaction', async function() {
      const transactionAmounts = await driver.findElements(
        By.css('.currency-display-component__text')
      )

      const transactionAmount = transactionAmounts[0]
      assert.equal(await transactionAmount.getText(), '2.2')

      const gasFee = transactionAmounts[2]
      assert.equal(await gasFee.getText(), '0.0008')

      const transactionTotal = transactionAmounts[3]
      assert.equal(await transactionTotal.getText(), '2.2008')
    })

    it('confirms the transaction', async function() {
      await driver.clickElement(
        By.xpath(`//button[contains(text(), 'Confirm')]`)
      )
      await driver.delay(regularDelayMs)
    })

    it('finds the transaction in the transactions list', async function() {
      await driver.wait(async () => {
        const confirmedTxes = await driver.findElements(
          By.css(
            '.transaction-list__completed-transactions .transaction-list-item'
          )
        )
        return confirmedTxes.length === 1
      }, 10000)

      const txValues = await driver.findElements(
        By.css('.transaction-list-item__amount--primary')
      )
      assert.equal(txValues.length, 1)
      assert.ok(/-2.2\s*CFX/.test(await txValues[0].getText()))
    })
  })
})
