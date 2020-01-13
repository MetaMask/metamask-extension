const assert = require('assert')
const webdriver = require('selenium-webdriver')

const { By } = webdriver
const {
  prepareExtensionForTesting,
  regularDelayMs,
  largeDelayMs,
} = require('./helpers')
const enLocaleMessages = require('../../app/_locales/en/messages.json')

describe('Using MetaMask with an existing account', function () {
  let driver

  const testSeedPhrase =
    'forum vessel pink push lonely enact gentle tail admit parrot grunt dress'

  const button = async x => {
    const buttoncheck = x
    await buttoncheck.click()
    await driver.delay(largeDelayMs)
    const [results] = await driver.findElements(By.css('#results'))
    const resulttext = await results.getText()
    const parsedData = JSON.parse(resulttext)

    return parsedData
  }

  this.timeout(0)
  this.bail(true)

  before(async function () {
    const result = await prepareExtensionForTesting()
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
    await driver.quit()
  })

  describe('First time flow starting from an existing seed phrase', () => {
    it('clicks the continue button on the welcome screen', async () => {
      await driver.findElement(By.css('.welcome-page__header'))
      const welcomeScreenBtn = await driver.findElement(
        By.xpath(
          `//button[contains(text(), '${enLocaleMessages.getStarted.message}')]`
        )
      )
      welcomeScreenBtn.click()
      await driver.delay(largeDelayMs)
    })

    it('clicks the "Import Wallet" option', async () => {
      const customRpcButton = await driver.findElement(
        By.xpath(`//button[contains(text(), 'Import Wallet')]`)
      )
      customRpcButton.click()
      await driver.delay(largeDelayMs)
    })

    it('clicks the "No thanks" option on the metametrics opt-in screen', async () => {
      const optOutButton = await driver.findElement(By.css('.btn-default'))
      optOutButton.click()
      await driver.delay(largeDelayMs)
    })

    it('imports a seed phrase', async () => {
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

      const tosCheckBox = await driver.findElement(
        By.css('.first-time-flow__checkbox')
      )
      await tosCheckBox.click()

      const [importButton] = await driver.findElements(
        By.xpath(`//button[contains(text(), 'Import')]`)
      )
      await importButton.click()
      await driver.delay(regularDelayMs)
    })

    it('clicks through the success screen', async () => {
      await driver.findElement(
        By.xpath(`//div[contains(text(), 'Congratulations')]`)
      )
      const doneButton = await driver.findElement(
        By.xpath(
          `//button[contains(text(), '${enLocaleMessages.endOfFlowMessage10.message}')]`
        )
      )
      await doneButton.click()
      await driver.delay(regularDelayMs)
    })
  })

  describe('opens dapp', () => {
    it('switches to mainnet', async () => {
      const networkDropdown = await driver.findElement(By.css('.network-name'))
      await networkDropdown.click()
      await driver.delay(regularDelayMs)

      const [mainnet] = await driver.findElements(
        By.xpath(`//span[contains(text(), 'Main Ethereum Network')]`)
      )
      await mainnet.click()
      await driver.delay(largeDelayMs * 2)
    })

    it('connects to dapp', async () => {
      await driver.openNewPage('http://127.0.0.1:8080/')
      await driver.delay(regularDelayMs)

      const connectButton = await driver.findElement(
        By.xpath(`//button[contains(text(), 'Connect')]`)
      )
      await connectButton.click()

      await driver.delay(regularDelayMs)

      await driver.waitUntilXWindowHandles(3)
      const windowHandles = await driver.getAllWindowHandles()

      const extension = windowHandles[0]
      const popup = await driver.switchToWindowWithTitle(
        'MetaMask Notification',
        windowHandles
      )
      const dapp = windowHandles.find(
        handle => handle !== extension && handle !== popup
      )

      await driver.delay(regularDelayMs)
      const approveButton = await driver.findElement(
        By.xpath(`//button[contains(text(), 'Connect')]`)
      )
      await approveButton.click()

      await driver.switchToWindow(dapp)
      await driver.delay(regularDelayMs)
    })
  })

  describe('testing web3 methods', async () => {
    it('testing hexa methods', async () => {
      const List = await driver.findElements(By.className('hexaNumberMethods'))

      for (let i = 0; i < List.length; i++) {
        try {
          const parsedData = await button(List[i])
          console.log(parsedData)
          const result = parseInt(parsedData.result, 16)

          assert.equal(typeof result === 'number', true)
          await driver.delay(regularDelayMs)
        } catch (err) {
          console.log(err)
          assert(false)
        }
      }
    })

    it('testing booleanMethods', async () => {
      const List = await driver.findElements(By.className('booleanMethods'))

      for (let i = 0; i < List.length; i++) {
        try {
          const parsedData = await button(List[i])
          console.log(parsedData)
          const result = parsedData.result

          assert.equal(result, false)
          await driver.delay(regularDelayMs)
        } catch (err) {
          console.log(err)
          assert(false)
        }
      }
    })

    it('testing  transactionMethods', async () => {
      const List = await driver.findElements(By.className('transactionMethods'))

      for (let i = 0; i < List.length; i++) {
        try {
          const parsedData = await button(List[i])

          console.log(parsedData.result.blockHash)

          const result = []
          result.push(parseInt(parsedData.result.blockHash, 16))
          result.push(parseInt(parsedData.result.blockNumber, 16))
          result.push(parseInt(parsedData.result.gas, 16))
          result.push(parseInt(parsedData.result.gasPrice, 16))
          result.push(parseInt(parsedData.result.hash, 16))
          result.push(parseInt(parsedData.result.input, 16))
          result.push(parseInt(parsedData.result.nonce, 16))
          result.push(parseInt(parsedData.result.r, 16))
          result.push(parseInt(parsedData.result.s, 16))
          result.push(parseInt(parsedData.result.v, 16))
          result.push(parseInt(parsedData.result.to, 16))
          result.push(parseInt(parsedData.result.value, 16))

          result.forEach(value => {
            assert.equal(typeof value === 'number', true)
          })
        } catch (err) {
          console.log(err)
          assert(false)
        }
      }
    })

    it('testing blockMethods', async () => {
      const List = await driver.findElements(By.className('blockMethods'))

      for (let i = 0; i < List.length; i++) {
        try {
          const parsedData = await button(List[i])
          console.log(JSON.stringify(parsedData) + i)

          console.log(parsedData.result.parentHash)

          const result = parseInt(parsedData.result.parentHash, 16)

          assert.equal(typeof result === 'number', true)
          await driver.delay(regularDelayMs)
        } catch (err) {
          console.log(err)
          assert(false)
        }
      }
    })

    it('testing methods', async () => {
      const List = await driver.findElements(By.className('methods'))
      let parsedData
      let result

      for (let i = 0; i < List.length; i++) {
        try {
          if (i === 2) {
            parsedData = await button(List[i])
            console.log(parsedData.result.blockHash)

            result = parseInt(parsedData.result.blockHash, 16)

            assert.equal(typeof result === 'number' || result === 0, true)
            await driver.delay(regularDelayMs)
          } else {
            parsedData = await button(List[i])
            console.log(parsedData.result)

            result = parseInt(parsedData.result, 16)

            assert.equal(typeof result === 'number' || result === 0, true)
            await driver.delay(regularDelayMs)
          }
        } catch (err) {
          console.log(err)
          assert(false)
        }
      }
    })
  })
})
