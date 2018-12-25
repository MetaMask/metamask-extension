const Web3 = require('web3')
const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const assert = require('assert')
const pify = require('pify')
const webdriver = require('selenium-webdriver')
const { By, Key } = webdriver
const { delay, buildChromeWebDriver, buildFirefoxWebdriver, installWebExt, getExtensionIdChrome, getExtensionIdFirefox } = require('./func')
const { menus, screens, elements, NETWORKS } = require('./elements')
const testSeedPhrase = 'horn among position unable audit puzzle cannon apology gun autumn plug parrot'
const account1 = '0x2E428ABd9313D256d64D1f69fe3929C3BE18fD1f'
const account2 = '0xd7b7AFeCa35e32594e29504771aC847E2a803742'
const createdAccounts =[]
const eventsEmitter = 'https://vbaranov.github.io/event-listener-dapp/'

describe('Metamask popup page', async function () {
  let driver, accountAddress, tokenAddress, extensionId
  let password = '123456789'
  const newPassword = {
    correct: 'abcDEF123!@#',
    short: '123',
    incorrect: '1234567890',
  }
  const token = { supply: 101, name: 'Test', decimals: 0, ticker: 'ABC' }

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
        console.log(errorMessage)
      }
    }
    // gather extra data if test failed
    if (this.currentTest.state === 'failed') {
      await verboseReportOnFailure(this.currentTest)
    }
  })

  after(async function () {
    // await driver.quit()
  })

  describe('Setup', async function () {

    it('switches to extensions list', async function () {
      await delay(300)
      await switchToFirstPage()
      await delay(5000)
    })
  })

  describe('Log In', async () => {

    it('title is \'Nifty Wallet\'', async () => {
      const title = await driver.getTitle()
      assert.equal(title, 'Nifty Wallet', 'title is incorrect')
    })

    it('screen \'Terms of Use\' has not empty agreement', async () => {
      await delay(5000)
      const terms = await waitUntilShowUp(screens.TOU.agreement, 900)
      const text = await terms.getText()
      assert.equal(text.length > 400, true, 'agreement is too short')
    })

    it('screen \'Terms of Use\' has correct title', async () => {
      const terms = await waitUntilShowUp(screens.TOU.title)
      assert.equal(await terms.getText(), screens.TOU.titleText, 'title is incorrect')
    })

    it('checks if the TOU contains link \'Terms of service\'', async () => {
      const element = await driver.findElement(screens.TOU.linkTerms)
      await scrollTo(screens.TOU.linkTerms)
      assert.notEqual(element, null, ' link \'Terms of service\' isn\'t present')
      assert.equal(await element.getText(), screens.TOU.linkTermsText, 'incorrect name of link \'Terms of service\'')
    })

    it('checks if the button \'Accept\' is present and enabled', async () => {
      const button = await waitUntilShowUp(screens.TOU.button)
      assert.notEqual(button, false, 'button isn\'t present')
      assert.equal(await button.isEnabled(), true, 'button isn\'t enabled')
      assert.equal(await button.getText(), 'Accept', 'button has incorrect name')
      await click(button)
    })

    it('accepts password with length of eight', async () => {
      const passwordBox = await waitUntilShowUp(screens.create.fieldPassword)
      const passwordBoxConfirm = await waitUntilShowUp(screens.create.fieldPasswordConfirm)
      const button = await waitUntilShowUp(screens.create.button)
      assert.equal(await button.getText(), 'Create', 'button has incorrect name')
      await passwordBox.sendKeys(password)
      await passwordBoxConfirm.sendKeys(password)
      await click(button)
    })

    it('shows vault was created and seed phrase', async () => {
      await delay(300)
      const element = await waitUntilShowUp(screens.seedPhrase.fieldPhrase)
      const seedPhrase = await element.getText()
      assert.equal(seedPhrase.split(' ').length, 12)
      const continueAfterSeedPhrase = await waitUntilShowUp(screens.seedPhrase.buttonIveCopied)
      assert.equal(await continueAfterSeedPhrase.getText(), screens.seedPhrase.textButtonIveCopied)
      await click(continueAfterSeedPhrase)
    })
  })
  describe('Account Creation', async () => {
    const newAccountName = 'new name'

    it('sets provider type to localhost', async function () {
      await setProvider(NETWORKS.LOCALHOST)
      await delay(2000)
    })

    it('copy icon is displayed and clickable', async () => {
      const field = await waitUntilShowUp(screens.main.iconCopy)
      await field.click()
      assert.notEqual(field, false, 'copy icon doesn\'t present')
    })

    it("Account's address is displayed and has length 20 symbols", async () => {
      const field = await waitUntilShowUp(screens.main.address)
      createdAccounts.push((await field.getText()).toUpperCase())
      console.log(createdAccounts[0])
      assert.notEqual(createdAccounts[0].length, 20, "address isn't displayed")
    })

    it("open 'Account name' change dialog", async () => {
      const menu = await waitUntilShowUp(menus.dot.menu)
      await menu.click()
      const field = await waitUntilShowUp(screens.main.edit)
      await field.click()
      const accountName = await waitUntilShowUp(screens.main.fieldAccountName)
      assert.notEqual(accountName, false, '\'Account name\' change dialog isn\'t opened')
      assert.equal(await accountName.getAttribute('value'), 'Account 1', 'incorrect account name')
    })

    it('fill out new account\'s name', async () => {
      const field = await waitUntilShowUp(screens.main.fieldAccountName)
      await field.clear()
      await field.sendKeys(newAccountName)
    })

    it('dialog \'Account name\' is disappeared if click button \'Save\'', async () => {
      const button = await waitUntilShowUp(screens.main.buttons.save)
      assert.equal(await button.getText(), 'Save', 'button has incorrect name')
      assert.notEqual(button, true, 'button \'Save\' does not present')
      await click(button)
      const accountName = await waitUntilShowUp(screens.main.fieldAccountName, 10)
      assert.equal(accountName, false, '\'Account name\' change dialog isn\'t opened')
    })

    it('account has new name', async function () {
      const accountMenu = await waitUntilShowUp(menus.account.menu)
      await accountMenu.click()
      const account1 = await waitUntilShowUp(menus.account.account1)
      assert.equal(await account1.getText(), newAccountName, 'account\'s name didn\'t changed')
      await accountMenu.click()
    })

    it('adds a second account', async function () {
      const accountMenu = await waitUntilShowUp(menus.account.menu)
      await accountMenu.click()
      const item = await waitUntilShowUp(menus.account.createAccount)
      await item.click()
    })

    it("Account's address is displayed and has length 20 symbols", async () => {
      const field = await waitUntilShowUp(screens.main.address)
      createdAccounts.push((await field.getText()).toUpperCase())
      console.log(createdAccounts[1])
      assert.notEqual(createdAccounts[1].length, 20, "address isn't displayed")
    })

    it('logs out of the vault', async () => {
      const menu = await waitUntilShowUp(menus.sandwich.menu)
      await menu.click()
      await delay(500)
      const button = await waitUntilShowUp(menus.sandwich.logOut)
      assert.equal(await button.getText(), 'Log Out', 'button has incorrect name')
      await button.click()
    })

    it('accepts account password after lock', async () => {
      const box = await waitUntilShowUp(screens.lock.fieldPassword)
      await box.sendKeys(password)
      const button = await waitUntilShowUp(screens.lock.buttonLogin)
      assert.equal(await button.getText(), 'Log In', 'button has incorrect name')
      await click(button)
    })

    it('shows QR code option', async () => {
      const menu = await waitUntilShowUp(menus.dot.menu)
      await menu.click()
      const item = await waitUntilShowUp(menus.dot.showQRcode)
      await item.click()
    })

    it('checks QR code address is the same as account details address', async () => {
      const field = await waitUntilShowUp(screens.QRcode.address)
      const text = await field.getText()
      assert.equal(text.toUpperCase(), createdAccounts[1], 'QR address doesn\'t match')
    })

    it('copy icon is displayed and clickable', async () => {
      const field = await waitUntilShowUp(screens.QRcode.iconCopy)
      await field.click()
      assert.notEqual(field, false, 'copy icon doesn\'t present')
    })

    it('close QR code screen by clicking button arrow', async () => {
      const button = await waitUntilShowUp(screens.QRcode.buttonArrow)
      await click(button)
    })

    it('user is able to open \'Info\' screen', async function () {
      const accountMenu = await waitUntilShowUp(menus.sandwich.menu)
      await accountMenu.click()
      const item = await waitUntilShowUp(menus.sandwich.info)
      await item.click()
    })

    it('screen \'Info\' has correct title', async function () {
      const title = await waitUntilShowUp(screens.info.title)
      assert.equal(await title.getText(), screens.info.titleText, 'title is incorrect')
    })
    it('close \'Info\' screen by clicking button arrow', async () => {
      const button = await waitUntilShowUp(screens.info.buttonArrow)
      await button.click()
    })
  })
  describe('Import Account', () => {

    it('opens import account menu', async function () {
      await setProvider(NETWORKS.POA)
      await delay(2000)
      const menu = await waitUntilShowUp(menus.account.menu)
      await menu.click()
      const item = await waitUntilShowUp(menus.account.import)
      await item.click()
      const importAccountTitle = await waitUntilShowUp(screens.importAccounts.title)
      assert.equal(await importAccountTitle.getText(), screens.importAccounts.textTitle)
    })

    it('imports account', async function () {
      const privateKeyBox = await waitUntilShowUp(screens.importAccounts.fieldPrivateKey)
      await privateKeyBox.sendKeys('76bd0ced0a47055bb5d060e1ae4a8cb3ece658d668823e250dae6e79d3ab4435')// 0xf4702CbA917260b2D6731Aea6385215073e8551b
      const button = await waitUntilShowUp(screens.importAccounts.buttonImport)
      await click(button)
      assert.equal(await button.getText(), 'Import', 'button has incorrect name')
      const menu = await waitUntilShowUp(menus.account.menu)
      await menu.click()
      await waitUntilShowUp(menus.account.labelImported)
      const label = (await driver.findElements(menus.account.labelImported))[0]
      assert.equal(await label.getText(), 'IMPORTED')
      await menu.click()
    })

    it('Auto-detect tokens for POA core network ', async function () {
      // await setProvider(NETWORKS.POA)
      const tab = await waitUntilShowUp(screens.main.tokens.menu)
      await tab.click()
      const balance = await waitUntilShowUp(screens.main.tokens.balance)
      console.log(await balance.getText())
      assert.equal(await balance.getText(), '1 DOPR', 'token isnt\' auto-detected')
    })

    it.skip('Auto-detect tokens for MAIN core network ', async function () {
      await setProvider(NETWORKS.MAINNET)
      await waitUntilShowUp(elements.loader, 25)
      await waitUntilDisappear(elements.loader, 25)
      const balance = await waitUntilShowUp(screens.main.tokens.balance)
      console.log(await balance.getText())
      assert.equal(await balance.getText(), '0.001 WETH', 'token isnt\' auto-detected')
    })
    it('opens delete imported account screen', async function () {
      const menu = await waitUntilShowUp(menus.account.menu)
      await menu.click()
      const item = await waitUntilShowUp(menus.account.delete)
      await item.click()
      const deleteImportedAccountTitle = await waitUntilShowUp(screens.deleteImportedAccount.title)
      assert.equal(await deleteImportedAccountTitle.getText(), screens.deleteImportedAccount.titleText)
    })

    it('doesn\'t remove imported account with \'No\' button', async function () {
      const button = await waitUntilShowUp(screens.deleteImportedAccount.buttons.no)
      assert.equal(await button.getText(), 'No', 'button has incorrect name')
      await click(button)
      const settingsTitle = await waitUntilShowUp(screens.settings.title)
      assert.equal(await settingsTitle.getText(), 'Settings')
      // check, that imported account still exists
      const menu = await waitUntilShowUp(menus.account.menu)
      await menu.click()
      const importedLabel = await waitUntilShowUp(menus.account.labelImported)
      assert.equal(await importedLabel.getText(), 'IMPORTED')
    })

    it('opens delete imported account screen again', async function () {
      const menu = await waitUntilShowUp(menus.account.delete)
      await menu.click()
    })

    it('removes imported account with \'Yes\' button', async function () {
      const button = await waitUntilShowUp(screens.deleteImportedAccount.buttons.yes)
      assert.equal(await button.getText(), 'Yes', 'button has incorrect name')
      await click(button)
      const settingsTitle = await waitUntilShowUp(screens.settings.title)
      assert.equal(await settingsTitle.getText(), 'Settings')
      // check, that imported account is removed
      const menu = await waitUntilShowUp(menus.account.menu)
      await menu.click()
      await waitUntilShowUp(menus.account.labelImported, 25)
      const importedAccounts = await driver.findElements(menus.account.labelImported)
      assert.ok(importedAccounts.length === 0)
      await menu.click()
    })

  })
  describe('Import Contract account', async () => {
    // const poaContract = '0xc6468767214c577013a904900ada0a0dd6653bc3'
    const contractSokol = '0x215b2ab35749e5a9f3efe890de602fb9844e842f'
    console.log('Contract ' + contractSokol + ' , Sokol')
    const wrongAddress = '0xB87b6077D59B01Ab9fa8cd5A1A21D02a4d60D35'
    const notContractAddress = '0x56B2e3C3cFf7f3921Dc2e0F8B8e20d1eEc29216b'

    describe('Import Contract', async () => {
      it('opens import account menu', async function () {
        await setProvider(NETWORKS.ROPSTEN)
        const menu = await waitUntilShowUp(menus.account.menu)
        await menu.click()
        const item = await waitUntilShowUp(menus.account.import)
        await item.click()
        const importAccountTitle = await waitUntilShowUp(screens.importAccounts.title)
        assert.equal(await importAccountTitle.getText(), screens.importAccounts.textTitle)
      })

      it("Warning's  text is correct", async function () {
        const field = await waitUntilShowUp(screens.importAccounts.warning)
        assert.equal(await field.getText(), 'Imported accounts will not be associated with your originally created Nifty Wallet account seedphrase.', "incorrect warning's text")
      })

      it("Select type 'Contract'", async function () {
        const field = await waitUntilShowUp(screens.importAccounts.selectArrow)
        await field.click()
        const item = await waitUntilShowUp(screens.importAccounts.itemContract)
        await item.click()
      })

      it("Field 'Address' is displayed", async function () {
        const field = await waitUntilShowUp(screens.importAccounts.contractAddress)
        assert.notEqual(field, false, "field 'Address' isn't displayed")
        await field.sendKeys(wrongAddress)
      })

      it("Button 'Import' is displayed", async function () {
        const button = await waitUntilShowUp(screens.importAccounts.buttonImport)
        assert.notEqual(button, false, "button 'Import' isn't displayed")
        assert.equal(await button.getText(), 'Import', 'wrong name of button')
      })

      it("Button 'Import' is disabled  if incorrect address", async function () {
        const button = await waitUntilShowUp(screens.importAccounts.buttonImport)
        assert.equal(await button.isEnabled(), false, 'button enabled')
      })

      it("Field 'ABI' is displayed", async function () {
        const field = await waitUntilShowUp(screens.importAccounts.contractABI)
        assert.notEqual(field, false, "field 'ABI' isn't displayed")
      })

      it('icon copy is displayed for ABI ', async function () {
        const field = await waitUntilShowUp(screens.importAccounts.iconCopy)
        assert.notEqual(field, false, "icon copy isn't displayed")
      })

      it("Field 'ABI' is empty if contract isn't verified in current network", async function () {
        const field = await waitUntilShowUp(screens.importAccounts.contractABI)
        assert.equal(await field.getText(), '', "field 'ABI' isn't displayed")
      })
      it("Fill 'Address' with not contract address , SOKOL", async function () {
        await setProvider(NETWORKS.SOKOL)
        const field = await waitUntilShowUp(screens.importAccounts.contractAddress)
        await clearField(field, 100)
        await field.sendKeys(notContractAddress)
      })

      it("Button 'Import' is disabled  if not contract address", async function () {
        const button = await waitUntilShowUp(screens.importAccounts.buttonImport)
        assert.equal(await button.isEnabled(), false, 'button enabled')
      })

      it("Fill 'Address' with valid contract , SOKOL", async function () {
        const field = await waitUntilShowUp(screens.importAccounts.contractAddress)
        await clearField(field, 100)
        await field.sendKeys(contractSokol)
      })

      it("Button 'Import' is enabled if contract address is correct", async function () {
        await delay(5000)
        const button = await waitUntilShowUp(screens.importAccounts.buttonImport)
        assert.equal(await button.isEnabled(), true, 'button enabled')
      })

      it('ABI is fetched ', async function () {
        const field = await waitUntilShowUp(screens.importAccounts.contractABI)
        const abi = await field.getText()
        assert.equal(abi.length, 4457, "ABI isn't fetched")
      })

      it("Click button 'Import', main screen opens", async function () {
        const button = await waitUntilShowUp(screens.importAccounts.buttonImport)
        await click(button)
        const ident = await waitUntilShowUp(screens.main.identicon, 20)
        assert.notEqual(ident, false, "main screen isn't opened")
      })

    })
    describe('Execute Method screen', () => {
      const notContractAddress = '0x56B2e3C3cFf7f3921Dc2e0F8B8e20d1eEc29216b'
      describe("Check UI and button's functionality", () => {

        it("Click button 'Execute method'", async function () {
          await driver.navigate().refresh()
          await delay(2000)
          const button = await waitUntilShowUp(screens.executeMethod.buttonExecuteMethod)
          assert.notEqual(button, false, "button doesn't displayed")
          assert.equal(await button.getText(), 'Execute methods', 'button has incorrect name')
          await button.click()
        })

        it('title is displayed and correct', async function () {
          const title = await waitUntilShowUp(screens.executeMethod.title)
          assert.notEqual(title, false, 'title isn\'t displayed')
          assert.equal(await title.getText(), screens.executeMethod.titleText, 'incorrect text')
        })

        it('Click arrow  button leads to main screen', async function () {
          const button = await waitUntilShowUp(screens.executeMethod.buttonArrow)
          await click(button)
          const identicon = await waitUntilShowUp(screens.main.identicon, 40)
          assert.notEqual(identicon, false, "main screen isn't opened")
        })
      })
      describe('Check output for data type : ADDRESS', () => {
        const address = '0x56B2e3C3cFf7f3921Dc2e0F8B8e20d1eEc29216b'

        it("Click button 'Execute method'", async function () {
          await driver.navigate().refresh()
          await delay(2000)
          const button = await waitUntilShowUp(screens.executeMethod.buttonExecuteMethod)
          assert.notEqual(button, false, "button doesn't displayed")
          assert.equal(await button.getText(), 'Execute methods', 'button has incorrect name')
          await button.click()
        })

        it("Select method 'returnAddress'", async function () {
          const field = await waitUntilShowUp(screens.executeMethod.selectArrow)
          await field.click()
          await waitUntilShowUp(screens.executeMethod.items)
          const list = await driver.findElements(screens.executeMethod.items)
          await list[3].click()
          assert.equal(list.length, 22, "drop down menu isn't displayed")
        })

        it("Button 'Call data' is displayed and disabled", async function () {
          const button = await waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), false, "Button 'Call data' is enabled")
        })

        it("Fill out input field 'Address'", async function () {
          await waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[0], false, "field parameter#1 isn't displayed")
          await fields[0].sendKeys(address)
        })

        it("Button 'Call data' is displayed and enabled", async function () {
          const button = await waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), true, "Button 'Call data' is disabled")
          await button.click()
        })

        it('method returns correct value', async function () {
          await delay(3000)
          await waitUntilShowUp(screens.executeMethod.fieldOutput)
          const fields = await driver.findElements(screens.executeMethod.fieldOutput)
          assert.notEqual(fields[1], false, "field 'Output'  isn't displayed")
          const text = await waitUntilHasValue(fields[1])
          assert.equal(text.toLowerCase(), address.toLowerCase(), 'incorrect value was returned')
        })

        it("2nd call doesn't throw the error", async function () {
          const button = await waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          await button.click()
          const field = await waitUntilShowUp(screens.executeMethod.fieldOutput)
          assert.notEqual(field, false, "field 'Output'  isn't displayed")
          const text = await waitUntilHasValue(field)
          assert.equal(text.toLowerCase(), address.toLowerCase(), 'incorrect value was returned')
        })
      })

      describe('Check output for data type : STRING', () => {
        const stringValue = 'POA network'

        it("Select method 'returnString'", async function () {
          const field = await waitUntilShowUp(screens.executeMethod.selectArrow)
          await field.click()
          await delay(2000)
          await waitUntilShowUp(screens.executeMethod.items)
          const list = await driver.findElements(screens.executeMethod.items)
          await list[14].click()
          assert.equal(list.length, 22, "drop down menu isn't displayed")
        })

        it('Fill out input parameter field ', async function () {
          await waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[0], false, "field parameter#1 isn't displayed")
          await fields[0].sendKeys(stringValue)
        })

        it("Click button 'Call data' ", async function () {
          const button = await waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), true, "Button 'Call data' is disabled")
          await button.click()
        })

        it('method returns correct value', async function () {
          await delay(3000)
          await waitUntilShowUp(screens.executeMethod.fieldOutput)
          const fields = await driver.findElements(screens.executeMethod.fieldOutput)
          assert.notEqual(fields[1], false, "field 'Output'  isn't displayed")
          const text = await waitUntilHasValue(fields[1])
          assert.equal(text, stringValue, 'incorrect value was returned')
        })
      })
      describe('Check output for data type : BOOLEAN', () => {

        it("Select method 'returnBoolean'", async function () {
          const field = await waitUntilShowUp(screens.executeMethod.selectArrow)
          await field.click()
          await waitUntilShowUp(screens.executeMethod.items)
          const list = await driver.findElements(screens.executeMethod.items)
          await list[5].click()
          assert.equal(list.length, 22, "drop down menu isn't displayed")
        })

        it('Fill out input parameter field, value is TRUE', async function () {
          await waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[0], false, "field parameter#1 isn't displayed")
          await fields[0].sendKeys('true')
        })

        it("Click button 'Call data' ", async function () {
          const button = await waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), true, "Button 'Call data' is disabled")
          await button.click()
        })

        it('method returns correct value: TRUE', async function () {
          await delay(3000)
          await waitUntilShowUp(screens.executeMethod.fieldOutput)
          const fields = await driver.findElements(screens.executeMethod.fieldOutput)
          assert.notEqual(fields[1], false, "field 'Output'  isn't displayed")
          const text = await waitUntilHasValue(fields[1])
          assert.equal(text, 'true', 'incorrect value was returned')
        })
        it('Fill out input parameter field, value is FALSE ', async function () {
          await waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[0], false, "field parameter#1 isn't displayed")
          await clearField(fields[0])
          await fields[0].sendKeys('false')
        })

        it("Click button 'Call data' ", async function () {
          const button = await waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), true, "Button 'Call data' is disabled")
          await button.click()
        })

        it('method returns correct value, FALSE', async function () {
          await delay(3000)
          await waitUntilShowUp(screens.executeMethod.fieldOutput)
          const fields = await driver.findElements(screens.executeMethod.fieldOutput)
          assert.notEqual(fields[1], false, "field 'Output'  isn't displayed")
          const text = await waitUntilHasValue(fields[1])
          assert.equal(text, 'false', 'incorrect value was returned')
        })

      })
      describe('Check output for data type : BYTES', () => {

        const bytesValue = '0x010203'

   it("Select method 'returnBytes1'", async function () {
          const field = await waitUntilShowUp(screens.executeMethod.selectArrow)
          await field.click()
          await waitUntilShowUp(screens.executeMethod.items)
          const list = await driver.findElements(screens.executeMethod.items)
          await list[7].click()
          assert.equal(list.length, 22, "drop down menu isn't displayed")
        })

        it('Fill out input parameter field ', async function () {
          await waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[0], false, "field parameter#1 isn't displayed")
          await fields[0].sendKeys(bytesValue)
        })

        it("Click button 'Call data' ", async function () {
          const button = await waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), true, "Button 'Call data' is disabled")
          await button.click()
        })

        it('method returns correct value', async function () {
          await delay(3000)
          await waitUntilShowUp(screens.executeMethod.fieldOutput)
          const fields = await driver.findElements(screens.executeMethod.fieldOutput)
          assert.notEqual(fields[1], false, "field 'Output'  isn't displayed")
          const text = await waitUntilHasValue(fields[1])
          assert.equal(text, bytesValue, 'incorrect value was returned')
        })
      })
      describe('Check output for data type : UINT256', () => {

        const uint256Value = '1122334455667788991122334455667788'

   it("Select method 'returnUint256'", async function () {
          const field = await waitUntilShowUp(screens.executeMethod.selectArrow)
          await field.click()
          await waitUntilShowUp(screens.executeMethod.items)
          const list = await driver.findElements(screens.executeMethod.items)
          await list[17].click()
          assert.equal(list.length, 22, "drop down menu isn't displayed")
        })

        it('Fill out input parameter field ', async function () {
          await waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[0], false, "field parameter#1 isn't displayed")
          await fields[0].sendKeys(uint256Value)
        })

        it("Click button 'Call data' ", async function () {
          const button = await waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), true, "Button 'Call data' is disabled")
          await button.click()
        })

        it('method returns correct value', async function () {
          await delay(3000)
          await waitUntilShowUp(screens.executeMethod.fieldOutput)
          const fields = await driver.findElements(screens.executeMethod.fieldOutput)
          assert.notEqual(fields[1], false, "field 'Output'  isn't displayed")
          const text = await waitUntilHasValue(fields[1])
          assert.equal(text, uint256Value, 'incorrect value was returned')
        })

      })
      describe('Check output for data type : INT256', () => {

        const int256Value = '-1122334455667788991122334455667788'

       it("Select method 'returnInt256'", async function () {
          const field = await waitUntilShowUp(screens.executeMethod.selectArrow)
          await field.click()
          await waitUntilShowUp(screens.executeMethod.items)
          const list = await driver.findElements(screens.executeMethod.items)
          await list[10].click()
          assert.equal(list.length, 22, "drop down menu isn't displayed")
        })

        it('Fill out input parameter field ', async function () {
          await waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[0], false, "field parameter#1 isn't displayed")
          await fields[0].sendKeys(int256Value)
        })

        it("Click button 'Call data' ", async function () {
          const button = await waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), true, "Button 'Call data' is disabled")
          await button.click()
        })

        it('method returns correct value', async function () {
          await delay(3000)
          await waitUntilShowUp(screens.executeMethod.fieldOutput)
          const fields = await driver.findElements(screens.executeMethod.fieldOutput)
          assert.notEqual(fields[1], false, "field 'Output'  isn't displayed")
          const text = await waitUntilHasValue(fields[1])
          assert.equal(text, int256Value, 'incorrect value was returned')
        })
      })
      describe('Check executed method', () => {

        it("Select method 'transfer'", async function () {
          const field = await waitUntilShowUp(screens.executeMethod.selectArrow)
          await field.click()
          await waitUntilShowUp(screens.executeMethod.items)
          const list = await driver.findElements(screens.executeMethod.items)
          await list[21].click()
          assert.equal(list.length, 22, "drop down menu isn't displayed")
        })

        it("Button 'Copy ABI encoded' is displayed", async function () {
          const button = await waitUntilShowUp(screens.executeMethod.buttonCopyABI)
          assert.notEqual(button, false, "button 'Copy ABI encoded' isn't displayed")
        })

        it("Button 'Copy ABI encoded' is disabled", async function () {
          const button = await waitUntilShowUp(screens.executeMethod.buttonCopyABI)
          assert.equal(await button.isEnabled(), false, "button 'Copy ABI encoded' enabled")
        })

        it("Button 'Next' is disabled", async function () {
          const button = await waitUntilShowUp(screens.executeMethod.buttonNext)
          assert.equal(await button.isEnabled(), false, "button 'Next' enabled")
        })

        it("Fill out parameter '_value' with valid data", async function () {
          await waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[1], false, "field address isn't displayed")
          await fields[1].sendKeys('1')
        })

        it("Button 'Copy ABI encoded' is disabled", async function () {
          const button = await waitUntilShowUp(screens.executeMethod.buttonCopyABI)
          assert.equal(await button.isEnabled(), false, "button 'Copy ABI encoded' enabled")
        })

        it("Button 'Next' is disabled", async function () {
          const button = await waitUntilShowUp(screens.executeMethod.buttonNext)
          assert.equal(await button.isEnabled(), false, "button 'Next' enabled")
        })
        it("Fill out parameter '_to'  with wrong data", async function () {
          await waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[0], false, "field address isn't displayed")
          await fields[0].sendKeys(wrongAddress)
        })

        it("Error message if click 'Copy ABI encoded' with wrong address", async function () {
          const button = await waitUntilShowUp(screens.executeMethod.buttonCopyABI)
          await button.click()
          const error = await waitUntilShowUp(elements.error)
          assert.notEqual(error, false, 'no error message')
        })

        it('Close error message', async function () {
          const button = await waitUntilShowUp(elements.errorClose)
          await button.click()
          const title = await waitUntilShowUp(screens.executeMethod.title)
          assert.notEqual(title, false, "error message isn't closed")
        })

        it.skip("Error message if click 'Next' with wrong address", async function () {
          const button = await waitUntilShowUp(screens.executeMethod.buttonNext)
          await button.click()
          const error = await waitUntilShowUp(elements.error)
          assert.notEqual(error, false, 'no error message')
        })

        it.skip('Close error message', async function () {
          const button = await waitUntilShowUp(elements.errorClose)
          await button.click()
          const title = await waitUntilShowUp(screens.executeMethod.title)
          assert.notEqual(title, false, "error message isn't closed")
        })

        it("Fill out parameter '_to' with valid data", async function () {
          const field = await waitUntilShowUp(screens.executeMethod.fieldParameter)
          await clearField(field, 100)
          await field.sendKeys(notContractAddress)
          assert.notEqual(field, false, "field address isn't displayed")
        })

        it("Button 'Next' is enabled", async function () {
          const button = await waitUntilShowUp(screens.executeMethod.buttonNext)
          assert.equal(await button.isEnabled(), true, "button 'Next' disabled")
        })

        it("Button 'Copy ABI encoded' is enabled", async function () {
          const button = await waitUntilShowUp(screens.executeMethod.buttonCopyABI)
          assert.equal(await button.isEnabled(), true, "button 'Copy ABI encoded' disabled")
          await button.click()
        })

        it("Click button 'Next'", async function () {
          const button = await waitUntilShowUp(screens.executeMethod.buttonNext)
          assert.notEqual(button, false, "button 'Next' isn't displayed")
          await button.click()
        })
      })

    })
    describe('Choose Contract Executor', () => {

      const executor2=  '0xf4702CbA917260b2D6731Aea6385215073e8551b'
      it('title is displayed and correct', async function () {
        await delay(5000)
        const title = await waitUntilShowUp(screens.chooseContractExecutor.title)
        assert.notEqual(title, false, 'title isn\'t displayed')
        assert.equal(await title.getText(), screens.chooseContractExecutor.titleText, 'incorrect text')
      })

      it('two accounts displayed', async function () {
        const accs = await waitUntilShowUp(screens.chooseContractExecutor.account)
        assert.notEqual(accs, false, 'accounts aren\'t displayed')
        const accounts = await driver.findElements(screens.chooseContractExecutor.account)
        assert.equal(accounts.length, 3, "number of accounts isn't 2")
      })

      it("Click arrow button leads to 'Execute Method' screen ", async function () {
        const button = await waitUntilShowUp(screens.chooseContractExecutor.buttonArrow)
        assert.notEqual(button, false, 'button isn\'t displayed')
        await button.click()
        await delay(2000)

        const title = await waitUntilShowUp(screens.executeMethod.title)
        assert.notEqual(title, false, 'title isn\'t displayed')
        assert.equal(await title.getText(), screens.executeMethod.titleText, "'Execute Method' screen isn't opened")
      })

      it("Return back to 'Choose Contract Executor' screen", async function () {
        const button = await waitUntilShowUp(screens.executeMethod.buttonNext)
        assert.notEqual(button, false, "button 'Next' isn't displayed")
        await button.click()
      })

      it("Button 'Next' is disabled by default", async function () {
        const button = await waitUntilShowUp(screens.chooseContractExecutor.buttonNext)
        assert.notEqual(button, false, 'button isn\'t displayed')
        assert.equal(await button.isEnabled(), false, 'button enabled by default')
      })

      it('User is able to select account', async function () {
        await waitUntilShowUp(screens.chooseContractExecutor.account)
        const accounts = await driver.findElements(screens.chooseContractExecutor.account)
        const account = accounts[1]
        await account.click()
        const selected = await driver.findElements(screens.chooseContractExecutor.selectedAccount)
        assert.equal(selected.length, 1, "account isn't selected")
      })

      it('User is able to select only one account', async function () {
        const account = (await driver.findElements(screens.chooseContractExecutor.account))[2]
        await account.click()
        const selected = await driver.findElements(screens.chooseContractExecutor.selectedAccount)
        assert.equal(selected.length, 1, 'more than one accounts are selected')
      })


      it("Click button 'Next' open 'Confirm transaction' screen", async function () {
        const button = await waitUntilShowUp(screens.chooseContractExecutor.buttonNext)
        await button.click()
        await delay(3000)
        const reject = await waitUntilShowUp(screens.confirmTransaction.button.reject)
        assert.notEqual(reject, false, "button reject isn't displayed")

      })

      it("Click button 'Reject' open contract's account screen", async function () {
        const reject = await waitUntilShowUp(screens.confirmTransaction.button.reject)
        await reject.click()
        //await delay(2000)
        const buttonExecute = await waitUntilShowUp(screens.executeMethod.buttonExecuteMethod)
        assert.notEqual(buttonExecute, false, "contract's account hasn't opened")
      })

      it("Button arrow leads to executor's account screen", async function () {
        assert.equal(await executeTransferMethod(0), true, "can't execute the method 'transfer'")
        await delay(2000)
        const arrow = await waitUntilShowUp(elements.buttonArrow)
        await arrow.click()
        await delay(2000)
        const address = await waitUntilShowUp(screens.main.address)
        assert.equal((await address.getText()).toUpperCase(),createdAccounts[0], "executors account isn't opened")
      })

     it('Switch to contract account ', async function () {
        const accountMenu = await waitUntilShowUp(menus.account.menu)
        await accountMenu.click()
        const item = await waitUntilShowUp(menus.account.account3)
        await item.click()
        await delay(2000)
        const address = await waitUntilShowUp(screens.main.address)
        assert.equal((await address.getText()).toUpperCase(),contractSokol.toUpperCase(), "contract's account isn't opened")
      })

      it("Confirm transaction: button 'Reject All' leads to executor's account screen", async function () {
        assert.equal(await executeTransferMethod(0), true, "can't execute the method 'transfer'")
        const rejectAll = await waitUntilShowUp(screens.confirmTransaction.button.rejectAll)
        await rejectAll.click()
        await delay(2000)
        const address = await waitUntilShowUp(screens.main.address)
        assert.equal((await address.getText()).toUpperCase(),contractSokol.toUpperCase(), "executors account isn't opened")
      })

      it("Confirm transaction: button 'Submit' leads to executor's account screen", async function () {
        assert.equal(await executeTransferMethod(1), true, "can't execute the method 'transfer'")
        await delay(2000)
        const  button = await waitUntilShowUp(screens.confirmTransaction.button.submit)
        await button.click()
        await delay(2000)
        const address = await waitUntilShowUp(screens.main.address)
        assert.equal((await address.getText()).toUpperCase(),contractSokol.toUpperCase(), "executors account isn't opened")
      })


      it("Stop", async function () {
        throw("Stop!")
        const balanceField = await waitUntilShowUp(screens.main.balance)
        await delay(2000)
        const balance = await balanceField.getText()
        console.log('Account = ' + account)
        console.log('Balance = ' + balance)
        assert.equal(parseFloat(balance) > 0.001, true, 'Balance of account ' + account + ' TOO LOW !!! Please refill with Sokol eth!!!!')

      })

      it("Label 'CONTRACT' present", async function () {
        const menu = await waitUntilShowUp(menus.account.menu)
        await menu.click()
        await waitUntilShowUp(menus.account.labelImported)
        const label = (await driver.findElements(menus.account.labelImported))[0]
        assert.equal(await label.getText(), 'CONTRACT', 'label incorrect')
      })
      it('Delete imported account', async function () {
        const item = await waitUntilShowUp(menus.account.delete)
        await item.click()
        const button = await waitUntilShowUp(screens.deleteImportedAccount.buttons.yes)
        await button.click()
        const buttonArrow = await waitUntilShowUp(screens.settings.buttons.arrow)
        await buttonArrow.click()
        const identicon = await waitUntilShowUp(screens.main.identicon)
        assert.notEqual(identicon, false, 'main screen didn\'t opened')
      })
    })
  })

  describe('Sign Data', () => {

    it('simulate sign request ', async function () {
      await setProvider(NETWORKS.LOCALHOST)
      await driver.get('https://danfinlay.github.io/js-eth-personal-sign-examples/')
      const button = await waitUntilShowUp(By.id('ethSignButton'))
      await button.click()
    })

    it('navigates back to MetaMask popup in the tab', async function () {
      if (process.env.SELENIUM_BROWSER === 'chrome') {
        await driver.get(`chrome-extension://${extensionId}/popup.html`)
      } else if (process.env.SELENIUM_BROWSER === 'firefox') {
        await driver.get(`moz-extension://${extensionId}/popup.html`)
      }
      await delay(700)
    })

    it('error message is displayed and contains text', async function () {
      const error = await waitUntilShowUp(screens.signMessage.error)
      assert.notEqual(error, false, 'error message isn\'t displayed')
      const text = await error.getText()
      assert.equal(text.length > 183, true, 'error message hasn\'t text')
    })

    it('account name is displayed and correct', async function () {
      const name = await waitUntilShowUp(screens.signMessage.accountName)
      assert.notEqual(name, false, 'account name isn\'t displayed')
      assert.equal(await name.getText(), 'Account 2', 'account name is incorrect')
    })

    it('title is displayed and correct', async function () {
      const title = await waitUntilShowUp(screens.signMessage.title)
      assert.notEqual(title, false, 'title isn\'t displayed')
      assert.equal(await title.getText(), 'Sign message', 'title is incorrect')
    })

    it('message is displayed and correct', async function () {
      const message = await waitUntilShowUp(screens.signMessage.message)
      assert.notEqual(message, false, 'message isn\'t displayed')
      assert.equal((await message.getText()).length > 32, true, 'message is incorrect')
    })

    it('button \'Cancel\' is enabled and lead to main screen ', async function () {
      const button = await waitUntilShowUp(screens.signMessage.buttons.cancel)
      assert.equal(await button.isEnabled(), true, 'button isn\'t enabled')
      assert.equal(await button.getText(), 'Cancel', 'button has incorrect name')
    })

    it('button \'Sign\' is enabled and lead to main screen ', async function () {
      const button = await waitUntilShowUp(screens.signMessage.buttons.sign)
      assert.equal(await button.isEnabled(), true, 'button isn\'t enabled')
      assert.equal(await button.getText(), 'Sign', 'button has incorrect name')
      await click(button)
      const identicon = await waitUntilShowUp(screens.main.identicon)
      assert.notEqual(identicon, false, 'main screen didn\'t opened')
    })
  })

  describe('Export private key', async () => {

    it('open dialog', async function () {
      await driver.navigate().refresh()
      const menu = await waitUntilShowUp(menus.dot.menu)
      await menu.click()
      const item = await waitUntilShowUp(menus.dot.exportPR)
      await item.click()
    })

    it('warning is displayed', async function () {
      await waitUntilShowUp(screens.exportPR.error)
      const error = await driver.findElements(screens.exportPR.error)
      assert.equal(error.length, 1, 'warning isn\'t present')
      assert.equal(await error[0].getText(), screens.exportPR.warningText, 'warning\'s text incorrect')
    })

    it('button \'Cancel\' leads back to main screen', async function () {
      const button = await waitUntilShowUp(screens.exportPR.button.cancel)
      assert.equal(await button.getText(), 'Cancel', 'button has incorrect name')
      await click(button)
      const field = await waitUntilShowUp(screens.exportPR.fieldPassword, 20)
      assert.equal(field, false, 'field \'password\' is displayed after closing')
    })

    it('error message if password incorrect', async function () {
      await driver.navigate().refresh()
      const menu = await waitUntilShowUp(menus.dot.menu)
      await menu.click()
      const item = await waitUntilShowUp(menus.dot.exportPR)
      await item.click()
      const field = await waitUntilShowUp(screens.exportPR.fieldPassword)
      await field.sendKeys('abrakadabr')
      const button = await waitUntilShowUp(screens.exportPR.button.submit)
      assert.equal(await button.getText(), 'Submit', 'button has incorrect name')
      await click(button)
      await delay(500)
      const error = await driver.findElements(screens.exportPR.error)
      assert.equal(error.length, 2, 'warning isn\'t present')
      assert.equal(await error[1].getText(), screens.exportPR.errorText, 'error\'s text incorrect')
    })

    it('private key is shown if password correct', async function () {
      const field = await waitUntilShowUp(screens.exportPR.fieldPassword)
      await clearField(field)
      await field.sendKeys(password)
      const button = await waitUntilShowUp(screens.exportPR.button.submit)
      await click(button)
      const key = await waitUntilShowUp(screens.yourPR.key)
      const pr = await key.getText()
      assert.equal(pr.length, 32 * 2, 'private key isn\'t displayed')
    })

    it('icon copy cliboard is displayed and clickable', async function () {
      const field = await waitUntilShowUp(screens.yourPR.copy)
      assert.notEqual(field, false, 'icon copy isn\'t displayed')
    })

    it('file loaded if click button \'Save\' ', async function () {
      const button = await waitUntilShowUp(screens.yourPR.button.save)
      assert.equal(await button.getText(), 'Save as File', 'button has incorrect name')
      assert.notEqual(button, false, 'button \'Save\' isn\'t displayed')
    })

    it('button \'Done\' leads back to main screen', async function () {
      const button = await waitUntilShowUp(screens.yourPR.button.done)
      await click(button)
      const field = await waitUntilShowUp(screens.yourPR.key, 20)
      assert.equal(field, false, 'screen \'Your PR\' is displayed after closing')
      await driver.navigate().refresh()
    })
  })

  describe('Import Ganache seed phrase', function () {

    it('logs out', async function () {
      const menu = await waitUntilShowUp(menus.sandwich.menu)
      await menu.click()
      const logOut = await waitUntilShowUp(menus.sandwich.logOut)
      assert.equal(await logOut.getText(), menus.sandwich.textLogOut)
      await logOut.click()
    })

    it('restores from seed phrase', async function () {
      const restoreSeedLink = await waitUntilShowUp(screens.lock.linkRestore)
      assert.equal(await restoreSeedLink.getText(), screens.lock.linkRestoreText)
      await restoreSeedLink.click()
    })

    it('adds seed phrase', async function () {
      const seedTextArea = await waitUntilShowUp(screens.restoreVault.textArea)
      await seedTextArea.sendKeys(testSeedPhrase)

      let field = await driver.findElement(screens.restoreVault.fieldPassword)
      await field.sendKeys(password)
      field = await driver.findElement(screens.restoreVault.fieldPasswordConfirm)
      await field.sendKeys(password)
      field = await waitUntilShowUp(screens.restoreVault.buttos.ok)
      await click(field)
    })

    it('balance renders', async function () {
      const balance = await waitUntilShowUp(screens.main.balance)
      assert.equal(await balance.getText(), '100.000', "balance isn't correct")
    })

    it('sends transaction', async function () {
      const sendButton = await waitUntilShowUp(screens.main.buttons.send)
      assert.equal(await sendButton.getText(), screens.main.buttons.sendText)
      await click(sendButton)
    })

    it('adds recipient address and amount', async function () {
      const sendTranscationScreen = await waitUntilShowUp(screens.sendTransaction.title)
      assert.equal(await sendTranscationScreen.getText(), screens.sendTransaction.titleText, 'Transaction screen has incorrect titlr')
      const inputAddress = await waitUntilShowUp(screens.sendTransaction.field.address)
      const inputAmmount = await waitUntilShowUp(screens.sendTransaction.field.amount)
      await inputAddress.sendKeys(account2)
      await inputAmmount.sendKeys('10')
      const button = await waitUntilShowUp(screens.sendTransaction.buttonNext)
      assert.equal(await button.getText(), 'Next', 'button has incorrect name')
      await click(button)
    })

    it('confirms transaction', async function () {
      const button = await waitUntilShowUp(screens.confirmTransaction.button.submit)
      assert.equal(await button.getAttribute('value'), 'Submit', 'button has incorrect name')
      await click(button)
    })

    it('finds the transaction in the transactions list', async function () {
      const transactionAmount = await waitUntilShowUp(screens.main.transactionList)
      assert.equal(await transactionAmount.getText(), '10.0')
    })
  })

  describe(' Check the filter of emitted events', function () {

    it('emit event', async function () {
      await setProvider(NETWORKS.SOKOL)
      let account
      if (process.env.SELENIUM_BROWSER === 'chrome') {
        account = account1
      } else if (process.env.SELENIUM_BROWSER === 'firefox') {
        account = account2
        const accountMenu = await waitUntilShowUp(menus.account.menu)
        await accountMenu.click()
        const item = await waitUntilShowUp(menus.account.account2)
        await item.click()
      }

      const balanceField = await waitUntilShowUp(screens.main.balance)
      await delay(2000)
      const balance = await balanceField.getText()
      console.log('Account = ' + account)
      console.log('Balance = ' + balance)
      assert.equal(parseFloat(balance) > 0.001, true, 'Balance of account ' + account + ' TOO LOW !!! Please refill with Sokol eth!!!!')
      await driver.get(eventsEmitter)
      const button = await waitUntilShowUp(screens.eventsEmitter.button)
      await button.click()
      await delay(1000)
    })

    it('confirms transaction in MetaMask popup', async function () {
      const windowHandles = await driver.getAllWindowHandles()
      await driver.switchTo().window(windowHandles[windowHandles.length - 1])
      await delay(5000)
      const gasPrice = await waitUntilShowUp(screens.confirmTransaction.fields.gasPrice)
      await gasPrice.sendKeys('10')
      const button = await waitUntilShowUp(screens.confirmTransaction.button.submit)
      await click(button)
    })

    it('check  number of events', async function () {
      const windowHandles = await driver.getAllWindowHandles()
      await driver.switchTo().window(windowHandles[0])
      await delay(5000)
      const event = await waitUntilShowUp(screens.eventsEmitter.event, 600)
      const events = await driver.findElements(screens.eventsEmitter.event)
      console.log('number of events = ' + events.length)
      if (!event) console.log("event wasn't created or transaction failed".toUpperCase())
      else {
        const events = await driver.findElements(screens.eventsEmitter.event)
        assert.equal(events.length, 1, 'More than 1 event was fired: ' + events.length + ' events')
      }
    })

    it('open app', async function () {
      if (process.env.SELENIUM_BROWSER === 'chrome') {
        await driver.get(`chrome-extension://${extensionId}/popup.html`)
      } else if (process.env.SELENIUM_BROWSER === 'firefox') {
        await driver.get(`moz-extension://${extensionId}/popup.html`)
        const accountMenu = await waitUntilShowUp(menus.account.menu)
        await accountMenu.click()
        const item = await waitUntilShowUp(menus.account.account1)
        await item.click()
      }
    })
  })

  describe('Add Token: Custom', function () {

    describe('Add token to LOCALHOST', function () {

      it('Create custom token in LOCALHOST', async function () {
        await setProvider(NETWORKS.LOCALHOST)
        tokenAddress = await createToken(account1, token, true)
        console.log('Token contract address: ' + tokenAddress)
        assert.equal(tokenAddress.length, 42, 'failed to create token')
      })

      it('navigates to the add token screen', async function () {
        await waitUntilShowUp(screens.main.identicon)
        const tab = await waitUntilShowUp(screens.main.tokens.menu)
        await tab.click()

        const addTokenButton = await waitUntilShowUp(screens.main.tokens.buttonAdd)
        assert.equal(await addTokenButton.getText(), screens.main.tokens.buttonAddText)
        await click(addTokenButton)
      })

      it('checks add token screen has correct title', async function () {
        const addTokenScreen = await waitUntilShowUp(screens.addToken.title)
        assert.equal(await addTokenScreen.getText(), screens.addToken.titleText)
      })
      it('adds token parameters', async function () {
        const tab = await waitUntilShowUp(screens.addToken.tab.custom, 30)
        if (!await waitUntilShowUp(screens.addToken.custom.fields.contractAddress)) await tab.click()
      })
      it('address input is displayed and has correct placeholder', async function () {
        const field = await waitUntilShowUp(screens.addToken.custom.fields.contractAddress)
        assert.equal(await field.getAttribute('placeholder'), 'Token Contract Address', 'incorrect placeholder')
      })

      it('fill out address input', async function () {
        const tokenContractAddress = await waitUntilShowUp(screens.addToken.custom.fields.contractAddress)
        await tokenContractAddress.sendKeys(tokenAddress)
        await delay(2000)
      })

      it('field \'Symbol\' enabled and has correct value', async function () {
        const field = await waitUntilShowUp(screens.addToken.custom.fields.tokenSymbol)
        assert.equal(await field.isEnabled(), true, 'field disabled')
        assert.equal(await field.getAttribute('placeholder'), 'Like "ETH"', 'incorrect placeholder')
        assert.equal(await field.getAttribute('value'), token.ticker, 'incorrect value')
      })

      it('field \'Decimals\' enabled and has correct value', async function () {
        const field = await waitUntilShowUp(screens.addToken.custom.fields.decimals)
        assert.equal(await field.isEnabled(), false, 'field disabled')
        assert.equal(await field.getAttribute('value'), token.decimals, 'incorrect value')
      })

      it('checks the token balance', async function () {
        const button = await waitUntilShowUp(screens.addToken.custom.buttons.add)
        await click(button)
        const tokenBalance = await waitUntilShowUp(screens.main.tokens.balance)
        assert.equal(await tokenBalance.getText(), token.supply + ' ' + token.ticker, 'balance is incorrect or not displayed')
      })

      it('click to token opens the etherscan', async function () {
        const link = await waitUntilShowUp(screens.main.tokens.token)
        await link.click()
        await delay(2000)
        const allHandles = await driver.getAllWindowHandles()
        console.log('allHandles.length ' + allHandles.length)
        assert.equal(allHandles.length, 2, 'etherscan wasn\'t opened')
        await switchToLastPage()
        await delay(2000)
        const title = await waitUntilCurrentUrl()
        console.log(title)
        assert.equal(title.includes('https://etherscan.io/token/'), true, 'etherscan wasn\'t opened')
        await switchToFirstPage()
      })
    })
    describe('Token menu', function () {

      it('token menu is displayed and clickable ', async function () {
        const menu = await waitUntilShowUp(menus.token.menu)
        await menu.click()
      })

      it('link \'View on blockexplorer...\' leads to correct page ', async function () {
        const menu = await waitUntilShowUp(menus.token.view)
        assert.notEqual(menu, false, 'item isn\'t displayed')
        assert.equal(await menu.getText(), menus.token.viewText, 'incorrect name')
        await menu.click()
        await delay(2000)
        const allHandles = await driver.getAllWindowHandles()
        console.log('allHandles.length ' + allHandles.length)
        assert.equal(allHandles.length, 3, 'etherscan wasn\'t opened')
        await switchToLastPage()
        const title = await waitUntilCurrentUrl()

        console.log(title)
        assert.equal(title.includes('https://etherscan.io/token/'), true, 'etherscan wasn\'t opened')
        await switchToFirstPage()
      })

      it('item \'Copy\' is displayed and clickable ', async function () {
        let menu = await waitUntilShowUp(menus.token.menu)
        await menu.click()
        const item = await waitUntilShowUp(menus.token.copy)
        assert.notEqual(item, false, 'item isn\'t displayed')
        assert.equal(await item.getText(), menus.token.copyText, 'incorrect name')
        await item.click()
        menu = await waitUntilShowUp(menus.token.menu, 10)
        assert.notEqual(menu, false, 'menu wasn\'t closed')
      })

      it('item \'Remove\' is displayed', async function () {
        const menu = await waitUntilShowUp(menus.token.menu)
        await menu.click()
        const item = await waitUntilShowUp(menus.token.remove)
        assert.notEqual(item, false, 'item isn\'t displayed')
        assert.equal(await item.getText(), menus.token.removeText, 'incorrect name')
      })

      it('item \'Send \' is displayed', async function () {
        const item = await waitUntilShowUp(menus.token.send)
        assert.notEqual(item, false, 'item isn\'t displayed')
        assert.equal(await item.getText(), menus.token.sendText, 'incorrect name')
        await waitUntilShowUp(menus.token.menu)
      })
    })


    describe('Check support of token per network basis ', async function () {
      const inexistentToken = '0xB8c77482e45F1F44dE1745F52C74426C631bDD51'
      describe('Token should be displayed only for network, where it was added ', async function () {

        it('token should not  be displayed in POA network', async function () {
          await setProvider(NETWORKS.POA)
          assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
        })

        it('token should not  be displayed in SOKOL network', async function () {
          await setProvider(NETWORKS.SOKOL)
          assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
        })

        it('token should not  be displayed in MAINNET network', async function () {
          await setProvider(NETWORKS.MAINNET)
          assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
        })

        it('token should not  be displayed in ROPSTEN network', async function () {
          await setProvider(NETWORKS.ROPSTEN)
          assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
        })

        it('token should not  be displayed in KOVAN network', async function () {
          await setProvider(NETWORKS.KOVAN)
          assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
        })

        it('token should not  be displayed in RINKEBY network', async function () {
          await setProvider(NETWORKS.RINKEBY)
          assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
        })
      })

      describe('Custom tokens validation ', async function () {

        it('can not add inexistent token to POA network', async function () {
          await setProvider(NETWORKS.POA)
          console.log(tokenAddress)
          assert(await isDisabledAddInexistentToken(tokenAddress), true, 'can add inexistent token in POA network')
        })

        it('can not add inexistent token to SOKOL network', async function () {
          await setProvider(NETWORKS.SOKOL)
          assert(await isDisabledAddInexistentToken(inexistentToken), true, 'can add inexistent token in POA network')
        })

        it('can not add inexistent token to ROPSTEN network', async function () {
          await setProvider(NETWORKS.ROPSTEN)
          assert(await isDisabledAddInexistentToken(tokenAddress), true, 'can add inexistent token in POA network')
        })

        it('can not add inexistent token to KOVAN network', async function () {
          await setProvider(NETWORKS.KOVAN)
          assert(await isDisabledAddInexistentToken(tokenAddress), true, 'can add inexistent token in POA network')
        })

        it('can not add inexistent token to RINKEBY network', async function () {
          await setProvider(NETWORKS.RINKEBY)
          assert(await isDisabledAddInexistentToken(tokenAddress), true, 'can add inexistent token in POA network')
        })

        it('can not add inexistent token to MAINNET network', async function () {
          await setProvider(NETWORKS.MAINNET)
          assert(await isDisabledAddInexistentToken(tokenAddress), true, 'can add inexistent token in POA network')
        })

        it('can not add inexistent token to LOCALHOST network', async function () {
          await setProvider(NETWORKS.LOCALHOST)
          assert(await isDisabledAddInexistentToken(tokenAddress.slice(0, tokenAddress.length - 2) + '0'), true, 'can add inexistent token in POA network')
        })

        it('token still should be displayed in LOCALHOST network', async function () {
          await waitUntilDisappear(screens.main.tokens.amount)
          assert.notEqual(await waitUntilShowUp(screens.main.tokens.amount), false, 'App is frozen')
          const tokens = await driver.findElements(screens.main.tokens.amount)
          assert.equal(tokens.length, 1, '\'Tokens\' section doesn\'t contain field with amount of tokens')
          assert.equal(await tokens[0].getText(), screens.main.tokens.textYouOwn1token, 'Token isn\'t displayed')
        })
      })
    })

    describe('Transfer tokens', function () {

      const invalidAddress = '0xkqjefwblknnecwe'
      const invalidAmount = 'eeeee'
      const largeAmount = '123'
      const preciseAmount = '0.123456789123456789123'
      const negativeAmount = '-1'
      it('switch to account 1 ', async function () {
        const accountMenu = await waitUntilShowUp(menus.account.menu)
        await accountMenu.click()
        const item = await waitUntilShowUp(menus.account.account1)
        await item.click()
        await delay(2000)
        const accountName = await waitUntilShowUp(screens.main.accountName)
        assert.equal(await accountName.getText(), 'Account 1', 'account name incorrect')
      })

      it('open screen \'Transfer tokens\' ', async function () {
        const menu = await waitUntilShowUp(menus.token.menu)
        await menu.click()
        const item = await waitUntilShowUp(menus.token.send)
        await item.click()
      })

      it('field \'Amount\' is displayed and has correct placeholder ', async function () {
        const item = await waitUntilShowUp(screens.sendTokens.field.amount)
        assert.equal(await item.getAttribute('placeholder'), screens.sendTokens.field.amountPlaceholder, 'placeholder is incorrect')
      })

      it('field \'Address\' is displayed and has correct placeholder ', async function () {
        const item = await waitUntilShowUp(screens.sendTokens.field.address)
        assert.equal(await item.getAttribute('placeholder'), screens.sendTokens.field.addressPlaceholder, 'placeholder is incorrect')
      })

      it('token\'s balance is correct ', async function () {
        const item = await waitUntilShowUp(screens.sendTokens.balance)
        assert.equal(await item.getText(), token.supply, 'token\'s balance is incorrect')
      })

      it('token\'s symbol is correct ', async function () {
        const item = await waitUntilShowUp(screens.sendTokens.symbol)
        assert.equal(await item.getText(), token.ticker, 'token\'s symbol is incorrect')
      })

      it('error message if invalid token\'s amount', async function () {
        const button = await waitUntilShowUp(screens.sendTokens.button.next)
        assert.equal(await button.getText(), 'Next', 'button \'Next\' has incorrect name')
        await click(button)
        const error = await waitUntilShowUp(screens.sendTokens.error)
        assert.equal(await error.getText(), screens.sendTokens.errorText.invalidAmount, ' error message is incorrect')
      })

      it('error message if invalid address', async function () {
        const amount = await waitUntilShowUp(screens.sendTokens.field.amount)
        await amount.sendKeys('1')
        const address = await waitUntilShowUp(screens.sendTokens.field.address)
        await address.sendKeys(invalidAddress)
        const button = await waitUntilShowUp(screens.sendTokens.button.next)
        await click(button)
        await click(button)
        await delay(2000)
        const error = await waitUntilShowUp(screens.sendTokens.error)
        assert.equal(await error.getText(), screens.sendTokens.errorText.address, ' error message is incorrect')
      })

      it('error message if amount is large', async function () {
        const amount = await waitUntilShowUp(screens.sendTokens.field.amount)
        await amount.sendKeys(largeAmount)
        const address = await waitUntilShowUp(screens.sendTokens.field.address)
        await clearField(address)
        await address.sendKeys(account2)
        const button = await waitUntilShowUp(screens.sendTokens.button.next)
        await click(button)
        await click(button)
        await delay(2000)
        const error = await waitUntilShowUp(screens.sendTokens.error)
        assert.equal(await error.getText(), screens.sendTokens.errorText.largeAmount, ' error message is incorrect')
      })

      it('error message if amount is invalid', async function () {
        const amount = await waitUntilShowUp(screens.sendTokens.field.amount)
        await clearField(amount)
        await amount.sendKeys(invalidAmount)
        const button = await waitUntilShowUp(screens.sendTokens.button.next)
        await click(button)
        await click(button)
        await delay(2000)
        const error = await waitUntilShowUp(screens.sendTokens.error)
        assert.equal(await error.getText(), screens.sendTokens.errorText.invalidAmount, ' error message is incorrect')
      })
      it.skip('error message if amount is too precise', async function () {
        const amount = await waitUntilShowUp(screens.sendTokens.field.amount)
        await clearField(amount)
        await amount.sendKeys(preciseAmount)
        const button = await waitUntilShowUp(screens.sendTokens.button.next)
        await click(button)
        await click(button)
        await delay(2000)
        const error = await waitUntilShowUp(screens.sendTokens.error)
        assert.equal(await error.getText(), screens.sendTokens.errorText.tooPrecise, ' error message is incorrect')
      })

      it('error message if amount is negative', async function () {
        const amount = await waitUntilShowUp(screens.sendTokens.field.amount)
        await clearField(amount)
        await amount.sendKeys(negativeAmount)
        const button = await waitUntilShowUp(screens.sendTokens.button.next)
        await click(button)
        await click(button)
        await delay(2000)
        const error = await waitUntilShowUp(screens.sendTokens.error)
        assert.equal(await error.getText(), screens.sendTokens.errorText.negativeAmount, ' error message is incorrect')
      })

      it('\'Confirm transaction\' screen is opened if address and amount are correct', async function () {
        const amount = await waitUntilShowUp(screens.sendTokens.field.amount)
        await clearField(amount)
        await amount.sendKeys('5')
        const button = await waitUntilShowUp(screens.sendTokens.button.next)
        await click(button)

        const buttonSubmit = await waitUntilShowUp(screens.confirmTransaction.button.submit)
        assert.notEqual(buttonSubmit, false, 'incorrect screen was opened')
      })

      it('\'Confirm transaction\' screen: token\'s amount is correct', async function () {
        const amount = await waitUntilShowUp(screens.confirmTransaction.amount)
        assert.equal(await amount.getText(), '5.000', ' amount is incorrect')
      })

      it('\'Confirm transaction\' screen: token\'s symbol is correct', async function () {
        const symbol = await waitUntilShowUp(screens.confirmTransaction.symbol)
        assert.equal(await symbol.getText(), token.ticker, ' symbol is incorrect')
      })

      it('submit transaction', async function () {
        await driver.navigate().refresh()
        const button = await waitUntilShowUp(screens.confirmTransaction.button.submit)
        await click(button)
        const list = await waitUntilShowUp(screens.main.transactionList)
        assert.notEqual(list, false, ' main screen isn\'t opened')
      })

      it('correct amount substracted from sender\'s tokens balance', async function () {
        const tab = await waitUntilShowUp(screens.main.tokens.menu)
        await tab.click()
        await driver.navigate().refresh()
        await delay(5000)
        await driver.navigate().refresh()
        await delay(5000)
        await driver.navigate().refresh()
        await delay(5000)
        const balance = await waitUntilShowUp(screens.main.tokens.balance)
        assert.equal(await balance.getText(), (token.supply - 5) + ' ' + token.ticker, 'balance is incorrect')
      })
      it('switch to account 2 ', async function () {
        const accountMenu = await waitUntilShowUp(menus.account.menu)
        await accountMenu.click()
        const item = await waitUntilShowUp(menus.account.account2)
        await item.click()
        await delay(2000)
        const accountName = await waitUntilShowUp(screens.main.accountName)
        assert.equal(await accountName.getText(), 'Account 2', 'account name incorrect')
      })

      it('added token isn\'t displayed for another account in the same network', async function () {
        const accountMenu = await waitUntilShowUp(menus.account.menu)
        await accountMenu.click()
        const item = await waitUntilShowUp(menus.account.createAccount)
        await item.click()
        assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('add token to another account in the same network', async function () {
        const addTokenButton = await waitUntilShowUp(screens.main.tokens.buttonAdd)
        assert.equal(await addTokenButton.getText(), screens.main.tokens.buttonAddText)
        await click(addTokenButton)

        const tokenContractAddress = await waitUntilShowUp(screens.addToken.custom.fields.contractAddress)
        await tokenContractAddress.sendKeys(tokenAddress)

        const buttonAdd = await waitUntilShowUp(screens.addToken.custom.buttons.add)
        await click(buttonAdd)
      })

      it('tokens were transfered, balance is updated', async function () {
        const balance = await waitUntilShowUp(screens.main.tokens.balance)
        assert.equal(await balance.getText(), '5 ' + token.ticker, 'balance is incorrect')
      })
    })
    describe('Remove token , provider is localhost', function () {
      it('switch to account 1 ', async function () {
        const accountMenu = await waitUntilShowUp(menus.account.menu)
        await accountMenu.click()
        const item = await waitUntilShowUp(menus.account.account1)
        await item.click()
        await delay(2000)
        const accountName = await waitUntilShowUp(screens.main.accountName)
        assert.equal(await accountName.getText(), 'Account 1', 'account name incorrect')
      })

      it('remove option opens \'Remove token\' screen ', async function () {
        await setProvider(NETWORKS.LOCALHOST)
        const menu = await waitUntilShowUp(menus.token.menu)
        await menu.click()
        const remove = await waitUntilShowUp(menus.token.remove)
        await remove.click()
      })

      it('screen \'Remove token\' has correct title', async function () {
        const title = await waitUntilShowUp(screens.removeToken.title)
        assert.equal(await title.getText(), screens.removeToken.titleText, 'title is incorrect')
      })

      it('screen \'Remove token\' has correct label', async function () {
        const title = await waitUntilShowUp(screens.removeToken.label)
        assert.equal((await title.getText()).includes(screens.removeToken.labelText + token.ticker), true, 'label is incorrect')
      })

      it('button "No" bring back to "Main" screen', async function () {
        const title = await waitUntilShowUp(screens.removeToken.title)
        assert.equal(await title.getText(), screens.removeToken.titleText, 'title is incorrect')
        const button = await waitUntilShowUp(screens.removeToken.buttons.no)
        assert.notEqual(button, false, 'button \'No\' isn\'t displayed ')
        assert.equal(await button.getText(), 'No', 'button has incorrect name')
        await click(button)
        const token = await waitUntilShowUp(screens.main.tokens.balance)
        assert.notEqual(await token.getText(), '', 'token is disapeared after return from remove token screen ')
      })

      it('button "Yes" delete token', async function () {
        const menu = await waitUntilShowUp(menus.token.menu)
        await menu.click()
        const remove = await waitUntilShowUp(menus.token.remove)
        await remove.click()

        const title = await waitUntilShowUp(screens.removeToken.title)
        assert.equal(await title.getText(), screens.removeToken.titleText, 'title is incorrect')

        const button = await waitUntilShowUp(screens.removeToken.buttons.yes)
        assert.notEqual(button, false, 'button \'Yes\' isn\'t displayed ')
        assert.equal(await button.getText(), 'Yes', 'button has incorrect name')
        await click(button)
        assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('check if token was removed from SOKOL network', async function () {
        await setProvider(NETWORKS.SOKOL)
        assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('check if token was removed from KOVAN network', async function () {
        await setProvider(NETWORKS.KOVAN)
        assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('check if token was removed from ROPSTEN network', async function () {
        await setProvider(NETWORKS.ROPSTEN)
        assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('check if token was removed from MAINNET network', async function () {
        await setProvider(NETWORKS.MAINNET)
        assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('check if token was removed from POA network', async function () {
        await setProvider(NETWORKS.POA)
        assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('check if token was removed from RINKEBY network', async function () {
        await setProvider(NETWORKS.RINKEBY)
        assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
      })
    })
  })

  describe('Change password', async () => {

    let fieldNewPassword
    let fieldConfirmNewPassword
    let fieldOldPassword
    let buttonYes

    describe('Check screen "Settings" -> "Change password" ', async () => {

      it('checks if current network name (localhost) is correct', async () => {
        await setProvider(NETWORKS.LOCALHOST)
        const menu = await waitUntilShowUp(menus.sandwich.menu, 300)
        await menu.click()
        const settings = await waitUntilShowUp(menus.sandwich.settings)
        await settings.click()
        const field = await waitUntilShowUp(screens.settings.currentNetwork)
        assert.equal(await field.getText(), 'http://localhost:8545', 'current network is incorrect')
      })

      it('error should not be displayed', async () => {
        const error = await waitUntilShowUp(screens.settings.error, 10)
        assert.equal(error, false, 'improper error is displayed')
      })

      it('checks if "Change password" button is present and enabled', async () => {
        const menu = await waitUntilShowUp(menus.sandwich.menu, 300)
        await menu.click()
        const settings = await waitUntilShowUp(menus.sandwich.settings)
        await settings.click()
        await waitUntilShowUp(screens.settings.fieldNewRPC)
        const buttons = await driver.findElements(screens.settings.buttons.changePassword)
        await scrollTo(buttons[0])
        assert.equal(buttons.length, 1, 'Button "Change password" is not present')
        assert.equal(await buttons[0].getText(), 'Change password', 'button has incorrect name')
        assert.equal(await buttons[0].isEnabled(), true, 'Button "Change password" is disabled')
        await click(buttons[0])
      })

      it('screen has correct title', async () => {
        const title = await waitUntilShowUp(screens.changePassword.title)
        assert.equal(await title.getText(), screens.changePassword.titleText, '"Change password" screen contains incorrect title')
      })

      it('screen contains correct label', async () => {
        await waitUntilShowUp(screens.changePassword.label)
        const labels = await driver.findElements(screens.changePassword.label)
        assert.equal(labels.length, 1, 'screen "Change password" doesn\'t contain label')
        assert.equal(await labels[0].getText(), screens.changePassword.labelText, 'label contains incorrect title')
      })

      it('clicking the button "No" bring back to "Setting" screen ', async () => {
        const button = await waitUntilShowUp(screens.changePassword.buttonNo)
        assert.equal(await button.getText(), 'No', 'button has incorrect name')
        await click(button)
        const title = await waitUntilShowUp(screens.settings.title)
        assert.equal(await title.getText(), screens.settings.titleText, 'button "No" doesnt open settings screen')
        const buttonChangePass = await driver.findElement(screens.settings.buttons.changePassword)
        await scrollTo(buttonChangePass)
        await click(buttonChangePass)
      })
    })

    describe('Validation of errors ', async () => {

      before(async () => {
        fieldOldPassword = await waitUntilShowUp(screens.changePassword.fieldOldPassword)
        await fieldOldPassword.sendKeys(password)
        fieldNewPassword = await waitUntilShowUp(screens.changePassword.fieldNewPassword)
        fieldConfirmNewPassword = await waitUntilShowUp(screens.changePassword.fieldConfirmNewPassword)
        buttonYes = await waitUntilShowUp(screens.changePassword.buttonYes)
      })

      it('error if new password shorter than 8 digits', async () => {
        await fieldNewPassword.sendKeys(newPassword.short)
        await fieldConfirmNewPassword.sendKeys(newPassword.short)
        assert.equal(await buttonYes.getText(), 'Yes', 'button has incorrect name')
        await click(buttonYes)
        await delay(2000)
        const errors = await driver.findElements(screens.changePassword.error)
        assert.equal(errors.length > 0, true, 'error isn\'t displayed')
        assert.equal(await errors[0].getText(), screens.changePassword.errorText.notLong, 'Error\'s text incorrect')
      })

      it('error if new password  doesn\'t match confirmation', async () => {
        await clearField(fieldNewPassword)
        await clearField(fieldConfirmNewPassword)
        await fieldNewPassword.sendKeys(newPassword.correct)
        await fieldConfirmNewPassword.sendKeys(newPassword.incorrect)
        await click(buttonYes)
        await delay(2000)
        const errors = await driver.findElements(screens.changePassword.error)
        assert.equal(errors.length > 0, true, 'error isn\'t displayed')
        assert.equal(await errors[0].getText(), screens.changePassword.errorText.dontMatch, 'Error\'s text incorrect')
      })

      it('error if new password match old password', async () => {
        await clearField(fieldNewPassword)
        await clearField(fieldConfirmNewPassword)
        await fieldNewPassword.sendKeys(password)
        await fieldConfirmNewPassword.sendKeys(password)
        await click(buttonYes)
        await delay(2000)
        const errors = await driver.findElements(screens.changePassword.error)
        assert.equal(errors.length > 0, true, 'error isn\'t displayed')
        assert.equal(await errors[0].getText(), screens.changePassword.errorText.differ, 'Error\'s text incorrect')
      })

      it('error if old password incorrect', async () => {
        await clearField(fieldOldPassword)
        await fieldOldPassword.sendKeys(newPassword.incorrect)
        await click(buttonYes)
        await click(buttonYes)
        await delay(2000)
        const errors = await driver.findElements(screens.changePassword.error)
        assert.equal(errors.length > 0, true, 'error isn\'t displayed')
        assert.equal(await errors[0].getText(), screens.changePassword.errorText.incorrectPassword, 'Error\'s text incorrect')
      })

      it('no errors if old, new, confirm new passwords are correct; user can change password', async () => {
        await clearField(fieldNewPassword)
        await clearField(fieldOldPassword)
        await clearField(fieldConfirmNewPassword)

        await fieldOldPassword.sendKeys(password)
        await fieldNewPassword.sendKeys(newPassword.correct)
        await fieldConfirmNewPassword.sendKeys(newPassword.correct)
        await click(buttonYes)
        await waitUntilShowUp(screens.settings.buttons.changePassword, 25)
        const buttons = await driver.findElements(screens.settings.buttons.changePassword)
        assert.equal(buttons.length, 1, 'Button "Change password" is not present')
        assert.equal(await buttons[0].isEnabled(), true, 'Button "Change password" is disabled')
      })
    })

    describe('Check if new password is accepted', async () => {

      it('user can log out', async () => {
        const menu = await waitUntilShowUp(menus.sandwich.menu)
        await menu.click()
        const itemLogOut = await waitUntilShowUp(menus.sandwich.logOut)
        await itemLogOut.click()
        const field = await waitUntilShowUp(screens.lock.fieldPassword)
        assert.notEqual(field, false, 'password box isn\'t present after logout')
      })

      it('can\'t login with old password', async () => {
        const field = await waitUntilShowUp(screens.lock.fieldPassword)
        await field.sendKeys(password)
        const button = await waitUntilShowUp(screens.lock.buttonLogin)
        await click(button)
        const error = await waitUntilShowUp(screens.lock.error)
        assert.notEqual(error, false, 'error isn\'t displayed if password incorrect')
        assert.equal(await error.getText(), screens.lock.errorText, 'error\'s text incorrect')
      })

      it('accepts new password after lock', async () => {
        const field = await waitUntilShowUp(screens.lock.fieldPassword)
        await clearField(field)
        await field.sendKeys(newPassword.correct)
        const button = await waitUntilShowUp(screens.lock.buttonLogin)
        await click(button)

        await waitUntilShowUp(screens.main.buttons.buy)
        const buttons = await driver.findElements(screens.main.buttons.buy)
        assert.equal(buttons.length, 1, 'main screen isn\'t displayed')
        assert.equal(await buttons[0].getText(), 'Buy', 'button has incorrect name')
        password = newPassword.correct
      })
    })
  })

  describe('Add Token:Search', function () {
    const request = {
      valid: 'cry',
      invalid: 'zzz',
      notExistingAddress: '0xE18035BF8712672935FDB4e5e431b1a0183d2DFC',
    }
    const Qtum = {
      name: 'Qtum (QTUM)',
      address: '0x9a642d6b3368ddc662CA244bAdf32cDA716005BC',
    }

    describe('add Mainnet\'s tokens', function () {

      it(' field \'Search\' is displayed', async function () {
        await setProvider(NETWORKS.MAINNET)
        await delay(2000)
        const tab = await waitUntilShowUp(screens.main.tokens.menu)
        await tab.click()
        const button = await waitUntilShowUp(screens.main.tokens.buttonAdd, 300)
        await click(button)
        const field = await waitUntilShowUp(screens.addToken.search.fieldSearch)
        assert.notEqual(field, false, 'field \'Search\'  isn\'t displayed')
      })

      it('button \'Next\' is disabled if no tokens found', async function () {
        const button = await waitUntilShowUp(screens.addToken.search.button.next)
        assert.equal(await button.isEnabled(), false, 'button is enabled')
        assert.equal(await button.getText(), 'Next', 'button has incorrect name')
      })

      it('button \'Cancel\' is enabled and lead to main screen ', async function () {
        const button = await waitUntilShowUp(screens.addToken.search.button.cancel)
        assert.equal(await button.isEnabled(), true, 'button isn\'t enabled')
        assert.equal(await button.getText(), 'Cancel', 'button has incorrect name')
      })

      it('Search by name: searching result list is empty if request invalid', async function () {
        const field = await waitUntilShowUp(screens.addToken.search.fieldSearch)
        await field.sendKeys(request.invalid)
        const list = await waitUntilShowUp(screens.addToken.search.token.unselected, 20)
        assert.equal(list, false, 'unexpected tokens are displayed')
      })

      it('Search by name: searching result list isn\'t empty ', async function () {
        const field = await waitUntilShowUp(screens.addToken.search.fieldSearch)
        await clearField(field)
        await field.sendKeys(request.valid)
        await waitUntilShowUp(screens.addToken.search.token.unselected)
        const list = await driver.findElements(screens.addToken.search.token.unselected)
        assert.notEqual(list, 0, 'tokens aren\'t displayed')
      })

      it('Token\'s info contains name, symbol and picture ', async function () {
        const tokens = await driver.findElements(screens.addToken.search.token.unselected)
        const names = await driver.findElements(screens.addToken.search.token.name)
        const icons = await driver.findElements(screens.addToken.search.token.icon)
        assert.equal(tokens.length, names.length, 'some names are missed')
        assert.equal(tokens.length, icons.length, 'some icons are missed')
      })

      it('button \'Next\' is disabled if no one token is selected', async function () {
        const button = await waitUntilShowUp(screens.addToken.search.button.next)
        assert.equal(await button.isEnabled(), false, 'button is enabled')
      })

      it('user can select one token', async function () {
        const token = await waitUntilShowUp(screens.addToken.search.token.unselected)
        await token.click()
      })

      it('button \'Next\' is enabled if token is selected', async function () {
        const button = await waitUntilShowUp(screens.addToken.search.button.next)
        assert.equal(await button.isEnabled(), true, 'button is disabled')
      })

      it('user can unselected token', async function () {
        const token = await waitUntilShowUp(screens.addToken.search.token.selected)
        await token.click()
      })

      it('button \'Next\' is disabled after token was unselected', async function () {
        const button = await waitUntilShowUp(screens.addToken.search.button.next)
        assert.equal(await button.isEnabled(), false, 'button is enabled')
      })

      it('user can select two tokens', async function () {
        await waitUntilShowUp(screens.addToken.search.token.unselected)
        const tokensUnselected = await driver.findElements(screens.addToken.search.token.unselected)
        await tokensUnselected[0].click()
        await tokensUnselected[2].click()
        const tokensSelected = await driver.findElements(screens.addToken.search.token.selected)
        assert.equal(tokensSelected.length, 2, 'user can\'t select 2 tokens')
      })

      it('click button \'Next\' opens confirm screen ', async function () {
        const button = await waitUntilShowUp(screens.addToken.search.button.next)
        await click(button)
        const buttonAdd = await waitUntilShowUp(screens.addToken.search.confirm.button.add)
        assert.notEqual(buttonAdd, false, 'failed to open screen confirmation')
      })

      it('confirm screen: two selected tokens are displayed and have correct parameters', async function () {
        const tokens = await driver.findElements(screens.addToken.search.confirm.token.item)
        assert.equal(tokens.length, 2, 'incorrect number of tokens are presented')

        const names = await driver.findElements(screens.addToken.search.confirm.token.name)
        const name0 = await names[0].getText()
        const name1 = await names[1].getText()
        assert.equal(name0.length > 10, true, 'empty token name')
        assert.equal(name1.length > 10, true, 'empty token name')
        await delay(2000)
        const balances = await driver.findElements(screens.addToken.search.confirm.token.balance)
        const balance0 = await balances[1].getText()
        const balance1 = await balances[2].getText()
        assert.equal(balance0, '0', 'balance isn\'t 0')
        assert.equal(balance1, '0', 'balance isn\'t 0')
      })

      it('button \'Back\' is enabled and leads to previous screen ', async function () {
        const button = await waitUntilShowUp(screens.addToken.search.confirm.button.back)
        assert.equal(await button.isEnabled(), true, 'button isn\'t enabled')
        await click(button)
        const fieldSearch = await waitUntilShowUp(screens.addToken.search.fieldSearch)
        assert.notEqual(fieldSearch, false, 'add token screen didn\'t opened')
      })

      it('button \'Next\' is enabled if confirmation list isn\'t empty', async function () {
        const button = await waitUntilShowUp(screens.addToken.search.button.next)
        assert.equal(await button.isEnabled(), true, 'button is disabled')
      })

      it('previous selected tokens remain selected after new search', async function () {
        const field = await waitUntilShowUp(screens.addToken.search.fieldSearch)
        await clearField(field)
        await field.sendKeys(request.valid)
        await waitUntilShowUp(screens.addToken.search.token.selected)
        const listSelected = await driver.findElements(screens.addToken.search.token.selected)
        assert.equal(listSelected.length, 2, 'tokens are unselected')
      })

      it('user can unselect token', async function () {
        const tokensUnselected = await driver.findElements(screens.addToken.search.token.unselected)
        assert.notEqual(tokensUnselected.length, 0, 'all tokens are selected')

        let tokensSelected = await driver.findElements(screens.addToken.search.token.selected)
        await tokensSelected[0].click()
        const old = tokensSelected.length

        tokensSelected = await driver.findElements(screens.addToken.search.token.selected)
        assert.equal(tokensSelected.length, old - 1, 'can\'t unselect token')
      })

      it('confirm screen: unselected token aren\'t displayed', async function () {
        const button = await waitUntilShowUp(screens.addToken.search.button.next)
        await click(button)
        await waitUntilShowUp(screens.addToken.search.confirm.token.item)
        const tokens = await driver.findElements(screens.addToken.search.confirm.token.item)
        assert.equal(tokens.length, 1, 'incorrect number of tokens are presented')
        const back = await waitUntilShowUp(screens.addToken.search.confirm.button.back)
        await click(back)
      })

      it('Search by contract address: searching result list is empty if address invalid ', async function () {
        const field = await waitUntilShowUp(screens.addToken.search.fieldSearch)
        await field.sendKeys(request.notExistingAddress)
        const list = await waitUntilShowUp(screens.addToken.search.token.unselected, 20)
        assert.equal(list, false, 'unexpected tokens are displayed')
      })

      it('Search by valid contract address: searching result list contains one token ', async function () {
        const field = await waitUntilShowUp(screens.addToken.search.fieldSearch)
        await clearField(field)
        await clearField(field)
        await field.sendKeys(Qtum.address)
        const token = await waitUntilShowUp(screens.addToken.search.token.unselected)
        const list = await driver.findElements(screens.addToken.search.token.unselected)
        assert.notEqual(list, 0, 'tokens aren\'t displayed')
        await token.click()
      })

      it('Token\'s info contains correct name ', async function () {
        const name = await waitUntilShowUp(screens.addToken.search.token.name)
        assert.equal(await name.getText(), Qtum.name, 'incorrect token\'s name')
      })

      it('one more token added to confirmation list', async function () {
        const button = await waitUntilShowUp(screens.addToken.search.button.next)
        await click(button)
        await waitUntilShowUp(screens.addToken.search.confirm.token.item)
        const list = await driver.findElements(screens.addToken.search.confirm.token.item)
        assert.equal(list.length, 2, 'token wasn\'t added')
      })

      it('button \'Add tokens\' is enabled and clickable', async function () {
        const button = await waitUntilShowUp(screens.addToken.search.confirm.button.add)
        assert.equal(await button.isEnabled(), true, 'button isn\'t enabled')
        await click(button)
        const identicon = await waitUntilShowUp(screens.main.identicon)
        assert.notEqual(identicon, false, 'main screen didn\'t opened')
      })

      it('all selected tokens are displayed on main screen', async function () {
        await waitUntilShowUp(screens.main.tokens.token)
        const tokens = await driver.findElements(screens.main.tokens.token)
        assert.equal(tokens.length, 2, 'tokens weren\'t added')
      })

      it('correct value of counter of owned tokens', async function () {
        const counter = await waitUntilShowUp(screens.main.tokens.counter)
        assert.equal(await counter.getText(), 'You own 2 tokens', 'incorrect value of counter')
      })
    })

    describe('Token should be displayed only for network, where it was added ', async function () {

      it('token should not  be displayed in POA network', async function () {
        await setProvider(NETWORKS.POA)
        assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not  be displayed in DAI network', async function () {
        await setProvider(NETWORKS.DAI)
        assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not  be displayed in SOKOL network', async function () {
        await setProvider(NETWORKS.SOKOL)
        assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not  be displayed in LOCALHOST network', async function () {
        await setProvider(NETWORKS.LOCALHOST)
        assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not  be displayed in ROPSTEN network', async function () {
        await setProvider(NETWORKS.ROPSTEN)
        assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not  be displayed in KOVAN network', async function () {
        await setProvider(NETWORKS.KOVAN)
        assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not  be displayed in RINKEBY network', async function () {
        await setProvider(NETWORKS.RINKEBY)
        assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
      })
    })
    describe('remove Mainnet\'s tokens', function () {

      it('remove tokens', async function () {

        let menu
        let button
        let counter
        let buttonYes

        await setProvider(NETWORKS.MAINNET)
        await waitUntilShowUp(elements.loader, 25)
        await waitUntilDisappear(elements.loader, 50)
        menu = await waitUntilShowUp(menus.token.menu)
        await menu.click()
        button = await waitUntilShowUp(menus.token.remove)
        await button.click()
        buttonYes = await waitUntilShowUp(screens.removeToken.buttons.yes)
        await buttonYes.click()
        counter = await waitUntilShowUp(screens.main.tokens.counter)
        assert.equal(await counter.getText(), 'You own 1 token', 'incorrect value of counter')
        const tokensNumber = await driver.findElements(screens.main.tokens.token)
        assert.equal(tokensNumber.length, 1, 'incorrect amount of token\'s  is displayed')

        menu = await waitUntilShowUp(menus.token.menu)
        await menu.click()
        button = await waitUntilShowUp(menus.token.remove)
        await button.click()
        buttonYes = await waitUntilShowUp(screens.removeToken.buttons.yes)
        await buttonYes.click()
        counter = await waitUntilShowUp(screens.main.tokens.counter)
        assert.equal(await counter.getText(), 'No tokens found', 'incorrect value of counter')

        assert.equal(await assertTokensNotDisplayed(), true, 'tokens are displayed')
      })
    })
  })
  describe('Custom Rpc', function () {
    const invalidStringUrl = 'http://lwkdfowi**&#v er'
    const urlWithoutHttp = 'infura.com'
    const invalidEndpoint = 'http://abrakadabrawdjkwjeciwkasuhlvflwe.com'
    const correctRpcUrl = 'https://poa.infura.io/test'

    it('switches to settings screen through menu \'Network -> Custom RPC\'', async function () {
      await setProvider(NETWORKS.CUSTOM)
      const settings = await waitUntilShowUp(screens.settings.title)
      assert.equal(await settings.getText(), screens.settings.titleText, 'inappropriate screen is opened')
    })

    it('error message if new Rpc url is invalid', async function () {
      const field = await waitUntilShowUp(screens.settings.fieldNewRPC)
      await field.sendKeys(invalidStringUrl)
      const button = await waitUntilShowUp(screens.settings.buttonSave)
      assert.equal(await button.getText(), 'Save', 'button has incorrect name')
      await click(button)
      await delay(1000)
      assert.equal(await waitUntilShowUp(screens.settings.buttons.delete, 5), false, 'invalid Rpc was added')
      const errors = await driver.findElements(screens.settings.error)
      assert.equal(errors.length, 1, 'error isn\'t displayed if Rpc url incorrect')
      assert.equal(await errors[0].getText(), screens.settings.errors.invalidRpcUrl, 'error\'s text incorrect')
    })

    it('error message if new Rpc url has no HTTP/HTTPS prefix', async function () {
      const fieldRpc = await driver.findElement(screens.settings.fieldNewRPC)
      await clearField(fieldRpc)
      await clearField(fieldRpc)
      await fieldRpc.sendKeys(urlWithoutHttp)
      const button = await waitUntilShowUp(screens.settings.buttonSave)
      await click(button)
      await delay(1000)
      assert.equal(await waitUntilShowUp(screens.settings.buttons.delete, 5), false, 'invalid Rpc was added')
      const errors = await driver.findElements(screens.settings.error)
      assert.equal(errors.length, 1, 'error isn\'t displayed if Rpc url incorrect')
      assert.equal(await errors[0].getText(), screens.settings.errors.invalidHTTP, 'error\'s text incorrect')
    })

    it('error message if Rpc doesn\'t exist', async function () {
      const fieldRpc = await driver.findElement(screens.settings.fieldNewRPC)
      await clearField(fieldRpc)
      await clearField(fieldRpc)
      await fieldRpc.sendKeys(invalidEndpoint)
      const button = await waitUntilShowUp(screens.settings.buttonSave)
      await click(button)
      await delay(1000)
      assert.equal(await waitUntilShowUp(screens.settings.buttons.delete, 5), false, 'invalid Rpc was added')
      await waitUntilShowUp(screens.settings.error)
      const errors = await driver.findElements(screens.settings.error)
      assert.equal(errors.length, 1, 'error isn\'t displayed if Rpc url incorrect')
      assert.equal(await errors[0].getText(), screens.settings.errors.invalidRpcEndpoint, 'error\'s text incorrect')
    })

    it('user can add valid custom rpc', async function () {
      const fieldRpc = await driver.findElement(screens.settings.fieldNewRPC)
      await clearField(fieldRpc)
      await clearField(fieldRpc)
      await clearField(fieldRpc)
      await clearField(fieldRpc)
      await fieldRpc.sendKeys(correctRpcUrl + 0)
      await driver.findElement(screens.settings.buttonSave).click()
      await delay(10000)
      const customUrlElement = await waitUntilShowUp(screens.settings.currentNetwork)
      assert.equal(await customUrlElement.getText(), correctRpcUrl + 0, 'Added Url doesn\'t match')
    })

    it('new added Rpc displayed in network dropdown menu', async function () {
      let menu = await waitUntilShowUp(screens.main.network)
      await menu.click()
      const item = await waitUntilShowUp(menus.networks.addedCustomRpc)
      assert.equal(await item.getText(), correctRpcUrl + 0, 'Added custom Url isn\'t displayed ')
      menu = await waitUntilShowUp(screens.main.network)
      await menu.click()
    })

    it('user can add four more valid custom rpc', async function () {
      const fieldRpc = await waitUntilShowUp(screens.settings.fieldNewRPC)
      const customUrlElement = await waitUntilShowUp(screens.settings.currentNetwork)
      for (let i = 1; i < 5; i++) {
        await clearField(fieldRpc)
        await clearField(fieldRpc)
        await clearField(fieldRpc)
        await clearField(fieldRpc)
        await fieldRpc.sendKeys(correctRpcUrl + i)
        await driver.findElement(screens.settings.buttonSave).click()
        await delay(5000)
        assert.equal(await customUrlElement.getText(), correctRpcUrl + i, '#' + i + ': Current RPC field contains incorrect URL')
      }
    })

    it('new added Rpc displayed in network dropdown menu', async function () {
      let menu = await waitUntilShowUp(screens.main.network)
      await menu.click()
      await waitUntilShowUp(menus.networks.addedCustomRpc)
      const items = await driver.findElements(menus.networks.addedCustomRpc)
      assert.equal(items.length, 5, 'Incorrect number of added RPC')

      menu = await waitUntilShowUp(screens.main.network)
      await menu.click()
    })

    it('click button \'Delete\' opens screen \'Delete Custom RPC\'', async function () {
      await delay(1000)
      const button = await waitUntilShowUp(screens.settings.buttons.delete, 10)
      assert.equal(await button.getText(), 'Delete', 'button has incorrect name')
      await click(button)
      const title = await waitUntilShowUp(screens.settings.title)
      assert.equal(await title.getText(), screens.deleteCustomRPC.titleText, 'inappropriate screen is opened')
    })

    it('click button \'No\' opens screen \'Settings\'', async function () {
      const button = await waitUntilShowUp(screens.deleteCustomRPC.buttons.no)
      assert.equal(await button.getText(), 'No', 'button has incorrect name')
      await click(button)
      const title = await waitUntilShowUp(screens.settings.title)
      assert.equal(await title.getText(), screens.settings.titleText, 'inappropriate screen is opened')
    })

    it('user able to delete custom rpc', async function () {
      const buttonDelete = await waitUntilShowUp(screens.settings.buttons.delete, 25)
      await click(buttonDelete)
      const yesButton = await waitUntilShowUp(screens.deleteCustomRPC.buttons.yes)
      assert.equal(await yesButton.getText(), 'Yes')
      await click(yesButton)
      const title = await waitUntilShowUp(screens.settings.title)
      assert.equal(await title.getText(), screens.settings.titleText, 'inappropriate screen is opened')
    })

    it('deleted custom rpc isn\'t displayed in \'Settings\' screen', async function () {
      const currentNetwork = await waitUntilShowUp(screens.settings.currentNetwork)
      assert.equal(await currentNetwork.getText(), 'POA Network', 'custom Rpc is displayed after deletion')
    })

    it('deleted custom rpc isn\'t displayed in network dropdown menu', async function () {
      await delay(2000)
      let menu = await waitUntilShowUp(screens.main.network)
      await menu.click()
      await waitUntilShowUp(menus.networks.addedCustomRpc, 20)
      const items = await driver.findElements(menus.networks.addedCustomRpc)
      assert.equal(items.length, 4, 'deleted custom rpc is displayed in network dropdown menu')
      menu = await waitUntilShowUp(screens.main.network)
      await menu.click()
    })
  })

  async function setProvider (network) {
    await delay(300)
    const menu = await waitUntilShowUp(screens.main.network)
    await menu.click()
    let counter
    switch (network) {
      case NETWORKS.POA:
        counter = 0
        break
      case NETWORKS.DAI:
        counter = 1
        break
      case NETWORKS.SOKOL:
        counter = 2
        break
      case NETWORKS.MAINNET:
        counter = 3
        break
      case NETWORKS.ROPSTEN:
        counter = 4
        break
      case NETWORKS.KOVAN:
        counter = 5
        break
      case NETWORKS.RINKEBY:
        counter = 6
        break
      case NETWORKS.LOCALHOST:
        counter = 7
        break
      case NETWORKS.CUSTOM:
        counter = 8
        break
      default:
        counter = 7
    }
    await driver.executeScript("document.getElementsByClassName('dropdown-menu-item')[" + counter + '].click();')
  }

  async function scrollTo (element) {
    try {
      await driver.executeScript('arguments[0].scrollIntoView();', element)
      return true
    } catch (err) {
      return false
    }
  }

  async function click (element) {
    try {
      await element.sendKeys(Key.RETURN)
      return true
    } catch (err) {
      return false
    }
  }

  async function clearField (field, number) {
    await click(field)
    if (number === undefined) number = 40
    for (let i = 0; i < number; i++) {
      await field.sendKeys(Key.BACK_SPACE)
    }
  }

  async function waitUntilDisappear (by, Twait) {
    if (Twait === undefined) Twait = 10
    do {
      if (!await isElementDisplayed(by)) return true

    } while (Twait-- > 0)
    return false
  }

  async function waitUntilShowUp (by, Twait) {
    if (Twait === undefined) Twait = 200
    do {
      await delay(100)
      if (await isElementDisplayed(by)) return await driver.findElement(by)
    } while (Twait-- > 0)
    return false
  }

  async function waitUntilHasValue (element, Twait) {
    if (Twait === undefined) Twait = 200
    let text
    do {
      await delay(100)
      text = await element.getAttribute('value')
      if (text !== '') return text
    } while (Twait-- > 0)
    return false
  }


  async function isElementDisplayed (by) {
    try {
      return await driver.findElement(by).isDisplayed()
    } catch (err) {
      return false
    }
  }

  async function assertTokensNotDisplayed () {
    try {
      await delay(800)
      await waitUntilDisappear(elements.loader)
      assert.notEqual(await waitUntilShowUp(screens.main.tokens.amount), false, 'App is frozen')
      // Check tokens title
      let locator = screens.main.tokens.counter
      if (process.env.SELENIUM_BROWSER === 'firefox') locator = screens.main.tokens.counterFF
      const tokensCounter = await waitUntilShowUp(locator)
      assert.notEqual(tokensCounter, false, '\'Token\'s counter isn\'t displayed ')
      assert.equal(await tokensCounter.getText(), screens.main.tokens.textNoTokens, 'Unexpected token presents')
      // Check if token presents
      const tokens = await driver.findElements(screens.main.tokens.token)
      assert.equal(tokens.length, 0, 'Unexpected token presents')
      return true
    } catch (err) {
      console.log(err)
      return false
    }
  }

  async function isDisabledAddInexistentToken (tokenAddress) {
    await delay(500)
    try {
      const tab = await waitUntilShowUp(screens.main.tokens.menu)
      await click(tab)
      const button = await waitUntilShowUp(screens.main.tokens.buttonAdd, 300)
      await click(button)
      let count = 20
      do {
        await delay(500)
        const tab = await waitUntilShowUp(screens.addToken.tab.custom, 10)
        try {
          await tab.click()
        } catch (err) {
        }
      }
      while ((await waitUntilShowUp(screens.addToken.custom.fields.contractAddress) === false) && (count-- > 0))
    } catch (err) {
    }
    const fieldAddress = await waitUntilShowUp(screens.addToken.custom.fields.contractAddress)
    await clearField(fieldAddress)
    await fieldAddress.sendKeys(tokenAddress)

    const fieldSymbols = await waitUntilShowUp(screens.addToken.custom.fields.tokenSymbol)
    if (await fieldSymbols.isEnabled()) {
      console.log('field symbols enabled')
      return false
    }

    const fieldDecimals = await waitUntilShowUp(screens.addToken.custom.fields.tokenSymbol)
    if (await fieldDecimals.isEnabled()) {
      console.log('field decimals enabled')
      return false
    }
    const buttonAdd = await waitUntilShowUp(screens.addToken.custom.buttons.add)
    if (await buttonAdd.isEnabled()) {
      console.log('button add enabled')
      return false
    }
    const buttonCancel = await waitUntilShowUp(screens.addToken.custom.buttons.cancel)
    let counter = 20
    do {
      await delay(500)
      await click(buttonCancel)
    }
    while (((await waitUntilShowUp(screens.main.identicon)) === false) && (counter-- > 0))
    if (counter < 1) {
      console.log('button cancel doesn\'t work')
      return false
    }
    return true
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

  async function switchToLastPage () {
    try {
      const allHandles = await driver.getAllWindowHandles()
      await driver.switchTo().window(allHandles[allHandles.length - 1])
      let counter = 100
      do {
        await delay(500)
        if (await driver.getCurrentUrl() !== '') return true
      }
      while (counter-- > 0)
      return true
    } catch (err) {
      return false
    }
  }

  async function switchToFirstPage () {
    try {
      const allHandles = await driver.getAllWindowHandles()
      console.log('allHandles.length ' + allHandles.length)
      await driver.switchTo().window(allHandles[0])
      let counter = 100
      do {
        await delay(500)
        if (await driver.getCurrentUrl() !== '') return true
      }
      while (counter-- > 0)
      return true
    } catch (err) {
      return false
    }
  }

  async function waitUntilCurrentUrl () {
    try {
      let title
      let counter = 20
      do {
        await delay(500)
        title = await driver.getCurrentUrl()
      } while ((title === '') && (counter-- > 0))
      if (counter < 1) return false
      return title
    } catch (err) {
      console.log(err)
      return false
    }
  }

  async function createToken (owner, { supply, name, decimals, ticker }, isDelayed) {

    const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545/'))
    const abi = [
      {
        'constant': true,
        'inputs': [],
        'name': 'name',
        'outputs': [
          {
            'name': '',
            'type': 'string',
          },
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      },
      {
        'constant': false,
        'inputs': [
          {
            'name': '_spender',
            'type': 'address',
          },
          {
            'name': '_value',
            'type': 'uint256',
          },
        ],
        'name': 'approve',
        'outputs': [
          {
            'name': 'success',
            'type': 'bool',
          },
        ],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function',
      },
      {
        'constant': true,
        'inputs': [],
        'name': 'totalSupply',
        'outputs': [
          {
            'name': '',
            'type': 'uint256',
          },
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      },
      {
        'constant': false,
        'inputs': [
          {
            'name': '_from',
            'type': 'address',
          },
          {
            'name': '_to',
            'type': 'address',
          },
          {
            'name': '_value',
            'type': 'uint256',
          },
        ],
        'name': 'transferFrom',
        'outputs': [
          {
            'name': 'success',
            'type': 'bool',
          },
        ],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function',
      },
      {
        'constant': true,
        'inputs': [
          {
            'name': '',
            'type': 'address',
          },
        ],
        'name': 'balances',
        'outputs': [
          {
            'name': '',
            'type': 'uint256',
          },
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      },
      {
        'constant': true,
        'inputs': [],
        'name': 'decimals',
        'outputs': [
          {
            'name': '',
            'type': 'uint8',
          },
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      },
      {
        'constant': true,
        'inputs': [
          {
            'name': '',
            'type': 'address',
          },
          {
            'name': '',
            'type': 'address',
          },
        ],
        'name': 'allowed',
        'outputs': [
          {
            'name': '',
            'type': 'uint256',
          },
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      },
      {
        'constant': true,
        'inputs': [
          {
            'name': '_owner',
            'type': 'address',
          },
        ],
        'name': 'balanceOf',
        'outputs': [
          {
            'name': 'balance',
            'type': 'uint256',
          },
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      },
      {
        'constant': true,
        'inputs': [],
        'name': 'symbol',
        'outputs': [
          {
            'name': '',
            'type': 'string',
          },
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      },
      {
        'constant': false,
        'inputs': [
          {
            'name': '_to',
            'type': 'address',
          },
          {
            'name': '_value',
            'type': 'uint256',
          },
        ],
        'name': 'transfer',
        'outputs': [
          {
            'name': 'success',
            'type': 'bool',
          },
        ],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function',
      },
      {
        'constant': true,
        'inputs': [
          {
            'name': '_owner',
            'type': 'address',
          },
          {
            'name': '_spender',
            'type': 'address',
          },
        ],
        'name': 'allowance',
        'outputs': [
          {
            'name': 'remaining',
            'type': 'uint256',
          },
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
      },
      {
        'inputs': [
          {
            'name': '_initialAmount',
            'type': 'uint256',
          },
          {
            'name': '_tokenName',
            'type': 'string',
          },
          {
            'name': '_decimalUnits',
            'type': 'uint8',
          },
          {
            'name': '_tokenSymbol',
            'type': 'string',
          },
        ],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'constructor',
      },
      {
        'anonymous': false,
        'inputs': [
          {
            'indexed': true,
            'name': '_from',
            'type': 'address',
          },
          {
            'indexed': true,
            'name': '_to',
            'type': 'address',
          },
          {
            'indexed': false,
            'name': '_value',
            'type': 'uint256',
          },
        ],
        'name': 'Transfer',
        'type': 'event',
      },
      {
        'anonymous': false,
        'inputs': [
          {
            'indexed': true,
            'name': '_owner',
            'type': 'address',
          },
          {
            'indexed': true,
            'name': '_spender',
            'type': 'address',
          },
          {
            'indexed': false,
            'name': '_value',
            'type': 'uint256',
          },
        ],
        'name': 'Approval',
        'type': 'event',
      },
    ]
    const bin = '608060405234801561001057600080fd5b50604051610e30380380610e308339810180604052810190808051906020019092919080518201929190602001805190602001909291908051820192919050505083600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508360008190555082600390805190602001906100b29291906100ee565b5081600460006101000a81548160ff021916908360ff16021790555080600590805190602001906100e49291906100ee565b5050505050610193565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061012f57805160ff191683800117855561015d565b8280016001018555821561015d579182015b8281111561015c578251825591602001919060010190610141565b5b50905061016a919061016e565b5090565b61019091905b8082111561018c576000816000905550600101610174565b5090565b90565b610c8e806101a26000396000f3006080604052600436106100af576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff16806306fdde03146100b4578063095ea7b31461014457806318160ddd146101a957806323b872dd146101d457806327e235e314610259578063313ce567146102b05780635c658165146102e157806370a082311461035857806395d89b41146103af578063a9059cbb1461043f578063dd62ed3e146104a4575b600080fd5b3480156100c057600080fd5b506100c961051b565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156101095780820151818401526020810190506100ee565b50505050905090810190601f1680156101365780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34801561015057600080fd5b5061018f600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506105b9565b604051808215151515815260200191505060405180910390f35b3480156101b557600080fd5b506101be6106ab565b6040518082815260200191505060405180910390f35b3480156101e057600080fd5b5061023f600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506106b1565b604051808215151515815260200191505060405180910390f35b34801561026557600080fd5b5061029a600480360381019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061094b565b6040518082815260200191505060405180910390f35b3480156102bc57600080fd5b506102c5610963565b604051808260ff1660ff16815260200191505060405180910390f35b3480156102ed57600080fd5b50610342600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610976565b6040518082815260200191505060405180910390f35b34801561036457600080fd5b50610399600480360381019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061099b565b6040518082815260200191505060405180910390f35b3480156103bb57600080fd5b506103c46109e4565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156104045780820151818401526020810190506103e9565b50505050905090810190601f1680156104315780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34801561044b57600080fd5b5061048a600480360381019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610a82565b604051808215151515815260200191505060405180910390f35b3480156104b057600080fd5b50610505600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610bdb565b6040518082815260200191505060405180910390f35b60038054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156105b15780601f10610586576101008083540402835291602001916105b1565b820191906000526020600020905b81548152906001019060200180831161059457829003601f168201915b505050505081565b600081600260003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040518082815260200191505060405180910390a36001905092915050565b60005481565b600080600260008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905082600160008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054101580156107825750828110155b151561078d57600080fd5b82600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254019250508190555082600160008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825403925050819055507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8110156108da5782600260008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825403925050819055505b8373ffffffffffffffffffffffffffffffffffffffff168573ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef856040518082815260200191505060405180910390a360019150509392505050565b60016020528060005260406000206000915090505481565b600460009054906101000a900460ff1681565b6002602052816000526040600020602052806000526040600020600091509150505481565b6000600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60058054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610a7a5780601f10610a4f57610100808354040283529160200191610a7a565b820191906000526020600020905b815481529060010190602001808311610a5d57829003601f168201915b505050505081565b600081600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205410151515610ad257600080fd5b81600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254039250508190555081600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040518082815260200191505060405180910390a36001905092915050565b6000600260008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050929150505600a165627a7a72305820979c62ae45244f66d713b9272cd9a32a6b8c2ba4778ec9fb58a39dc893cb9cde0029'

    const tokenContract = web3.eth.contract(abi)
    const contractInstance = await tokenContract.new(supply, name, decimals, ticker, {
      data: bin, from: owner, gas: 4500000, function (err, tokenContract) {
        if (err) {
          console.log('Error of token creation: ' + err)
        }
      },
    })
    if (isDelayed) await delay(5000)
    return contractInstance.address
  }

  async function executeTransferMethod(executor){
    try {
      const buttonExecute = await waitUntilShowUp(screens.executeMethod.buttonExecuteMethod)
      assert.notEqual(buttonExecute, false, "button doesn't displayed")
      await buttonExecute.click()
      //Select method transfer
      const menu = await waitUntilShowUp(screens.executeMethod.selectArrow)
      await menu.click()
      await waitUntilShowUp(screens.executeMethod.items)
      const list = await driver.findElements(screens.executeMethod.items)
      await list[21].click()
      //Fill out value
      await waitUntilShowUp(screens.executeMethod.fieldParameter)
      const fields = await driver.findElements(screens.executeMethod.fieldParameter)
      assert.notEqual(fields[1], false, "field value isn't displayed")
      await fields[1].sendKeys('1')
      //Fill out address
      await clearField(fields[0], 100)
      await fields[0].sendKeys(account1)
      assert.notEqual(fields[0], false, "field address isn't displayed")
      //Click button next
      const buttonNext = await waitUntilShowUp(screens.executeMethod.buttonNext)
      assert.notEqual(buttonNext, false, "button 'Next' isn't displayed")
      await buttonNext.click()
      //Select executor
      await waitUntilShowUp(screens.chooseContractExecutor.account)
      const accounts = await driver.findElements(screens.chooseContractExecutor.account)
      const account = accounts[executor+1]
      await account.click()
      //Open confirm transaction
      const button = await waitUntilShowUp(screens.chooseContractExecutor.buttonNext)
      await button.click()
      return true
    } catch (err){
      return false
    }
  }

})


