const assert = require('assert')
const webdriver = require('selenium-webdriver')

const { By } = webdriver
const {
  regularDelayMs,
  largeDelayMs,
} = require('./helpers')
const { buildWebDriver } = require('./webdriver')
const enLocaleMessages = require('../../app/_locales/en/messages.json')

describe('Using MetaMask with an existing account', function () {
  let driver

  const testSeedPhrase = 'forum vessel pink push lonely enact gentle tail admit parrot grunt dress'

  const button = async (x) => {
    const buttoncheck = x
    await buttoncheck.click()
    await driver.delay(largeDelayMs)
    const [results] = await driver.findElements(By.css('#results'))
    const resulttext = await results.getText()
    const parsedData = JSON.parse(resulttext)

    return (parsedData)

  }

  this.timeout(0)
  this.bail(true)

  before(async function () {
    const result = await buildWebDriver()
    driver = result.driver
  })

  afterEach(async function () {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      const errors = await driver.checkBrowserForConsoleErrors(driver)
      if (errors.length) {
        const errorReports = errors.map((err) => err.message)
        const errorMessage = `Errors found in browser console:\n${errorReports.join('\n')}`
        console.error(new Error(errorMessage))
      }
    }
    if (this.currentTest.state === 'failed') {
      await driver.verboseReportOnFailure(this.currentTest.title)
    }
  })

  after(async function () {
    await driver.quit()
  })

  describe('First time flow starting from an existing seed phrase', function () {
    it('clicks the continue button on the welcome screen', async function () {
      await driver.findElement(By.css('.welcome-page__header'))
      await driver.clickElement(By.xpath(`//button[contains(text(), '${enLocaleMessages.getStarted.message}')]`))
      await driver.delay(largeDelayMs)
    })

    it('clicks the "Import Wallet" option', async function () {
      await driver.clickElement(By.xpath(`//button[contains(text(), 'Import wallet')]`))
      await driver.delay(largeDelayMs)
    })

    it('clicks the "No thanks" option on the metametrics opt-in screen', async function () {
      await driver.clickElement(By.css('.btn-default'))
      await driver.delay(largeDelayMs)
    })

    it('imports a seed phrase', async function () {
      const [seedTextArea] = await driver.findElements(By.css('input[placeholder="Paste seed phrase from clipboard"]'))
      await seedTextArea.sendKeys(testSeedPhrase)
      await driver.delay(regularDelayMs)

      const [password] = await driver.findElements(By.id('password'))
      await password.sendKeys('correct horse battery staple')
      const [confirmPassword] = await driver.findElements(By.id('confirm-password'))
      confirmPassword.sendKeys('correct horse battery staple')

      await driver.clickElement(By.css('.first-time-flow__terms'))

      await driver.clickElement(By.xpath(`//button[contains(text(), 'Import')]`))
      await driver.delay(regularDelayMs)
    })

    it('clicks through the success screen', async function () {
      await driver.findElement(By.xpath(`//div[contains(text(), 'Congratulations')]`))
      await driver.clickElement(By.xpath(`//button[contains(text(), '${enLocaleMessages.endOfFlowMessage10.message}')]`))
      await driver.delay(regularDelayMs)
    })
  })


  describe('opens dapp', function () {

    it('switches to mainnet', async function () {
      await driver.clickElement(By.css('.network-name'))
      await driver.delay(regularDelayMs)

      await driver.clickElement(By.xpath(`//span[contains(text(), 'Main Ethereum Network')]`))
      await driver.delay(largeDelayMs * 2)
    })

    it('connects to dapp', async function () {
      await driver.openNewPage('http://127.0.0.1:8080/')
      await driver.delay(regularDelayMs)

      await driver.clickElement(By.xpath(`//button[contains(text(), 'Connect')]`))

      await driver.delay(regularDelayMs)

      await driver.waitUntilXWindowHandles(3)
      const windowHandles = await driver.getAllWindowHandles()

      const extension = windowHandles[0]
      const popup = await driver.switchToWindowWithTitle('MetaMask Notification', windowHandles)
      const dapp = windowHandles.find((handle) => handle !== extension && handle !== popup)

      await driver.delay(regularDelayMs)
      await driver.clickElement(By.xpath(`//button[contains(text(), 'Connect')]`))

      await driver.switchToWindow(dapp)
      await driver.delay(regularDelayMs)
    })
  })

  describe('testing web3 methods', function () {


    it('testing hexa methods', async function () {


      const List = await driver.findClickableElements(By.className('hexaNumberMethods'))

      for (let i = 0; i < List.length; i++) {
        try {

          const parsedData = await button(List[i])
          console.log(parsedData)
          const result = parseInt(parsedData.result, 16)

          assert.equal((typeof result === 'number'), true)
          await driver.delay(regularDelayMs)
        } catch (err) {
          console.log(err)
          assert(false)

        }
      }
    })

    it('testing booleanMethods', async function () {

      const List = await driver.findClickableElement(By.className('booleanMethods'))

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

    it('testing  transactionMethods', async function () {

      const List = await driver.findClickableElement(By.className('transactionMethods'))

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


          result.forEach((value) => {
            assert.equal((typeof value === 'number'), true)
          })


        } catch (err) {

          console.log(err)
          assert(false)


        }
      }

    })

    it('testing blockMethods', async function () {

      const List = await driver.findClickableElement(By.className('blockMethods'))

      for (let i = 0; i < List.length; i++) {
        try {

          const parsedData = await button(List[i])
          console.log(JSON.stringify(parsedData) + i)

          console.log(parsedData.result.parentHash)

          const result = parseInt(parsedData.result.parentHash, 16)

          assert.equal((typeof result === 'number'), true)
          await driver.delay(regularDelayMs)
        } catch (err) {

          console.log(err)
          assert(false)


        }
      }
    })

    it('testing methods', async function () {

      const List = await driver.findClickableElement(By.className('methods'))
      let parsedData
      let result

      for (let i = 0; i < List.length; i++) {
        try {

          if (i === 2) {

            parsedData = await button(List[i])
            console.log(parsedData.result.blockHash)

            result = parseInt(parsedData.result.blockHash, 16)

            assert.equal((typeof result === 'number' || (result === 0)), true)
            await driver.delay(regularDelayMs)
          } else {
            parsedData = await button(List[i])
            console.log(parsedData.result)

            result = parseInt(parsedData.result, 16)

            assert.equal((typeof result === 'number' || (result === 0)), true)
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
