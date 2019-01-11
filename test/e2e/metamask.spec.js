const path = require('path')
const assert = require('assert')
const clipboardy = require('clipboardy')
const webdriver = require('selenium-webdriver')
const { By } = webdriver
const Func = require('./func').Functions
const { menus, screens, elements, NETWORKS } = require('./elements')
const testSeedPhrase = 'horn among position unable audit puzzle cannon apology gun autumn plug parrot'
const account1 = '0x2E428ABd9313D256d64D1f69fe3929C3BE18fD1f'
const account2 = '0xd7b7AFeCa35e32594e29504771aC847E2a803742'
const createdAccounts = []
const eventsEmitter = 'https://vbaranov.github.io/event-listener-dapp/'

describe('Metamask popup page', async function () {

  this.timeout(15 * 60 * 1000)
  const f = new Func()
  let driver, tokenAddress, extensionId
  let password = '123456789'
  let abiClipboard
  const newPassword = {
    correct: 'abcDEF123!@#',
    short: '123',
    incorrect: '1234567890',
  }
  const token = { supply: 101, name: 'Test', decimals: 0, ticker: 'ABC' }

  before(async function () {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      const extPath = path.resolve('dist/chrome')
      driver = await Func.buildChromeWebDriver(extPath)
      f.driver = driver
      extensionId = await f.getExtensionIdChrome()
      await driver.get(`chrome-extension://${extensionId}/popup.html`)

    } else if (process.env.SELENIUM_BROWSER === 'firefox') {
      const extPath = path.resolve('dist/firefox')
      driver = await Func.buildFirefoxWebdriver()
      f.driver = driver
      await f.installWebExt(extPath)
      await f.delay(700)
      extensionId = await f.getExtensionIdFirefox()
      await driver.get(`moz-extension://${extensionId}/popup.html`)
    }

  })

  afterEach(async function () {
    // logs command not supported in firefox
    // https://github.com/SeleniumHQ/selenium/issues/2910
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      // check for console errors
      const errors = await f.checkBrowserForConsoleErrors(driver)
      if (errors.length) {
        const errorReports = errors.map(err => err.message)
        const errorMessage = `Errors found in browser console:\n${errorReports.join('\n')}`
        console.log(errorMessage)
      }
    }
    // gather extra data if test failed
    if (this.currentTest.state === 'failed') {
      await f.verboseReportOnFailure(this.currentTest)
    }
  })

  after(async function () {
    await driver.quit()
  })

  describe('Setup', async function () {

    it('switches to extensions list', async function () {
      await f.delay(300)
      await f.switchToFirstPage()
      await f.delay(5000)
    })
  })

  describe('Log In', async function () {

    it('title is \'Nifty Wallet\'', async () => {
      const title = await driver.getTitle()
      assert.equal(title, 'Nifty Wallet', 'title is incorrect')
    })

    it('screen \'Terms of Use\' has not empty agreement', async () => {
      await f.delay(5000)
      const terms = await f.waitUntilShowUp(screens.TOU.agreement, 900)
      const text = await terms.getText()
      assert.equal(text.length > 400, true, 'agreement is too short')
    })

    it('screen \'Terms of Use\' has correct title', async () => {
      const terms = await f.waitUntilShowUp(screens.TOU.title)
      assert.equal(await terms.getText(), screens.TOU.titleText, 'title is incorrect')
    })

    it('checks if the TOU contains link \'Terms of service\'', async () => {
      const element = await f.waitUntilShowUp(screens.TOU.linkTerms)
      await f.scrollTo(screens.TOU.linkTerms)
      assert.notEqual(element, null, ' link \'Terms of service\' isn\'t present')
      assert.equal(await element.getText(), screens.TOU.linkTermsText, 'incorrect name of link \'Terms of service\'')
    })

    it('checks if the button \'Accept\' is present and enabled', async () => {
      const button = await f.waitUntilShowUp(screens.TOU.button)
      assert.notEqual(button, false, 'button isn\'t present')
      assert.equal(await button.isEnabled(), true, 'button isn\'t enabled')
      assert.equal(await button.getText(), 'Accept', 'button has incorrect name')
      await f.click(button)
    })

    it('accepts password with length of eight', async () => {
      const passwordBox = await f.waitUntilShowUp(screens.create.fieldPassword)
      const passwordBoxConfirm = await f.waitUntilShowUp(screens.create.fieldPasswordConfirm)
      const button = await f.waitUntilShowUp(screens.create.button)
      assert.equal(await button.getText(), 'Create', 'button has incorrect name')
      await passwordBox.sendKeys(password)
      await passwordBoxConfirm.sendKeys(password)
      await f.click(button)
    })

    it('shows vault was created and seed phrase', async () => {
      await f.delay(300)
      const element = await f.waitUntilShowUp(screens.seedPhrase.fieldPhrase)
      const seedPhrase = await element.getText()
      assert.equal(seedPhrase.split(' ').length, 12)
      const continueAfterSeedPhrase = await f.waitUntilShowUp(screens.seedPhrase.buttonIveCopied)
      assert.equal(await continueAfterSeedPhrase.getText(), screens.seedPhrase.textButtonIveCopied)
      await f.click(continueAfterSeedPhrase)
    })
  })

  describe('Account Creation', async function () {

    const newAccountName = 'new name'

    it('sets provider type to localhost', async function () {
      await f.setProvider(NETWORKS.LOCALHOST)
      await f.delay(2000)
    })

    it('copy icon is displayed and clickable', async () => {
      const field = await f.waitUntilShowUp(screens.main.iconCopy)
      await field.click()
      assert.notEqual(field, false, 'copy icon doesn\'t present')
    })

    it("Account's address is displayed and has length 20 symbols", async () => {
      const field = await f.waitUntilShowUp(screens.main.address)
      createdAccounts.push((await field.getText()).toUpperCase())
      console.log(createdAccounts[0])
      assert.notEqual(createdAccounts[0].length, 20, "address isn't displayed")
    })

    it('Check clipboard buffer', async function () {
      const text = clipboardy.readSync()
      assert.equal(text.length, 42, "address account wasn't copied to clipboard")
    })

    it('open  \'Account name\' change dialog', async () => {
      const menu = await f.waitUntilShowUp(menus.dot.menu)
      await menu.click()
      const field = await f.waitUntilShowUp(screens.main.edit)
      await field.click()
      const accountName = await f.waitUntilShowUp(screens.main.fieldAccountName)
      assert.notEqual(accountName, false, '\'Account name\' change dialog isn\'t opened')
      assert.equal(await accountName.getAttribute('value'), 'Account 1', 'incorrect account name')
    })

    it('fill out new account\'s name', async () => {
      const field = await f.waitUntilShowUp(screens.main.fieldAccountName)
      await field.clear()
      await field.sendKeys(newAccountName)
    })

    it('dialog \'Account name\' is disappeared if click button \'Save\'', async () => {
      const button = await f.waitUntilShowUp(screens.main.buttons.save)
      assert.equal(await button.getText(), 'Save', 'button has incorrect name')
      assert.notEqual(button, true, 'button \'Save\' does not present')
      await f.click(button)
      const accountName = await f.waitUntilShowUp(screens.main.fieldAccountName, 10)
      assert.equal(accountName, false, '\'Account name\' change dialog isn\'t opened')
    })

    it('account has new name', async function () {
      const accountMenu = await f.waitUntilShowUp(menus.account.menu)
      await accountMenu.click()
      const account1 = await f.waitUntilShowUp(menus.account.account1)
      assert.equal(await account1.getText(), newAccountName, 'account\'s name didn\'t changed')
      await accountMenu.click()
    })

    it('adds a second account', async function () {
      const accountMenu = await f.waitUntilShowUp(menus.account.menu)
      await accountMenu.click()
      const item = await f.waitUntilShowUp(menus.account.createAccount)
      await item.click()
    })

    it("Account's address is displayed and has length 20 symbols", async () => {
      const field = await f.waitUntilShowUp(screens.main.address)
      createdAccounts.push((await field.getText()).toUpperCase())
      console.log(createdAccounts[1])
      assert.notEqual(createdAccounts[1].length, 20, "address isn't displayed")
    })

    it('logs out of the vault', async () => {
      const menu = await f.waitUntilShowUp(menus.sandwich.menu)
      await menu.click()
      await f.delay(500)
      const button = await f.waitUntilShowUp(menus.sandwich.logOut)
      assert.equal(await button.getText(), 'Log Out', 'button has incorrect name')
      await button.click()
    })

    it('accepts account password after lock', async () => {
      const box = await f.waitUntilShowUp(screens.lock.fieldPassword)
      await box.sendKeys(password)
      const button = await f.waitUntilShowUp(screens.lock.buttonLogin)
      assert.equal(await button.getText(), 'Log In', 'button has incorrect name')
      await f.click(button)
    })

    it('shows QR code option', async () => {
      const menu = await f.waitUntilShowUp(menus.dot.menu)
      await menu.click()
      const item = await f.waitUntilShowUp(menus.dot.showQRcode)
      await item.click()
    })

    it('checks QR code address is the same as account details address', async () => {
      const field = await f.waitUntilShowUp(screens.QRcode.address)
      const text = await field.getText()
      assert.equal(text.toUpperCase(), createdAccounts[1], 'QR address doesn\'t match')
    })

    it('copy icon is displayed and clickable', async () => {
      const field = await f.waitUntilShowUp(screens.QRcode.iconCopy)
      await field.click()
      assert.notEqual(field, false, 'copy icon doesn\'t present')
    })

    it('Check clipboard buffer', async function () {
      const text = clipboardy.readSync()
      assert.equal(text.length, 42, "address account wasn't copied to clipboard")
    })

    it('close QR code screen by clicking button arrow', async () => {
      const button = await f.waitUntilShowUp(screens.QRcode.buttonArrow)
      await f.click(button)
    })

    it('user is able to open \'Info\' screen', async function () {
      const accountMenu = await f.waitUntilShowUp(menus.sandwich.menu)
      await accountMenu.click()
      const item = await f.waitUntilShowUp(menus.sandwich.info)
      await item.click()
    })

    it('screen \'Info\' has correct title', async function () {
      const title = await f.waitUntilShowUp(screens.info.title)
      assert.equal(await title.getText(), screens.info.titleText, 'title is incorrect')
    })

    it('close \'Info\' screen by clicking button arrow', async () => {
      const button = await f.waitUntilShowUp(screens.info.buttonArrow)
      await button.click()
    })
  })

  describe('Import Account', async function () {

    it('Open import account menu', async function () {
      await f.setProvider(NETWORKS.POA)
      await f.delay(2000)
      const menu = await f.waitUntilShowUp(menus.account.menu)
      await menu.click()
      const item = await f.waitUntilShowUp(menus.account.import)
      await item.click()
      const importAccountTitle = await f.waitUntilShowUp(screens.importAccounts.title)
      assert.equal(await importAccountTitle.getText(), screens.importAccounts.textTitle)
    })

    it('Imports account', async function () {
      const privateKeyBox = await f.waitUntilShowUp(screens.importAccounts.fieldPrivateKey)
      await privateKeyBox.sendKeys('76bd0ced0a47055bb5d060e1ae4a8cb3ece658d668823e250dae6e79d3ab4435')// 0xf4702CbA917260b2D6731Aea6385215073e8551b
      const button = await f.waitUntilShowUp(screens.importAccounts.buttonImport)
      await f.click(button)
      assert.equal(await button.getText(), 'Import', 'button has incorrect name')
      const menu = await f.waitUntilShowUp(menus.account.menu)
      await menu.click()
      await f.waitUntilShowUp(menus.account.label)
      const label = (await driver.findElements(menus.account.label))[0]
      assert.equal(await label.getText(), 'IMPORTED')
      await menu.click()
    })

    it('Auto-detect tokens for POA core network ', async function () {
      // await setProvider(NETWORKS.POA)
      const tab = await f.waitUntilShowUp(screens.main.tokens.menu)
      await tab.click()
      const balance = await f.waitUntilShowUp(screens.main.tokens.balance)
      console.log(await balance.getText())
      assert.equal(await balance.getText(), '1 DOPR', 'token isnt\' auto-detected')
    })

    it.skip('Auto-detect tokens for MAIN core network ', async function () {
      await f.setProvider(NETWORKS.MAINNET)
      await f.waitUntilShowUp(elements.loader, 25)
      await f.waitUntilDisappear(elements.loader, 25)
      const balance = await f.waitUntilShowUp(screens.main.tokens.balance)
      console.log(await balance.getText())
      assert.equal(await balance.getText(), '0.001 WETH', 'token isnt\' auto-detected')
    })

    it('Check Sokol balance', async function () {
      await f.setProvider(NETWORKS.POA)
      await f.delay(2000)
      const balanceField = await f.waitUntilShowUp(screens.main.balance)
      const balance = await balanceField.getText()
      console.log('Account = 0xf4702CbA917260b2D6731Aea6385215073e8551b')
      console.log('Balance = ' + balance)
      assert.equal(parseFloat(balance) > 0.001, true, 'Balance of account 0xf4702CbA917260b2D6731Aea6385215073e8551b TOO LOW !!! Please refill with Sokol eth!!!!')
    })
  })

  describe('Import Contract account', async function () {

    const contractSokol = '0x215b2ab35749e5a9f3efe890de602fb9844e842f'
    console.log('Contract ' + contractSokol + ' , Sokol')
    const wrongAddress = '0xB87b6077D59B01Ab9fa8cd5A1A21D02a4d60D35'
    const notContractAddress = '0x56B2e3C3cFf7f3921Dc2e0F8B8e20d1eEc29216b'

    describe('Import Contract', async () => {

      it('opens import account menu', async function () {
        await f.setProvider(NETWORKS.ROPSTEN)
        const menu = await f.waitUntilShowUp(menus.account.menu)
        await menu.click()
        const item = await f.waitUntilShowUp(menus.account.import2)
        await item.click()
        const importAccountTitle = await f.waitUntilShowUp(screens.importAccounts.title)
        assert.equal(await importAccountTitle.getText(), screens.importAccounts.textTitle)
      })

      it("Warning's  text is correct", async function () {
        const field = await f.waitUntilShowUp(screens.importAccounts.warning)
        assert.equal(await field.getText(), 'Imported accounts will not be associated with your originally created Nifty Wallet account seedphrase.', "incorrect warning's text")
      })

      it("Select type 'Contract'", async function () {
        await f.delay(1000)
        const field = await f.waitUntilShowUp(screens.importAccounts.selectArrow)
        await field.click()
        const item = await f.waitUntilShowUp(screens.importAccounts.itemContract)
        await item.click()
      })

      it("Field 'Address' is displayed", async function () {
        const field = await f.waitUntilShowUp(screens.importAccounts.contractAddress)
        assert.notEqual(field, false, "field 'Address' isn't displayed")
        await field.sendKeys(wrongAddress)
      })

      it("Button 'Import' is displayed", async function () {
        const button = await f.waitUntilShowUp(screens.importAccounts.buttonImport)
        assert.notEqual(button, false, "button 'Import' isn't displayed")
        assert.equal(await button.getText(), 'Import', 'wrong name of button')
      })

      it("Button 'Import' is disabled  if incorrect address", async function () {
        const button = await f.waitUntilShowUp(screens.importAccounts.buttonImport)
        assert.equal(await button.isEnabled(), false, 'button enabled')
      })

      it("Field 'ABI' is displayed", async function () {
        const field = await f.waitUntilShowUp(screens.importAccounts.contractABI)
        assert.notEqual(field, false, "field 'ABI' isn't displayed")
      })

      it("Field 'ABI' is empty if contract isn't verified in current network", async function () {
        const field = await f.waitUntilShowUp(screens.importAccounts.contractABI)
        assert.equal(await field.getText(), '', "field 'ABI' isn't displayed")
      })

      it("Fill 'Address' with not contract address , SOKOL", async function () {
        await f.setProvider(NETWORKS.SOKOL)
        const field = await f.waitUntilShowUp(screens.importAccounts.contractAddress)
        await f.clearField(field, 100)
        await field.sendKeys(notContractAddress)
      })

      it("Button 'Import' is disabled  if not contract address", async function () {
        const button = await f.waitUntilShowUp(screens.importAccounts.buttonImport)
        assert.equal(await button.isEnabled(), false, 'button enabled')
      })

      it("Fill 'Address' with valid contract , SOKOL", async function () {
        const field = await f.waitUntilShowUp(screens.importAccounts.contractAddress)
        await f.clearField(field, 100)
        await field.sendKeys(contractSokol)
      })

      it("Button 'Import' is enabled if contract address is correct", async function () {
        await f.delay(5000)
        const button = await f.waitUntilShowUp(screens.importAccounts.buttonImport)
        assert.equal(await button.isEnabled(), true, 'button enabled')
      })

      it('ABI is fetched ', async function () {
        const field = await f.waitUntilShowUp(screens.importAccounts.contractABI)
        abiClipboard = await field.getText()
        assert.equal(abiClipboard.length, 4457, "ABI isn't fetched")
      })

      it('icon copy is displayed for ABI ', async function () {
        const field = await f.waitUntilShowUp(screens.importAccounts.iconCopy)
        assert.notEqual(field, false, "icon copy isn't displayed")
        await field.click()
      })

      it('Check clipboard buffer', async function () {
        const text = clipboardy.readSync()
        assert.equal(text, abiClipboard, "address account wasn't copied to clipboard")
      })

      it("Click button 'Import', main screen opens", async function () {
        const button = await f.waitUntilShowUp(screens.importAccounts.buttonImport)
        await f.click(button)
        const ident = await f.waitUntilShowUp(screens.main.identicon, 20)
        assert.notEqual(ident, false, "main screen isn't opened")
      })
    })

    describe("Check 3dot menu for 'Contract' account", () => {

      it('open 3dot menu', async function () {
        const menu = await f.waitUntilShowUp(menus.dot.menu)
        await menu.click()
        await f.waitUntilShowUp(menus.dot.item)
        const items = await driver.findElements(menus.dot.item)
        assert.equal(items.length, 4, '3dot menu has incorrect number of items')
      })

      it('Check text of items', async function () {
        const items = await driver.findElements(menus.dot.item)
        assert.equal(await items[0].getText(), 'View on block explorer', '1st item has incorrect text')
        assert.equal(await items[1].getText(), 'Show QR Code', '2st item has incorrect text')
        assert.equal(await items[2].getText(), 'Copy address to clipboard', '3st item has incorrect text')
        assert.equal(await items[3].getText(), 'Copy ABI to clipboard', '4st item has incorrect text')
      })

      it("Click 'Copy ABI'", async function () {
        const items = await driver.findElements(menus.dot.item)
        await items[3].click()
        const menu = await f.waitUntilShowUp(menus.dot.item, 20)
        assert.equal(menu, false, "3dot menu wasn't closed")
      })

      it('Check clipboard buffer', async function () {
        const text = clipboardy.readSync()
        assert.equal(text, abiClipboard, "ABI wasn't copied to clipboard")
      })
    })

    describe('Execute Method screen', () => {
      const notContractAddress = '0x56B2e3C3cFf7f3921Dc2e0F8B8e20d1eEc29216b'
      describe("Check UI and button's functionality", () => {

        it("Click button 'Execute method'", async function () {
          await driver.navigate().refresh()
          await f.delay(2000)
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonExecuteMethod)
          assert.notEqual(button, false, "button doesn't displayed")
          assert.equal(await button.getText(), 'Execute methods', 'button has incorrect name')
          await button.click()
        })

        it('title is displayed and correct', async function () {
          const title = await f.waitUntilShowUp(screens.executeMethod.title)
          assert.notEqual(title, false, 'title isn\'t displayed')
          assert.equal(await title.getText(), screens.executeMethod.titleText, 'incorrect text')
        })

        it('Click arrow  button leads to main screen', async function () {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonArrow)
          await f.click(button)
          const identicon = await f.waitUntilShowUp(screens.main.identicon, 40)
          assert.notEqual(identicon, false, "main screen isn't opened")
        })
      })

      describe('Check output for data type : ADDRESS', () => {

        const address = '0x56B2e3C3cFf7f3921Dc2e0F8B8e20d1eEc29216b'

        it("Click button 'Execute method'", async function () {
          await driver.navigate().refresh()
          await f.delay(2000)
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonExecuteMethod)
          assert.notEqual(button, false, "button doesn't displayed")
          assert.equal(await button.getText(), 'Execute methods', 'button has incorrect name')
          await button.click()
        })

        it("Select method 'returnAddress'", async function () {
          const field = await f.waitUntilShowUp(screens.executeMethod.selectArrow)
          await field.click()
          await f.waitUntilShowUp(screens.executeMethod.items)
          const list = await driver.findElements(screens.executeMethod.items)
          await list[3].click()
          assert.equal(list.length, 22, "drop down menu isn't displayed")
        })

        it("Button 'Call data' is displayed and disabled", async function () {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), false, "Button 'Call data' is enabled")
        })

        it("Fill out input field 'Address'", async function () {
          await f.waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[0], false, "field parameter#1 isn't displayed")
          await fields[0].sendKeys(address)
        })

        it("Button 'Call data' is displayed and enabled", async function () {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), true, "Button 'Call data' is disabled")
          await button.click()
        })

        it('method returns correct value', async function () {
          await f.delay(3000)
          await f.waitUntilShowUp(screens.executeMethod.fieldOutput)
          const fields = await driver.findElements(screens.executeMethod.fieldOutput)
          assert.notEqual(fields[1], false, "field 'Output'  isn't displayed")
          const text = await f.waitUntilHasValue(fields[1])
          assert.equal(text.toLowerCase(), address.toLowerCase(), 'incorrect value was returned')
        })

        it('icon copy cliboard is displayed and clickable', async function () {
          const icon = await f.waitUntilShowUp(screens.executeMethod.copy)
          assert.notEqual(icon, false, 'icon copy isn\'t displayed')
          await icon.click()
        })

        it('Check clipboard buffer', async function () {
          const text = clipboardy.readSync()
          assert.equal(text.toLowerCase(), address.toLowerCase(), "output wasn't copied to clipboard")
        })

        it("2nd call doesn't throw the error", async function () {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          await button.click()
          const field = await f.waitUntilShowUp(screens.executeMethod.fieldOutput)
          assert.notEqual(field, false, "field 'Output'  isn't displayed")
          const text = await f.waitUntilHasValue(field)
          assert.equal(text.toLowerCase(), address.toLowerCase(), 'incorrect value was returned')
        })
      })

      describe('Check output for data type : STRING', () => {
        const stringValue = 'POA network'

        it("Select method 'returnString'", async function () {
          await f.delay(3000)
          const field = await f.waitUntilShowUp(screens.executeMethod.selectArrow)
          await field.click()
          await f.waitUntilShowUp(screens.executeMethod.items)
          const list = await driver.findElements(screens.executeMethod.items)
          await list[14].click()
          assert.equal(list.length, 22, "drop down menu isn't displayed")
        })

        it('Fill out input parameter field ', async function () {
          await f.waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[0], false, "field parameter#1 isn't displayed")
          await fields[0].sendKeys(stringValue)
        })

        it("Click button 'Call data' ", async function () {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), true, "Button 'Call data' is disabled")
          await button.click()
        })

        it('method returns correct value', async function () {
          await f.delay(3000)
          await f.waitUntilShowUp(screens.executeMethod.fieldOutput)
          const fields = await driver.findElements(screens.executeMethod.fieldOutput)
          assert.notEqual(fields[1], false, "field 'Output'  isn't displayed")
          const text = await f.waitUntilHasValue(fields[1])
          assert.equal(text, stringValue, 'incorrect value was returned')
        })

        it('icon copy cliboard is displayed and clickable', async function () {
          const icon = await f.waitUntilShowUp(screens.executeMethod.copy)
          assert.notEqual(icon, false, 'icon copy isn\'t displayed')
          await icon.click()
        })

        it('Check clipboard buffer', async function () {
          const text = clipboardy.readSync()
          assert.equal(text.toLowerCase(), stringValue.toLowerCase(), "output wasn't copied to clipboard")
        })
      })

      describe('Check output for data type : BOOLEAN', () => {

        it("Select method 'returnBoolean'", async function () {
          const field = await f.waitUntilShowUp(screens.executeMethod.selectArrow)
          await field.click()
          await f.waitUntilShowUp(screens.executeMethod.items)
          const list = await driver.findElements(screens.executeMethod.items)
          await list[5].click()
          assert.equal(list.length, 22, "drop down menu isn't displayed")
        })

        it('Select value TRUE from dropdown menu', async function () {
          const arrows = await driver.findElements(screens.executeMethod.selectArrow)
          await arrows[1].click()
          await f.waitUntilShowUp(screens.executeMethod.items)
          const list = await driver.findElements(screens.executeMethod.items)
          assert.equal(await list[1].getText(), 'true', 'TRUE menu item: incorrect text')
          assert.equal(list.length, 2, "drop down menu isn't displayed")
          await list[1].click()
        })

        it("Click button 'Call data' ", async function () {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), true, "Button 'Call data' is disabled")
          await button.click()
        })

        it('method returns correct value: TRUE', async function () {
          await f.delay(3000)
          await f.waitUntilShowUp(screens.executeMethod.fieldOutput)
          const fields = await driver.findElements(screens.executeMethod.fieldOutput)
          assert.notEqual(fields[0], false, "field 'Output'  isn't displayed")
          const text = await f.waitUntilHasValue(fields[0])
          assert.equal(text, 'true', 'incorrect value was returned')
        })

        it('Select value FALSE from dropdown menu', async function () {
          const arrows = await driver.findElements(screens.executeMethod.selectArrow)
          await arrows[1].click()
          await f.waitUntilShowUp(screens.executeMethod.items)
          const list = await driver.findElements(screens.executeMethod.items)
          assert.equal(await list[0].getText(), 'false', 'FALSE menu item: incorrect text')
          assert.equal(list.length, 2, "drop down menu isn't displayed")
          await list[0].click()
        })

        it("Click button 'Call data' ", async function () {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), true, "Button 'Call data' is disabled")
          await button.click()
        })

        it('method returns correct value, FALSE', async function () {
          await f.delay(3000)
          await f.waitUntilShowUp(screens.executeMethod.fieldOutput)
          const fields = await driver.findElements(screens.executeMethod.fieldOutput)
          assert.notEqual(fields[0], false, "field 'Output'  isn't displayed")
          const text = await f.waitUntilHasValue(fields[0])
          assert.equal(text, 'false', 'incorrect value was returned')
        })

        it('icon copy cliboard is displayed and clickable', async function () {
          const icon = await f.waitUntilShowUp(screens.executeMethod.copy)
          assert.notEqual(icon, false, 'icon copy isn\'t displayed')
          await icon.click()
        })

        it('Check clipboard buffer', async function () {
          const text = clipboardy.readSync()
          assert.equal(text.toLowerCase(), 'false', "output wasn't copied to clipboard")
        })

      })

      describe('Check output for data type : BYTES', () => {

        const bytesValue = '0x010203'

        it("Select method 'returnBytes1'", async function () {
          const field = await f.waitUntilShowUp(screens.executeMethod.selectArrow)
          await field.click()
          await f.waitUntilShowUp(screens.executeMethod.items)
          const list = await driver.findElements(screens.executeMethod.items)
          await list[7].click()
          assert.equal(list.length, 22, "drop down menu isn't displayed")
        })

        it('Fill out input parameter field ', async function () {
          await f.waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[0], false, "field parameter#1 isn't displayed")
          await fields[0].sendKeys(bytesValue)
        })

        it("Click button 'Call data' ", async function () {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), true, "Button 'Call data' is disabled")
          await button.click()
        })

        it('method returns correct value', async function () {
          await f.delay(3000)
          await f.waitUntilShowUp(screens.executeMethod.fieldOutput)
          const fields = await driver.findElements(screens.executeMethod.fieldOutput)
          assert.notEqual(fields[1], false, "field 'Output'  isn't displayed")
          const text = await f.waitUntilHasValue(fields[1])
          assert.equal(text, bytesValue, 'incorrect value was returned')
        })

        it('icon copy cliboard is displayed and clickable', async function () {
          const icon = await f.waitUntilShowUp(screens.executeMethod.copy)
          assert.notEqual(icon, false, 'icon copy isn\'t displayed')
          await icon.click()
        })

        it('Check clipboard buffer', async function () {
          const text = clipboardy.readSync()
          assert.equal(text.toLowerCase(), bytesValue.toLowerCase(), "output wasn't copied to clipboard")
        })
      })

      describe('Check output for data type : UINT256', () => {

        const uint256Value = '1122334455667788991122334455667788'

        it("Select method 'returnUint256'", async function () {
          const field = await f.waitUntilShowUp(screens.executeMethod.selectArrow)
          await field.click()
          await f.waitUntilShowUp(screens.executeMethod.items)
          const list = await driver.findElements(screens.executeMethod.items)
          await list[17].click()
          assert.equal(list.length, 22, "drop down menu isn't displayed")
        })

        it('Fill out input parameter field ', async function () {
          await f.waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[0], false, "field parameter#1 isn't displayed")
          await fields[0].sendKeys(uint256Value)
        })

        it("Click button 'Call data' ", async function () {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), true, "Button 'Call data' is disabled")
          await button.click()
        })

        it('method returns correct value', async function () {
          await f.delay(3000)
          await f.waitUntilShowUp(screens.executeMethod.fieldOutput)
          const fields = await driver.findElements(screens.executeMethod.fieldOutput)
          assert.notEqual(fields[1], false, "field 'Output'  isn't displayed")
          const text = await f.waitUntilHasValue(fields[1])
          assert.equal(text, uint256Value, 'incorrect value was returned')
        })

        it('icon copy cliboard is displayed and clickable', async function () {
          const icon = await f.waitUntilShowUp(screens.executeMethod.copy)
          assert.notEqual(icon, false, 'icon copy isn\'t displayed')
          await icon.click()
        })

        it('Check clipboard buffer', async function () {
          const text = clipboardy.readSync()
          assert.equal(text.toLowerCase(), uint256Value.toLowerCase(), "output wasn't copied to clipboard")
        })
      })

      describe('Check output for data type : INT256', () => {

        const int256Value = '-1122334455667788991122334455667788'

        it("Select method 'returnInt256'", async function () {
          const field = await f.waitUntilShowUp(screens.executeMethod.selectArrow)
          await field.click()
          await f.waitUntilShowUp(screens.executeMethod.items)
          const list = await driver.findElements(screens.executeMethod.items)
          await list[10].click()
          assert.equal(list.length, 22, "drop down menu isn't displayed")
        })

        it('Fill out input parameter field ', async function () {
          await f.waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[0], false, "field parameter#1 isn't displayed")
          await fields[0].sendKeys(int256Value)
        })

        it("Click button 'Call data' ", async function () {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCall)
          assert.notEqual(button, false, "button 'Call data' isn't displayed")
          assert.equal(await button.isEnabled(), true, "Button 'Call data' is disabled")
          await button.click()
        })

        it('method returns correct value', async function () {
          await f.delay(3000)
          await f.waitUntilShowUp(screens.executeMethod.fieldOutput)
          const fields = await driver.findElements(screens.executeMethod.fieldOutput)
          assert.notEqual(fields[1], false, "field 'Output'  isn't displayed")
          const text = await f.waitUntilHasValue(fields[1])
          assert.equal(text, int256Value, 'incorrect value was returned')
        })

        it('icon copy cliboard is displayed and clickable', async function () {
          const icon = await f.waitUntilShowUp(screens.executeMethod.copy)
          assert.notEqual(icon, false, 'icon copy isn\'t displayed')
          await icon.click()
        })

        it('Check clipboard buffer', async function () {
          const text = clipboardy.readSync()
          assert.equal(text.toLowerCase(), int256Value.toLowerCase(), "output wasn't copied to clipboard")
        })
      })

      describe('Check executed method', () => {

        it("Select method 'transfer'", async function () {
          const field = await f.waitUntilShowUp(screens.executeMethod.selectArrow)
          await field.click()
          await f.waitUntilShowUp(screens.executeMethod.items)
          const list = await driver.findElements(screens.executeMethod.items)
          await list[21].click()
          assert.equal(list.length, 22, "drop down menu isn't displayed")
        })

        it("Button 'Copy ABI encoded' is displayed", async function () {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCopyABI)
          assert.notEqual(button, false, "button 'Copy ABI encoded' isn't displayed")
        })

        it("Button 'Copy ABI encoded' is disabled", async function () {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCopyABI)
          assert.equal(await button.isEnabled(), false, "button 'Copy ABI encoded' enabled")
        })

        it("Button 'Next' is disabled", async function () {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonNext)
          assert.equal(await button.isEnabled(), false, "button 'Next' enabled")
        })

        it("Fill out parameter '_value' with valid data", async function () {
          await f.waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[1], false, "field address isn't displayed")
          await fields[1].sendKeys('1')
        })

        it("Button 'Copy ABI encoded' is disabled", async function () {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCopyABI)
          assert.equal(await button.isEnabled(), false, "button 'Copy ABI encoded' enabled")
        })

        it("Button 'Next' is disabled", async function () {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonNext)
          assert.equal(await button.isEnabled(), false, "button 'Next' enabled")
        })
        it("Fill out parameter '_to'  with wrong data", async function () {
          await f.waitUntilShowUp(screens.executeMethod.fieldParameter)
          const fields = await driver.findElements(screens.executeMethod.fieldParameter)
          assert.notEqual(fields[0], false, "field address isn't displayed")
          await fields[0].sendKeys(wrongAddress)
        })

        it("Error message if click 'Copy ABI encoded' with wrong address", async function () {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCopyABI)
          await button.click()
          const error = await f.waitUntilShowUp(elements.error)
          assert.notEqual(error, false, 'no error message')
        })

        it('Close error message', async function () {
          const button = await f.waitUntilShowUp(elements.errorClose)
          await button.click()
          const title = await f.waitUntilShowUp(screens.executeMethod.title)
          assert.notEqual(title, false, "error message isn't closed")
        })

        it.skip("Error message if click 'Next' with wrong address", async function () {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonNext)
          await button.click()
          const error = await f.waitUntilShowUp(elements.error)
          assert.notEqual(error, false, 'no error message')
        })

        it.skip('Close error message', async function () {
          const button = await f.waitUntilShowUp(elements.errorClose)
          await button.click()
          const title = await f.waitUntilShowUp(screens.executeMethod.title)
          assert.notEqual(title, false, "error message isn't closed")
        })

        it("Fill out parameter '_to' with valid data", async function () {
          const field = await f.waitUntilShowUp(screens.executeMethod.fieldParameter)
          await f.clearField(field, 100)
          await field.sendKeys(notContractAddress)
          assert.notEqual(field, false, "field address isn't displayed")
        })

        it("Button 'Next' is enabled", async function () {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonNext)
          assert.equal(await button.isEnabled(), true, "button 'Next' disabled")
        })

        it("Button 'Copy ABI encoded' is enabled", async function () {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonCopyABI)
          assert.equal(await button.isEnabled(), true, "button 'Copy ABI encoded' disabled")
          await button.click()
        })

        it("Click button 'Next'", async function () {
          const button = await f.waitUntilShowUp(screens.executeMethod.buttonNext)
          assert.notEqual(button, false, "button 'Next' isn't displayed")
          await button.click()
        })
      })
    })

    describe('Choose Contract Executor', () => {

      it('Title is displayed and correct', async function () {
        await f.delay(5000)
        const title = await f.waitUntilShowUp(screens.chooseContractExecutor.title)
        assert.notEqual(title, false, 'title isn\'t displayed')
        assert.equal(await title.getText(), screens.chooseContractExecutor.titleText, 'incorrect text')
      })

      it('Two accounts displayed', async function () {
        const accs = await f.waitUntilShowUp(screens.chooseContractExecutor.account)
        assert.notEqual(accs, false, 'accounts aren\'t displayed')
        const accounts = await driver.findElements(screens.chooseContractExecutor.account)
        assert.equal(accounts.length, 4, "number of accounts isn't 2")
      })

      it("Click arrow button leads to 'Execute Method' screen ", async function () {
        const button = await f.waitUntilShowUp(screens.chooseContractExecutor.buttonArrow)
        assert.notEqual(button, false, 'button isn\'t displayed')
        await button.click()
        await f.delay(2000)

        const title = await f.waitUntilShowUp(screens.executeMethod.title)
        assert.notEqual(title, false, 'title isn\'t displayed')
        assert.equal(await title.getText(), screens.executeMethod.titleText, "'Execute Method' screen isn't opened")
      })

      it("Return back to 'Choose Contract Executor' screen", async function () {
        const button = await f.waitUntilShowUp(screens.executeMethod.buttonNext)
        assert.notEqual(button, false, "button 'Next' isn't displayed")
        await button.click()
      })

      it("Button 'Next' is disabled by default", async function () {
        const button = await f.waitUntilShowUp(screens.chooseContractExecutor.buttonNext)
        assert.notEqual(button, false, 'button isn\'t displayed')
        assert.equal(await button.isEnabled(), false, 'button enabled by default')
      })

      it('User is able to select account', async function () {
        await f.waitUntilShowUp(screens.chooseContractExecutor.account)
        const accounts = await driver.findElements(screens.chooseContractExecutor.account)
        await f.delay(1000)
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
        const button = await f.waitUntilShowUp(screens.chooseContractExecutor.buttonNext)
        await button.click()
        await f.delay(3000)
        const reject = await f.waitUntilShowUp(screens.confirmTransaction.button.reject)
        assert.notEqual(reject, false, "button reject isn't displayed")
      })

      it("Button 'Buy POA' is displayed", async function () {
        const button = await f.waitUntilShowUp(screens.confirmTransaction.button.buyEther)
        assert.equal(await button.getText(), 'Buy POA', 'button has incorrect name')
        assert.equal(await button.isEnabled(), true, 'button is disabled')
      })

      it("Open screen 'Buy'", async function () {
        const button = await f.waitUntilShowUp(screens.confirmTransaction.button.buyEther)
        await button.click()
        const title = await f.waitUntilShowUp(screens.buyEther.title)
        assert.equal(await title.getText(), 'Buy POA', "screen 'Buy POA' has incorrect title text")
        const arrow = await f.waitUntilShowUp(elements.buttonArrow)
        await arrow.click()
      })

      it("Click button 'Reject' open contract's account screen", async function () {
        const reject = await f.waitUntilShowUp(screens.confirmTransaction.button.reject)
        assert.equal(await reject.getText(), 'Reject', 'button has incorrect name')
        await reject.click()
        const buttonExecute = await f.waitUntilShowUp(screens.executeMethod.buttonExecuteMethod)
        assert.notEqual(buttonExecute, false, "contract's account hasn't opened")
      })

      it("Button arrow leads to executor's account screen", async function () {
        assert.equal(await f.executeTransferMethod(0, account1), true, "can't execute the method 'transfer'")
        await f.delay(2000)
        const arrow = await f.waitUntilShowUp(elements.buttonArrow)
        await arrow.click()
        await f.delay(2000)
        const address = await f.waitUntilShowUp(screens.main.address)
        assert.equal((await address.getText()).toUpperCase(), createdAccounts[0], "executors account isn't opened")
      })

      it('Switch to contract account ', async function () {
        const accountMenu = await f.waitUntilShowUp(menus.account.menu)
        await accountMenu.click()
        const item = await f.waitUntilShowUp(menus.account.account4)
        await item.click()
        await f.delay(2000)
        const address = await f.waitUntilShowUp(screens.main.address)
        assert.equal((await address.getText()).toUpperCase(), contractSokol.toUpperCase(), "contract's account isn't opened")
      })

      it("Confirm transaction: button 'Reject All' leads to contract's account screen", async function () {
        assert.equal(await f.executeTransferMethod(0, account1), true, "can't execute the method 'transfer'")
        const rejectAll = await f.waitUntilShowUp(screens.confirmTransaction.button.rejectAll)
        assert.equal(await rejectAll.getText(), 'Reject All', 'button has incorrect name')
        await rejectAll.click()
        await f.delay(2000)
        const address = await f.waitUntilShowUp(screens.main.address)
        assert.equal((await address.getText()).toUpperCase(), contractSokol.toUpperCase(), "contract account isn't opened")
      })

      it("Confirm transaction: button 'Submit' leads to contract's account screen", async function () {
        assert.equal(await f.executeTransferMethod(2, account1), true, "can't execute the method 'transfer'")
        await f.delay(2000)
        const button = await f.waitUntilShowUp(screens.confirmTransaction.button.submit)
        assert.equal(await button.getAttribute('value'), 'Submit', 'button has incorrect name')
        await button.click()
        await f.delay(2000)
        const address = await f.waitUntilShowUp(screens.main.address)
        assert.equal((await address.getText()).toUpperCase(), contractSokol.toUpperCase(), "contract account isn't opened")
      })

      it("Label 'CONTRACT' present", async function () {
        const menu = await f.waitUntilShowUp(menus.account.menu)
        await menu.click()
        await f.waitUntilShowUp(menus.account.label)
        const label = (await driver.findElements(menus.account.label))[1]
        assert.equal(await label.getText(), 'CONTRACT', 'label incorrect')
      })
      it('Delete imported account', async function () {
        await f.waitUntilShowUp(menus.account.delete)
        const items = await driver.findElements(menus.account.delete)
        await items[1].click()
        const button = await f.waitUntilShowUp(screens.deleteImportedAccount.buttons.yes)
        await button.click()
        const buttonArrow = await f.waitUntilShowUp(screens.settings.buttons.arrow)
        await buttonArrow.click()
        const identicon = await f.waitUntilShowUp(screens.main.identicon)
        assert.notEqual(identicon, false, 'main screen didn\'t opened')
      })
    })
  })

  describe('Delete Imported Account', async function () {

    it('Open delete imported account screen', async function () {
      const menu = await f.waitUntilShowUp(menus.account.menu)
      await menu.click()
      const item = await f.waitUntilShowUp(menus.account.delete)
      await item.click()
      const deleteImportedAccountTitle = await f.waitUntilShowUp(screens.deleteImportedAccount.title)
      assert.equal(await deleteImportedAccountTitle.getText(), screens.deleteImportedAccount.titleText)
    })

    it("Can't remove imported account with 'No' button", async function () {
      const button = await f.waitUntilShowUp(screens.deleteImportedAccount.buttons.no)
      assert.equal(await button.getText(), 'No', 'button has incorrect name')
      await f.click(button)
      const settingsTitle = await f.waitUntilShowUp(screens.settings.title)
      assert.equal(await settingsTitle.getText(), 'Settings')
      // check, that imported account still exists
      const menu = await f.waitUntilShowUp(menus.account.menu)
      await menu.click()
      await f.delay(2000)
      const label = await f.waitUntilShowUp(menus.account.label)
      assert.equal(await label.getText(), 'IMPORTED')
    })

    it('Open delete imported account screen again', async function () {
      const menu = await f.waitUntilShowUp(menus.account.menu)
      await menu.click()
      await f.delay(2000)
      await menu.click()
      await f.waitUntilShowUp(menus.account.delete)
      const buttons = await driver.findElements(menus.account.delete)
      assert.notEqual(buttons[0], false, "icon 'remove' isn't displayed")
      await buttons[0].click()
    })

    it("Remove imported account with 'Yes' button", async function () {
      const button = await f.waitUntilShowUp(screens.deleteImportedAccount.buttons.yes)
      assert.equal(await button.getText(), 'Yes', 'button has incorrect name')
      await f.click(button)
      const settingsTitle = await f.waitUntilShowUp(screens.settings.title)
      assert.equal(await settingsTitle.getText(), 'Settings', "screen 'Settings' has incorrect title")
      // check, that imported account is removed
      const menu = await f.waitUntilShowUp(menus.account.menu)
      await menu.click()
      await f.delay(3000)
      const label = await f.waitUntilShowUp(menus.account.label, 25)
      assert.equal(label, false, "account isn't deleted")
      await menu.click()
    })
  })

  describe('Sign Data', async function () {

    it('Simulate sign request ', async function () {
      await f.delay(5000)
      await f.setProvider(NETWORKS.LOCALHOST)
      await driver.get('https://danfinlay.github.io/js-eth-personal-sign-examples/')
      const button = await f.waitUntilShowUp(By.id('ethSignButton'))
      assert.notEqual(button, false, "resource isn't responding")
      await button.click()
      await f.delay(5000)
    })

    it('navigates back to MetaMask popup in the tab', async function () {
      if (process.env.SELENIUM_BROWSER === 'chrome') {
        await driver.get(`chrome-extension://${extensionId}/popup.html`)
      } else if (process.env.SELENIUM_BROWSER === 'firefox') {
        await driver.get(`moz-extension://${extensionId}/popup.html`)
      }
      await f.delay(700)
    })

    it('error message is displayed and contains text', async function () {
      const error = await f.waitUntilShowUp(screens.signMessage.error)
      assert.notEqual(error, false, 'error message isn\'t displayed')
      const text = await error.getText()
      assert.equal(text.length > 183, true, 'error message hasn\'t text')
    })

    it('account name is displayed and correct', async function () {
      const name = await f.waitUntilShowUp(screens.signMessage.accountName)
      assert.notEqual(name, false, 'account name isn\'t displayed')
      assert.equal(await name.getText(), 'new name', 'account name is incorrect')
    })

    it('title is displayed and correct', async function () {
      const title = await f.waitUntilShowUp(screens.signMessage.title)
      assert.notEqual(title, false, 'title isn\'t displayed')
      assert.equal(await title.getText(), 'Sign message', 'title is incorrect')
    })

    it('message is displayed and correct', async function () {
      const message = await f.waitUntilShowUp(screens.signMessage.message)
      assert.notEqual(message, false, 'message isn\'t displayed')
      assert.equal((await message.getText()).length > 32, true, 'message is incorrect')
    })

    it('button \'Cancel\' is enabled and lead to main screen ', async function () {
      const button = await f.waitUntilShowUp(screens.signMessage.buttons.cancel)
      assert.equal(await button.isEnabled(), true, 'button isn\'t enabled')
      assert.equal(await button.getText(), 'Cancel', 'button has incorrect name')
    })

    it('button \'Sign\' is enabled and lead to main screen ', async function () {
      const button = await f.waitUntilShowUp(screens.signMessage.buttons.sign)
      assert.equal(await button.isEnabled(), true, 'button isn\'t enabled')
      assert.equal(await button.getText(), 'Sign', 'button has incorrect name')
      await f.click(button)
      const identicon = await f.waitUntilShowUp(screens.main.identicon)
      assert.notEqual(identicon, false, 'main screen didn\'t opened')
    })
  })

  describe('Export private key', async function () {

    it('open dialog', async function () {
      await driver.navigate().refresh()
      const menu = await f.waitUntilShowUp(menus.dot.menu)
      await menu.click()
      const item = await f.waitUntilShowUp(menus.dot.exportPR)
      await item.click()
    })

    it('warning is displayed', async function () {
      await f.waitUntilShowUp(screens.exportPR.error)
      const error = await driver.findElements(screens.exportPR.error)
      assert.equal(error.length, 1, 'warning isn\'t present')
      assert.equal(await error[0].getText(), screens.exportPR.warningText, 'warning\'s text incorrect')
    })

    it('button \'Cancel\' leads back to main screen', async function () {
      const button = await f.waitUntilShowUp(screens.exportPR.button.cancel)
      assert.equal(await button.getText(), 'Cancel', 'button has incorrect name')
      await f.click(button)
      const field = await f.waitUntilShowUp(screens.exportPR.fieldPassword, 20)
      assert.equal(field, false, 'field \'password\' is displayed after closing')
    })

    it('error message if password incorrect', async function () {
      await driver.navigate().refresh()
      const menu = await f.waitUntilShowUp(menus.dot.menu)
      await menu.click()
      const item = await f.waitUntilShowUp(menus.dot.exportPR)
      await item.click()
      const field = await f.waitUntilShowUp(screens.exportPR.fieldPassword)
      await field.sendKeys('abrakadabr')
      const button = await f.waitUntilShowUp(screens.exportPR.button.submit)
      assert.equal(await button.getText(), 'Submit', 'button has incorrect name')
      await f.click(button)
      await f.delay(500)
      const error = await driver.findElements(screens.exportPR.error)
      assert.equal(error.length, 2, 'warning isn\'t present')
      assert.equal(await error[1].getText(), screens.exportPR.errorText, 'error\'s text incorrect')
    })

    it('private key is shown if password correct', async function () {
      const field = await f.waitUntilShowUp(screens.exportPR.fieldPassword)
      await f.clearField(field)
      await field.sendKeys(password)
      const button = await f.waitUntilShowUp(screens.exportPR.button.submit)
      await f.click(button)
      const key = await f.waitUntilShowUp(screens.yourPR.key)
      const pr = await key.getText()
      assert.equal(pr.length, 32 * 2, 'private key isn\'t displayed')
    })

    it('icon copy cliboard is displayed and clickable', async function () {
      await f.waitUntilShowUp(screens.yourPR.copy)
      const icons = await driver.findElements(screens.yourPR.copy)
      assert.notEqual(icons[1], false, 'icon copy isn\'t displayed')
      await icons[1].click()
    })

    it('Check clipboard buffer', async function () {
      const text = clipboardy.readSync()
      assert.equal(text.length, 64, "private key wasn't copied to clipboard")
    })

    it('file loaded if click button \'Save\' ', async function () {
      const button = await f.waitUntilShowUp(screens.yourPR.button.save)
      assert.equal(await button.getText(), 'Save as File', 'button has incorrect name')
      assert.notEqual(button, false, 'button \'Save\' isn\'t displayed')
    })

    it('button \'Done\' leads back to main screen', async function () {
      const button = await f.waitUntilShowUp(screens.yourPR.button.done)
      await f.click(button)
      const field = await f.waitUntilShowUp(screens.yourPR.key, 20)
      assert.equal(field, false, 'screen \'Your PR\' is displayed after closing')
      await driver.navigate().refresh()
    })
  })

  describe('Import Ganache seed phrase', async function () {

    it('logs out', async function () {
      const menu = await f.waitUntilShowUp(menus.sandwich.menu)
      await menu.click()
      const logOut = await f.waitUntilShowUp(menus.sandwich.logOut)
      assert.equal(await logOut.getText(), menus.sandwich.textLogOut)
      await logOut.click()
    })

    it('restores from seed phrase', async function () {
      const restoreSeedLink = await f.waitUntilShowUp(screens.lock.linkRestore)
      assert.equal(await restoreSeedLink.getText(), screens.lock.linkRestoreText)
      await restoreSeedLink.click()
    })

    it('adds seed phrase', async function () {
      const seedTextArea = await f.waitUntilShowUp(screens.restoreVault.textArea)
      await seedTextArea.sendKeys(testSeedPhrase)

      let field = await driver.findElement(screens.restoreVault.fieldPassword)
      await field.sendKeys(password)
      field = await driver.findElement(screens.restoreVault.fieldPasswordConfirm)
      await field.sendKeys(password)
      field = await f.waitUntilShowUp(screens.restoreVault.buttos.ok)
      await f.click(field)
    })

    it('balance renders', async function () {
      const balance = await f.waitUntilShowUp(screens.main.balance)
      assert.equal(await balance.getText(), '100.000', "balance isn't correct")
    })

    it('sends transaction', async function () {
      const sendButton = await f.waitUntilShowUp(screens.main.buttons.send)
      assert.equal(await sendButton.getText(), screens.main.buttons.sendText)
      await f.click(sendButton)
    })

    it('adds recipient address and amount', async function () {
      const sendTranscationScreen = await f.waitUntilShowUp(screens.sendTransaction.title)
      assert.equal(await sendTranscationScreen.getText(), screens.sendTransaction.titleText, 'Transaction screen has incorrect titlr')
      const inputAddress = await f.waitUntilShowUp(screens.sendTransaction.field.address)
      const inputAmmount = await f.waitUntilShowUp(screens.sendTransaction.field.amount)
      await inputAddress.sendKeys(account2)
      await inputAmmount.sendKeys('10')
      const button = await f.waitUntilShowUp(screens.sendTransaction.buttonNext)
      assert.equal(await button.getText(), 'Next', 'button has incorrect name')
      await f.click(button)
    })

    it('confirms transaction', async function () {
      const button = await f.waitUntilShowUp(screens.confirmTransaction.button.submit)
      assert.equal(await button.getAttribute('value'), 'Submit', 'button has incorrect name')
      await f.click(button)
    })

    it('finds the transaction in the transactions list', async function () {
      const transactionAmount = await f.waitUntilShowUp(screens.main.transactionList)
      assert.equal(await transactionAmount.getText(), '10.0')
    })
  })

  describe('RSK network tests', async function () {
    it('connects to RSK mainnet', async function () {
      await f.setProvider(NETWORKS.RSK)
      await f.delay(2000)
    })

    it('connects to RSK testnet', async function () {
      await f.setProvider(NETWORKS.RSK_TESTNET)
      await f.delay(2000)
    })

    it('checks zero exchange rate for RSK testnet', async function () {
      const balanceField = await f.waitUntilShowUp(screens.main.balance)
      const balanceUSDField = await f.waitUntilShowUp(screens.main.balanceUSD)
      await f.delay(2000)
      const balance = await balanceField.getText()
      const balanceUSD = await balanceUSDField.getText()
      console.log('Balance = ' + parseFloat(balance))
      console.log('balanceUSD = ' + parseFloat(balanceUSD))
      assert.equal(parseFloat(balance) > 0.0001, true, 'Balance of account ' + account1 + ' is TOO LOW in RSK testnet !!! Please refill it!!!!')
      assert.equal(parseFloat(balanceUSD), 0, 'USD balance of account is not zero')
    })

    it('opens RSK faucet', async function () {
      await f.waitUntilShowUp(screens.main.buttons.buyRSK)
      const buttons = await driver.findElements(screens.main.buttons.buyRSK)
      assert.equal(buttons.length, 1, 'main screen isn\'t displayed')
      const buyButton = buttons[0]
      const buyButtonText = await buyButton.getText()
      assert.equal(buyButtonText, 'Buy', 'button has incorrect name')
      await buyButton.click()
      await f.delay(2000)
      const title = await f.waitUntilShowUp(screens.buyEther.title)
      assert.equal(await title.getText(), 'Buy RBTC', "screen 'Buy RBTC' has incorrect title text")
      await f.waitUntilShowUp(screens.buyEther.faucetLinkRSK)
      const faucetButtons = await driver.findElements(screens.buyEther.faucetLinkRSK)
      assert.equal(faucetButtons.length, 1, 'there is no faucet button on the screen')
      const faucetLinkButton = faucetButtons[0]
      assert.equal(await faucetLinkButton.getText(), 'RSK Testnet Test Faucet', "screen 'Buy RSK' has incorrect name for faucet link")
      await faucetLinkButton.click()
      await f.delay(3000)
      const [tab0, tab1] = await driver.getAllWindowHandles()
      await driver.switchTo().window(tab1)
      const faucetLink = await driver.getCurrentUrl()
      assert.equal(faucetLink, 'https://faucet.testnet.rsk.co/', 'Incorrect faucet link for RSK network')
      await driver.close()
      await driver.switchTo().window(tab0)
      const arrow = await f.waitUntilShowUp(elements.buttonArrow)
      await arrow.click()
      await f.delay(2000)
    })

    it('opens send transaction screen', async function () {
      const sendButton = await f.waitUntilShowUp(screens.main.buttons.sendRSK)
      assert.equal(await sendButton.getText(), screens.main.buttons.sendText)
      await f.click(sendButton)
    })

    it('adds recipient address and amount', async function () {
      const sendTranscationScreen = await f.waitUntilShowUp(screens.sendTransaction.title)
      assert.equal(await sendTranscationScreen.getText(), screens.sendTransaction.titleText, 'Transaction screen has incorrect titlr')
      const inputAddress = await f.waitUntilShowUp(screens.sendTransaction.field.address)
      const inputAmmount = await f.waitUntilShowUp(screens.sendTransaction.field.amount)
      await inputAddress.sendKeys(account1)
      await f.clearField(inputAmmount)
      await inputAmmount.sendKeys('0.000001')
      const button = await f.waitUntilShowUp(screens.sendTransaction.buttonNext)
      assert.equal(await button.getText(), 'Next', 'button has incorrect name')
      await f.click(button)
    })

    it('confirms transaction', async function () {
      const inputGasLimit = await f.waitUntilShowUp(screens.confirmTransaction.fields.gasLimit)
      await f.clearField(inputGasLimit)
      await inputGasLimit.sendKeys('31500')
      const button = await f.waitUntilShowUp(screens.confirmTransaction.button.submit)
      assert.equal(await button.getAttribute('value'), 'Submit', 'button has incorrect name')
      await f.click(button)
    })

    it('finds the transaction in the transactions list', async function () {
      const transactionAmount = await f.waitUntilShowUp(screens.main.transactionList)
      assert.equal(await transactionAmount.getText(), '<0.001')
    })
  })

  describe('Check the filter of emitted events', async function () {

    it('emit event', async function () {
      await f.setProvider(NETWORKS.SOKOL)
      let account
      if (process.env.SELENIUM_BROWSER === 'chrome') {
        account = account1
      } else if (process.env.SELENIUM_BROWSER === 'firefox') {
        account = account2
        const accountMenu = await f.waitUntilShowUp(menus.account.menu)
        await accountMenu.click()
        const item = await f.waitUntilShowUp(menus.account.account2)
        await item.click()
      }

      const balanceField = await f.waitUntilShowUp(screens.main.balance)
      await f.delay(2000)
      const balance = await balanceField.getText()
      console.log('Account = ' + account)
      console.log('Balance = ' + balance)
      assert.equal(parseFloat(balance) > 0.001, true, 'Balance of account ' + account + ' TOO LOW !!! Please refill with Sokol eth!!!!')
      await driver.get(eventsEmitter)
      const button = await f.waitUntilShowUp(screens.eventsEmitter.button)
      await button.click()
      await f.delay(1000)
    })

    it('confirms transaction in MetaMask popup', async function () {
      const windowHandles = await driver.getAllWindowHandles()
      await driver.switchTo().window(windowHandles[windowHandles.length - 1])
      await f.delay(5000)
      const gasPrice = await f.waitUntilShowUp(screens.confirmTransaction.fields.gasPrice)
      await gasPrice.sendKeys('10')
      const button = await f.waitUntilShowUp(screens.confirmTransaction.button.submit)
      await f.click(button)
    })

    it('check  number of events', async function () {
      const windowHandles = await driver.getAllWindowHandles()
      await driver.switchTo().window(windowHandles[0])
      await f.delay(5000)
      const event = await f.waitUntilShowUp(screens.eventsEmitter.event, 600)
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
        const accountMenu = await f.waitUntilShowUp(menus.account.menu)
        await accountMenu.click()
        const item = await f.waitUntilShowUp(menus.account.account1)
        await item.click()
      }
    })
  })

  describe('Add Token: Custom', async function () {

    describe('Add token to LOCALHOST', function () {

      it('Create custom token in LOCALHOST', async function () {
        await f.setProvider(NETWORKS.LOCALHOST)
        tokenAddress = await f.createToken(account1, token, true)
        console.log('Token contract address: ' + tokenAddress)
        assert.equal(tokenAddress.length, 42, 'failed to create token')
      })

      it('navigates to the add token screen', async function () {
        await f.waitUntilShowUp(screens.main.identicon)
        const tab = await f.waitUntilShowUp(screens.main.tokens.menu)
        await tab.click()

        const addTokenButton = await f.waitUntilShowUp(screens.main.tokens.buttonAdd)
        assert.equal(await addTokenButton.getText(), screens.main.tokens.buttonAddText)
        await f.click(addTokenButton)
      })

      it('checks add token screen has correct title', async function () {
        const addTokenScreen = await f.waitUntilShowUp(screens.addToken.title)
        assert.equal(await addTokenScreen.getText(), screens.addToken.titleText)
      })

      it('adds token parameters', async function () {
        const tab = await f.waitUntilShowUp(screens.addToken.tab.custom, 30)
        if (!await f.waitUntilShowUp(screens.addToken.custom.fields.contractAddress)) await tab.click()
      })

      it('address input is displayed and has correct placeholder', async function () {
        const field = await f.waitUntilShowUp(screens.addToken.custom.fields.contractAddress)
        assert.equal(await field.getAttribute('placeholder'), 'Token Contract Address', 'incorrect placeholder')
      })

      it('fill out address input', async function () {
        const tokenContractAddress = await f.waitUntilShowUp(screens.addToken.custom.fields.contractAddress)
        await tokenContractAddress.sendKeys(tokenAddress)
        await f.delay(2000)
      })

      it('field \'Symbol\' enabled and has correct value', async function () {
        const field = await f.waitUntilShowUp(screens.addToken.custom.fields.tokenSymbol)
        assert.equal(await field.isEnabled(), true, 'field disabled')
        assert.equal(await field.getAttribute('placeholder'), 'Like "ETH"', 'incorrect placeholder')
        assert.equal(await field.getAttribute('value'), token.ticker, 'incorrect value')
      })

      it('field \'Decimals\' enabled and has correct value', async function () {
        const field = await f.waitUntilShowUp(screens.addToken.custom.fields.decimals)
        assert.equal(await field.isEnabled(), false, 'field disabled')
        assert.equal(await field.getAttribute('value'), token.decimals, 'incorrect value')
      })

      it('checks the token balance', async function () {
        const button = await f.waitUntilShowUp(screens.addToken.custom.buttons.add)
        await f.click(button)
        const tokenBalance = await f.waitUntilShowUp(screens.main.tokens.balance)
        assert.equal(await tokenBalance.getText(), token.supply + ' ' + token.ticker, 'balance is incorrect or not displayed')
      })

      it('click to token opens the etherscan', async function () {
        const link = await f.waitUntilShowUp(screens.main.tokens.token)
        await link.click()
        await f.delay(2000)
        const allHandles = await driver.getAllWindowHandles()
        console.log('allHandles.length ' + allHandles.length)
        assert.equal(allHandles.length, 2, 'etherscan wasn\'t opened')
        await f.switchToLastPage()
        await f.delay(2000)
        const title = await f.waitUntilCurrentUrl()
        console.log(title)
        assert.equal(title.includes('https://etherscan.io/token/'), true, 'etherscan wasn\'t opened')
        await f.switchToFirstPage()
      })
    })

    describe('Token menu', function () {

      it('token menu is displayed and clickable ', async function () {
        const menu = await f.waitUntilShowUp(menus.token.menu)
        await menu.click()
      })

      it('link \'View on blockexplorer...\' leads to correct page ', async function () {
        const menu = await f.waitUntilShowUp(menus.token.view)
        assert.notEqual(menu, false, 'item isn\'t displayed')
        assert.equal(await menu.getText(), menus.token.viewText, 'incorrect name')
        await menu.click()
        await f.delay(2000)
        const allHandles = await driver.getAllWindowHandles()
        console.log('allHandles.length ' + allHandles.length)
        assert.equal(allHandles.length, 3, 'etherscan wasn\'t opened')
        await f.switchToLastPage()
        const title = await f.waitUntilCurrentUrl()

        console.log(title)
        assert.equal(title.includes('https://etherscan.io/token/'), true, 'etherscan wasn\'t opened')
        await f.switchToFirstPage()
      })

      it('item \'Copy\' is displayed and clickable ', async function () {
        let menu = await f.waitUntilShowUp(menus.token.menu)
        await menu.click()
        const item = await f.waitUntilShowUp(menus.token.copy)
        assert.notEqual(item, false, 'item isn\'t displayed')
        assert.equal(await item.getText(), menus.token.copyText, 'incorrect name')
        await item.click()
        menu = await f.waitUntilShowUp(menus.token.menu, 10)
        assert.notEqual(menu, false, 'menu wasn\'t closed')
      })

      it('item \'Remove\' is displayed', async function () {
        const menu = await f.waitUntilShowUp(menus.token.menu)
        await menu.click()
        const item = await f.waitUntilShowUp(menus.token.remove)
        assert.notEqual(item, false, 'item isn\'t displayed')
        assert.equal(await item.getText(), menus.token.removeText, 'incorrect name')
      })

      it('item \'Send \' is displayed', async function () {
        const item = await f.waitUntilShowUp(menus.token.send)
        assert.notEqual(item, false, 'item isn\'t displayed')
        assert.equal(await item.getText(), menus.token.sendText, 'incorrect name')
        await f.waitUntilShowUp(menus.token.menu)
      })
    })

    describe('Check support of token per network basis ', async function () {
      const inexistentToken = '0xB8c77482e45F1F44dE1745F52C74426C631bDD51'
      describe('Token should be displayed only for network, where it was added ', async function () {

        it('token should not be displayed in POA network', async function () {
          await f.setProvider(NETWORKS.POA)
          assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
        })

        it('token should not be displayed in SOKOL network', async function () {
          await f.setProvider(NETWORKS.SOKOL)
          assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
        })

        it('token should not be displayed in MAINNET network', async function () {
          await f.setProvider(NETWORKS.MAINNET)
          assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
        })

        it('token should not be displayed in ROPSTEN network', async function () {
          await f.setProvider(NETWORKS.ROPSTEN)
          assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
        })

        it('token should not be displayed in KOVAN network', async function () {
          await f.setProvider(NETWORKS.KOVAN)
          assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
        })

        it('token should not be displayed in RINKEBY network', async function () {
          await f.setProvider(NETWORKS.RINKEBY)
          assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
        })

        it('token should not be displayed in RSK network', async function () {
          await f.setProvider(NETWORKS.RSK)
          assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
        })

        it('token should not be displayed in RSK testnet', async function () {
          await f.setProvider(NETWORKS.RSK_TESTNET)
          assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
        })
      })

      describe('Custom tokens validation ', async function () {

        it('can not add inexistent token to POA network', async function () {
          await f.setProvider(NETWORKS.POA)
          console.log(tokenAddress)
          assert(await f.isDisabledAddInexistentToken(tokenAddress), true, 'can add inexistent token in POA network')
        })

        it('can not add inexistent token to DAI network', async function () {
          await f.setProvider(NETWORKS.DAI)
          assert(await f.isDisabledAddInexistentToken(tokenAddress), true, 'can add inexistent token in DAI network')
        })

        it('can not add inexistent token to SOKOL testnet', async function () {
          await f.setProvider(NETWORKS.SOKOL)
          assert(await f.isDisabledAddInexistentToken(inexistentToken), true, 'can add inexistent token in POA Sokol testnet')
        })

        it('can not add inexistent token to MAINNET', async function () {
          await f.setProvider(NETWORKS.MAINNET)
          assert(await f.isDisabledAddInexistentToken(tokenAddress), true, 'can add inexistent token in Mainnet')
        })

        it('can not add inexistent token to ROPSTEN testnet', async function () {
          await f.setProvider(NETWORKS.ROPSTEN)
          assert(await f.isDisabledAddInexistentToken(tokenAddress), true, 'can add inexistent token in Ropsten testnet')
        })

        it('can not add inexistent token to KOVAN testnet', async function () {
          await f.setProvider(NETWORKS.KOVAN)
          assert(await f.isDisabledAddInexistentToken(tokenAddress), true, 'can add inexistent token in Kovan testnet')
        })

        it('can not add inexistent token to RINKEBY testnet', async function () {
          await f.setProvider(NETWORKS.RINKEBY)
          assert(await f.isDisabledAddInexistentToken(tokenAddress), true, 'can add inexistent token in Rinkeby testnet')
        })

        it('can not add inexistent token to RSK mainnet', async function () {
          await f.setProvider(NETWORKS.RSK)
          assert(await f.isDisabledAddInexistentToken(tokenAddress), true, 'can add inexistent token in RSK mainnet')
        })

        it('can not add inexistent token to RSK testnet', async function () {
          await f.setProvider(NETWORKS.RSK_TESTNET)
          assert(await f.isDisabledAddInexistentToken(tokenAddress), true, 'can add inexistent token in RSK testnet')
        })

        it('can not add inexistent token to LOCALHOST network', async function () {
          await f.setProvider(NETWORKS.LOCALHOST)
          assert(await f.isDisabledAddInexistentToken(tokenAddress.slice(0, tokenAddress.length - 2) + '0'), true, 'can add inexistent token in POA network')
        })

        it('token still should be displayed in LOCALHOST network', async function () {
          await f.waitUntilDisappear(screens.main.tokens.amount)
          assert.notEqual(await f.waitUntilShowUp(screens.main.tokens.amount), false, 'App is frozen')
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
        const accountMenu = await f.waitUntilShowUp(menus.account.menu)
        await accountMenu.click()
        const item = await f.waitUntilShowUp(menus.account.account1)
        await item.click()
        await f.delay(2000)
        const accountName = await f.waitUntilShowUp(screens.main.accountName)
        assert.equal(await accountName.getText(), 'Account 1', 'account name incorrect')
      })

      it('open screen \'Transfer tokens\' ', async function () {
        const menu = await f.waitUntilShowUp(menus.token.menu)
        await menu.click()
        const item = await f.waitUntilShowUp(menus.token.send)
        await item.click()
      })

      it('field \'Amount\' is displayed and has correct placeholder ', async function () {
        const item = await f.waitUntilShowUp(screens.sendTokens.field.amount)
        assert.equal(await item.getAttribute('placeholder'), screens.sendTokens.field.amountPlaceholder, 'placeholder is incorrect')
      })

      it('field \'Address\' is displayed and has correct placeholder ', async function () {
        const item = await f.waitUntilShowUp(screens.sendTokens.field.address)
        assert.equal(await item.getAttribute('placeholder'), screens.sendTokens.field.addressPlaceholder, 'placeholder is incorrect')
      })

      it('token\'s balance is correct ', async function () {
        const item = await f.waitUntilShowUp(screens.sendTokens.balance)
        assert.equal(await item.getText(), token.supply, 'token\'s balance is incorrect')
      })

      it('token\'s symbol is correct ', async function () {
        const item = await f.waitUntilShowUp(screens.sendTokens.symbol)
        assert.equal(await item.getText(), token.ticker, 'token\'s symbol is incorrect')
      })

      it('error message if invalid token\'s amount', async function () {
        const button = await f.waitUntilShowUp(screens.sendTokens.button.next)
        assert.equal(await button.getText(), 'Next', 'button \'Next\' has incorrect name')
        await f.click(button)
        const error = await f.waitUntilShowUp(screens.sendTokens.error)
        assert.equal(await error.getText(), screens.sendTokens.errorText.invalidAmount, ' error message is incorrect')
      })

      it('error message if invalid address', async function () {
        const amount = await f.waitUntilShowUp(screens.sendTokens.field.amount)
        await amount.sendKeys('1')
        const address = await f.waitUntilShowUp(screens.sendTokens.field.address)
        await address.sendKeys(invalidAddress)
        const button = await f.waitUntilShowUp(screens.sendTokens.button.next)
        await f.click(button)
        await f.click(button)
        await f.delay(2000)
        const error = await f.waitUntilShowUp(screens.sendTokens.error)
        assert.equal(await error.getText(), screens.sendTokens.errorText.address, ' error message is incorrect')
      })

      it('error message if amount is large', async function () {
        const amount = await f.waitUntilShowUp(screens.sendTokens.field.amount)
        await amount.sendKeys(largeAmount)
        const address = await f.waitUntilShowUp(screens.sendTokens.field.address)
        await f.clearField(address)
        await address.sendKeys(account2)
        const button = await f.waitUntilShowUp(screens.sendTokens.button.next)
        await f.click(button)
        await f.click(button)
        await f.delay(2000)
        const error = await f.waitUntilShowUp(screens.sendTokens.error)
        assert.equal(await error.getText(), screens.sendTokens.errorText.largeAmount, ' error message is incorrect')
      })

      it('error message if amount is invalid', async function () {
        const amount = await f.waitUntilShowUp(screens.sendTokens.field.amount)
        await f.clearField(amount)
        await amount.sendKeys(invalidAmount)
        const button = await f.waitUntilShowUp(screens.sendTokens.button.next)
        await f.click(button)
        await f.click(button)
        await f.delay(2000)
        const error = await f.waitUntilShowUp(screens.sendTokens.error)
        assert.equal(await error.getText(), screens.sendTokens.errorText.invalidAmount, ' error message is incorrect')
      })

      it.skip('error message if amount is too precise', async function () {
        const amount = await f.waitUntilShowUp(screens.sendTokens.field.amount)
        await f.clearField(amount)
        await amount.sendKeys(preciseAmount)
        const button = await f.waitUntilShowUp(screens.sendTokens.button.next)
        await f.click(button)
        await f.click(button)
        await f.delay(2000)
        const error = await f.waitUntilShowUp(screens.sendTokens.error)
        assert.equal(await error.getText(), screens.sendTokens.errorText.tooPrecise, ' error message is incorrect')
      })

      it('error message if amount is negative', async function () {
        const amount = await f.waitUntilShowUp(screens.sendTokens.field.amount)
        await f.clearField(amount)
        await amount.sendKeys(negativeAmount)
        const button = await f.waitUntilShowUp(screens.sendTokens.button.next)
        await f.click(button)
        await f.click(button)
        await f.delay(2000)
        const error = await f.waitUntilShowUp(screens.sendTokens.error)
        assert.equal(await error.getText(), screens.sendTokens.errorText.negativeAmount, ' error message is incorrect')
      })

      it('\'Confirm transaction\' screen is opened if address and amount are correct', async function () {
        const amount = await f.waitUntilShowUp(screens.sendTokens.field.amount)
        await f.clearField(amount)
        await amount.sendKeys('5')
        const button = await f.waitUntilShowUp(screens.sendTokens.button.next)
        await f.click(button)

        const buttonSubmit = await f.waitUntilShowUp(screens.confirmTransaction.button.submit)
        assert.notEqual(buttonSubmit, false, 'incorrect screen was opened')
      })

      it('\'Confirm transaction\' screen: token\'s amount is correct', async function () {
        const amount = await f.waitUntilShowUp(screens.confirmTransaction.amount)
        assert.equal(await amount.getText(), '5.000', ' amount is incorrect')
      })

      it('\'Confirm transaction\' screen: token\'s symbol is correct', async function () {
        const symbol = await f.waitUntilShowUp(screens.confirmTransaction.symbol)
        assert.equal(await symbol.getText(), token.ticker, ' symbol is incorrect')
      })

      it('submit transaction', async function () {
        await driver.navigate().refresh()
        const button = await f.waitUntilShowUp(screens.confirmTransaction.button.submit)
        await f.click(button)
        const list = await f.waitUntilShowUp(screens.main.transactionList)
        assert.notEqual(list, false, ' main screen isn\'t opened')
      })

      it('correct amount substracted from sender\'s tokens balance', async function () {
        const tab = await f.waitUntilShowUp(screens.main.tokens.menu)
        await tab.click()
        await driver.navigate().refresh()
        await f.delay(5000)
        await driver.navigate().refresh()
        await f.delay(5000)
        await driver.navigate().refresh()
        await f.delay(5000)
        const balance = await f.waitUntilShowUp(screens.main.tokens.balance)
        assert.equal(await balance.getText(), (token.supply - 5) + ' ' + token.ticker, 'balance is incorrect')
      })

      it('switch to account 2 ', async function () {
        const accountMenu = await f.waitUntilShowUp(menus.account.menu)
        await accountMenu.click()
        const item = await f.waitUntilShowUp(menus.account.account2)
        await item.click()
        await f.delay(2000)
        const accountName = await f.waitUntilShowUp(screens.main.accountName)
        assert.equal(await accountName.getText(), 'Account 2', 'account name incorrect')
      })

      it('added token isn\'t displayed for another account in the same network', async function () {
        const accountMenu = await f.waitUntilShowUp(menus.account.menu)
        await accountMenu.click()
        const item = await f.waitUntilShowUp(menus.account.createAccount)
        await item.click()
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('add token to another account in the same network', async function () {
        const addTokenButton = await f.waitUntilShowUp(screens.main.tokens.buttonAdd)
        assert.equal(await addTokenButton.getText(), screens.main.tokens.buttonAddText)
        await f.click(addTokenButton)

        const tokenContractAddress = await f.waitUntilShowUp(screens.addToken.custom.fields.contractAddress)
        await tokenContractAddress.sendKeys(tokenAddress)

        const buttonAdd = await f.waitUntilShowUp(screens.addToken.custom.buttons.add)
        await f.click(buttonAdd)
      })

      it('tokens were transfered, balance is updated', async function () {
        const balance = await f.waitUntilShowUp(screens.main.tokens.balance)
        assert.equal(await balance.getText(), '5 ' + token.ticker, 'balance is incorrect')
      })
    })

    describe('Remove token, provider is localhost', function () {

      it('switch to account 1 ', async function () {
        const accountMenu = await f.waitUntilShowUp(menus.account.menu)
        await accountMenu.click()
        const item = await f.waitUntilShowUp(menus.account.account1)
        await item.click()
        await f.delay(2000)
        const accountName = await f.waitUntilShowUp(screens.main.accountName)
        assert.equal(await accountName.getText(), 'Account 1', 'account name incorrect')
      })

      it('remove option opens \'Remove token\' screen ', async function () {
        await f.setProvider(NETWORKS.LOCALHOST)
        const menu = await f.waitUntilShowUp(menus.token.menu)
        await menu.click()
        const remove = await f.waitUntilShowUp(menus.token.remove)
        await remove.click()
      })

      it('screen \'Remove token\' has correct title', async function () {
        const title = await f.waitUntilShowUp(screens.removeToken.title)
        assert.equal(await title.getText(), screens.removeToken.titleText, 'title is incorrect')
      })

      it('screen \'Remove token\' has correct label', async function () {
        const title = await f.waitUntilShowUp(screens.removeToken.label)
        assert.equal((await title.getText()).includes(screens.removeToken.labelText + token.ticker), true, 'label is incorrect')
      })

      it('button "No" bring back to "Main" screen', async function () {
        const title = await f.waitUntilShowUp(screens.removeToken.title)
        assert.equal(await title.getText(), screens.removeToken.titleText, 'title is incorrect')
        const button = await f.waitUntilShowUp(screens.removeToken.buttons.no)
        assert.notEqual(button, false, 'button \'No\' isn\'t displayed ')
        assert.equal(await button.getText(), 'No', 'button has incorrect name')
        await f.click(button)
        const token = await f.waitUntilShowUp(screens.main.tokens.balance)
        assert.notEqual(await token.getText(), '', 'token is disapeared after return from remove token screen ')
      })

      it('button "Yes" delete token', async function () {
        const menu = await f.waitUntilShowUp(menus.token.menu)
        await menu.click()
        const remove = await f.waitUntilShowUp(menus.token.remove)
        await remove.click()

        const title = await f.waitUntilShowUp(screens.removeToken.title)
        assert.equal(await title.getText(), screens.removeToken.titleText, 'title is incorrect')

        const button = await f.waitUntilShowUp(screens.removeToken.buttons.yes)
        assert.notEqual(button, false, 'button \'Yes\' isn\'t displayed ')
        assert.equal(await button.getText(), 'Yes', 'button has incorrect name')
        await f.click(button)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('check if token was removed from SOKOL network', async function () {
        await f.setProvider(NETWORKS.SOKOL)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('check if token was removed from KOVAN network', async function () {
        await f.setProvider(NETWORKS.KOVAN)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('check if token was removed from ROPSTEN network', async function () {
        await f.setProvider(NETWORKS.ROPSTEN)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('check if token was removed from MAINNET network', async function () {
        await f.setProvider(NETWORKS.MAINNET)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('check if token was removed from POA network', async function () {
        await f.setProvider(NETWORKS.POA)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('check if token was removed from RINKEBY network', async function () {
        await f.setProvider(NETWORKS.RINKEBY)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })
    })

  })

  describe('Change password', async function () {

    let fieldNewPassword
    let fieldConfirmNewPassword
    let fieldOldPassword
    let buttonYes

    describe('Check screen "Settings" -> "Change password" ', async () => {

      it('checks if current network name (localhost) is correct', async () => {
        await f.setProvider(NETWORKS.LOCALHOST)
        const menu = await f.waitUntilShowUp(menus.sandwich.menu, 300)
        await menu.click()
        const settings = await f.waitUntilShowUp(menus.sandwich.settings)
        await settings.click()
        const field = await f.waitUntilShowUp(screens.settings.currentNetwork)
        assert.equal(await field.getText(), 'http://localhost:8545', 'current network is incorrect')
      })

      it('error should not be displayed', async () => {
        const error = await f.waitUntilShowUp(screens.settings.error, 10)
        assert.equal(error, false, 'improper error is displayed')
      })

      it('checks if "Change password" button is present and enabled', async () => {
        const menu = await f.waitUntilShowUp(menus.sandwich.menu, 300)
        await menu.click()
        const settings = await f.waitUntilShowUp(menus.sandwich.settings)
        await settings.click()
        await f.waitUntilShowUp(screens.settings.fieldNewRPC)
        const buttons = await driver.findElements(screens.settings.buttons.changePassword)
        await f.scrollTo(buttons[0])
        assert.equal(buttons.length, 1, 'Button "Change password" is not present')
        assert.equal(await buttons[0].getText(), 'Change password', 'button has incorrect name')
        assert.equal(await buttons[0].isEnabled(), true, 'Button "Change password" is disabled')
        await f.click(buttons[0])
      })

      it('screen has correct title', async () => {
        const title = await f.waitUntilShowUp(screens.changePassword.title)
        assert.equal(await title.getText(), screens.changePassword.titleText, '"Change password" screen contains incorrect title')
      })

      it('screen contains correct label', async () => {
        await f.waitUntilShowUp(screens.changePassword.label)
        const labels = await driver.findElements(screens.changePassword.label)
        assert.equal(labels.length, 1, 'screen "Change password" doesn\'t contain label')
        assert.equal(await labels[0].getText(), screens.changePassword.labelText, 'label contains incorrect title')
      })

      it('clicking the button "No" bring back to "Setting" screen ', async () => {
        const button = await f.waitUntilShowUp(screens.changePassword.buttonNo)
        assert.equal(await button.getText(), 'No', 'button has incorrect name')
        await f.click(button)
        const title = await f.waitUntilShowUp(screens.settings.title)
        assert.equal(await title.getText(), screens.settings.titleText, 'button "No" doesnt open settings screen')
        const buttonChangePass = await driver.findElement(screens.settings.buttons.changePassword)
        await f.scrollTo(buttonChangePass)
        await f.click(buttonChangePass)
      })
    })

    describe('Validation of errors ', async () => {

      before(async () => {
        fieldOldPassword = await f.waitUntilShowUp(screens.changePassword.fieldOldPassword)
        await fieldOldPassword.sendKeys(password)
        fieldNewPassword = await f.waitUntilShowUp(screens.changePassword.fieldNewPassword)
        fieldConfirmNewPassword = await f.waitUntilShowUp(screens.changePassword.fieldConfirmNewPassword)
        buttonYes = await f.waitUntilShowUp(screens.changePassword.buttonYes)
      })

      it('error if new password shorter than 8 digits', async () => {
        await fieldNewPassword.sendKeys(newPassword.short)
        await fieldConfirmNewPassword.sendKeys(newPassword.short)
        assert.equal(await buttonYes.getText(), 'Yes', 'button has incorrect name')
        await f.click(buttonYes)
        await f.delay(2000)
        const errors = await driver.findElements(screens.changePassword.error)
        assert.equal(errors.length > 0, true, 'error isn\'t displayed')
        assert.equal(await errors[0].getText(), screens.changePassword.errorText.notLong, 'Error\'s text incorrect')
      })

      it('error if new password  doesn\'t match confirmation', async () => {
        await f.clearField(fieldNewPassword)
        await f.clearField(fieldConfirmNewPassword)
        await fieldNewPassword.sendKeys(newPassword.correct)
        await fieldConfirmNewPassword.sendKeys(newPassword.incorrect)
        await f.click(buttonYes)
        await f.delay(2000)
        const errors = await driver.findElements(screens.changePassword.error)
        assert.equal(errors.length > 0, true, 'error isn\'t displayed')
        assert.equal(await errors[0].getText(), screens.changePassword.errorText.dontMatch, 'Error\'s text incorrect')
      })

      it('error if new password match old password', async () => {
        await f.clearField(fieldNewPassword)
        await f.clearField(fieldConfirmNewPassword)
        await fieldNewPassword.sendKeys(password)
        await fieldConfirmNewPassword.sendKeys(password)
        await f.click(buttonYes)
        await f.delay(2000)
        const errors = await driver.findElements(screens.changePassword.error)
        assert.equal(errors.length > 0, true, 'error isn\'t displayed')
        assert.equal(await errors[0].getText(), screens.changePassword.errorText.differ, 'Error\'s text incorrect')
      })

      it('error if old password incorrect', async () => {
        await f.clearField(fieldOldPassword)
        await fieldOldPassword.sendKeys(newPassword.incorrect)
        await f.click(buttonYes)
        await f.click(buttonYes)
        await f.delay(2000)
        const errors = await driver.findElements(screens.changePassword.error)
        assert.equal(errors.length > 0, true, 'error isn\'t displayed')
        assert.equal(await errors[0].getText(), screens.changePassword.errorText.incorrectPassword, 'Error\'s text incorrect')
      })

      it('no errors if old, new, confirm new passwords are correct; user can change password', async () => {
        await f.clearField(fieldNewPassword)
        await f.clearField(fieldOldPassword)
        await f.clearField(fieldConfirmNewPassword)

        await fieldOldPassword.sendKeys(password)
        await fieldNewPassword.sendKeys(newPassword.correct)
        await fieldConfirmNewPassword.sendKeys(newPassword.correct)
        await f.click(buttonYes)
        await f.waitUntilShowUp(screens.settings.buttons.changePassword, 25)
        const buttons = await driver.findElements(screens.settings.buttons.changePassword)
        assert.equal(buttons.length, 1, 'Button "Change password" is not present')
        assert.equal(await buttons[0].isEnabled(), true, 'Button "Change password" is disabled')
      })
    })

    describe('Check if new password is accepted', async () => {

      it('user can log out', async () => {
        const menu = await f.waitUntilShowUp(menus.sandwich.menu)
        await menu.click()
        const itemLogOut = await f.waitUntilShowUp(menus.sandwich.logOut)
        await itemLogOut.click()
        const field = await f.waitUntilShowUp(screens.lock.fieldPassword)
        assert.notEqual(field, false, 'password box isn\'t present after logout')
      })

      it('can\'t login with old password', async () => {
        const field = await f.waitUntilShowUp(screens.lock.fieldPassword)
        await field.sendKeys(password)
        const button = await f.waitUntilShowUp(screens.lock.buttonLogin)
        await f.click(button)
        const error = await f.waitUntilShowUp(screens.lock.error)
        assert.notEqual(error, false, 'error isn\'t displayed if password incorrect')
        assert.equal(await error.getText(), screens.lock.errorText, 'error\'s text incorrect')
      })

      it('accepts new password after lock', async () => {
        const field = await f.waitUntilShowUp(screens.lock.fieldPassword)
        await f.clearField(field)
        await field.sendKeys(newPassword.correct)
        const button = await f.waitUntilShowUp(screens.lock.buttonLogin)
        await f.click(button)

        await f.waitUntilShowUp(screens.main.buttons.buy)
        const buttons = await driver.findElements(screens.main.buttons.buy)
        assert.equal(buttons.length, 1, 'main screen isn\'t displayed')
        assert.equal(await buttons[0].getText(), 'Buy', 'button has incorrect name')
        password = newPassword.correct
      })
    })
  })

  describe('Add Token:Search', async function () {
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
        await f.setProvider(NETWORKS.MAINNET)
        await f.delay(2000)
        const tab = await f.waitUntilShowUp(screens.main.tokens.menu)
        await tab.click()
        const button = await f.waitUntilShowUp(screens.main.tokens.buttonAdd, 300)
        await f.click(button)
        const field = await f.waitUntilShowUp(screens.addToken.search.fieldSearch)
        assert.notEqual(field, false, 'field \'Search\'  isn\'t displayed')
      })

      it('button \'Next\' is disabled if no tokens found', async function () {
        const button = await f.waitUntilShowUp(screens.addToken.search.button.next)
        assert.equal(await button.isEnabled(), false, 'button is enabled')
        assert.equal(await button.getText(), 'Next', 'button has incorrect name')
      })

      it('button \'Cancel\' is enabled and lead to main screen ', async function () {
        const button = await f.waitUntilShowUp(screens.addToken.search.button.cancel)
        assert.equal(await button.isEnabled(), true, 'button isn\'t enabled')
        assert.equal(await button.getText(), 'Cancel', 'button has incorrect name')
      })

      it('Search by name: searching result list is empty if request invalid', async function () {
        const field = await f.waitUntilShowUp(screens.addToken.search.fieldSearch)
        await field.sendKeys(request.invalid)
        const list = await f.waitUntilShowUp(screens.addToken.search.token.unselected, 20)
        assert.equal(list, false, 'unexpected tokens are displayed')
      })

      it('Search by name: searching result list isn\'t empty ', async function () {
        const field = await f.waitUntilShowUp(screens.addToken.search.fieldSearch)
        await f.clearField(field)
        await field.sendKeys(request.valid)
        await f.waitUntilShowUp(screens.addToken.search.token.unselected)
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
        const button = await f.waitUntilShowUp(screens.addToken.search.button.next)
        assert.equal(await button.isEnabled(), false, 'button is enabled')
      })

      it('user can select one token', async function () {
        const token = await f.waitUntilShowUp(screens.addToken.search.token.unselected)
        await token.click()
      })

      it('button \'Next\' is enabled if token is selected', async function () {
        const button = await f.waitUntilShowUp(screens.addToken.search.button.next)
        assert.equal(await button.isEnabled(), true, 'button is disabled')
      })

      it('user can unselected token', async function () {
        const token = await f.waitUntilShowUp(screens.addToken.search.token.selected)
        await token.click()
      })

      it('button \'Next\' is disabled after token was unselected', async function () {
        const button = await f.waitUntilShowUp(screens.addToken.search.button.next)
        assert.equal(await button.isEnabled(), false, 'button is enabled')
      })

      it('user can select two tokens', async function () {
        await f.waitUntilShowUp(screens.addToken.search.token.unselected)
        const tokensUnselected = await driver.findElements(screens.addToken.search.token.unselected)
        await tokensUnselected[0].click()
        await tokensUnselected[2].click()
        const tokensSelected = await driver.findElements(screens.addToken.search.token.selected)
        assert.equal(tokensSelected.length, 2, 'user can\'t select 2 tokens')
      })

      it('click button \'Next\' opens confirm screen ', async function () {
        const button = await f.waitUntilShowUp(screens.addToken.search.button.next)
        await f.click(button)
        const buttonAdd = await f.waitUntilShowUp(screens.addToken.search.confirm.button.add)
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
        await f.delay(2000)
        const balances = await driver.findElements(screens.addToken.search.confirm.token.balance)
        const balance0 = await balances[1].getText()
        const balance1 = await balances[2].getText()
        assert.equal(balance0, '0', 'balance isn\'t 0')
        assert.equal(balance1, '0', 'balance isn\'t 0')
      })

      it('button \'Back\' is enabled and leads to previous screen ', async function () {
        const button = await f.waitUntilShowUp(screens.addToken.search.confirm.button.back)
        assert.equal(await button.isEnabled(), true, 'button isn\'t enabled')
        await f.click(button)
        const fieldSearch = await f.waitUntilShowUp(screens.addToken.search.fieldSearch)
        assert.notEqual(fieldSearch, false, 'add token screen didn\'t opened')
      })

      it('button \'Next\' is enabled if confirmation list isn\'t empty', async function () {
        const button = await f.waitUntilShowUp(screens.addToken.search.button.next)
        assert.equal(await button.isEnabled(), true, 'button is disabled')
      })

      it('previous selected tokens remain selected after new search', async function () {
        const field = await f.waitUntilShowUp(screens.addToken.search.fieldSearch)
        await f.clearField(field)
        await field.sendKeys(request.valid)
        await f.waitUntilShowUp(screens.addToken.search.token.selected)
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
        const button = await f.waitUntilShowUp(screens.addToken.search.button.next)
        await f.click(button)
        await f.waitUntilShowUp(screens.addToken.search.confirm.token.item)
        const tokens = await driver.findElements(screens.addToken.search.confirm.token.item)
        assert.equal(tokens.length, 1, 'incorrect number of tokens are presented')
        const back = await f.waitUntilShowUp(screens.addToken.search.confirm.button.back)
        await f.click(back)
      })

      it('Search by contract address: searching result list is empty if address invalid ', async function () {
        const field = await f.waitUntilShowUp(screens.addToken.search.fieldSearch)
        await field.sendKeys(request.notExistingAddress)
        const list = await f.waitUntilShowUp(screens.addToken.search.token.unselected, 20)
        assert.equal(list, false, 'unexpected tokens are displayed')
      })

      it('Search by valid contract address: searching result list contains one token ', async function () {
        const field = await f.waitUntilShowUp(screens.addToken.search.fieldSearch)
        await f.clearField(field)
        await f.clearField(field)
        await field.sendKeys(Qtum.address)
        const token = await f.waitUntilShowUp(screens.addToken.search.token.unselected)
        const list = await driver.findElements(screens.addToken.search.token.unselected)
        assert.notEqual(list, 0, 'tokens aren\'t displayed')
        await token.click()
      })

      it('Token\'s info contains correct name ', async function () {
        const name = await f.waitUntilShowUp(screens.addToken.search.token.name)
        assert.equal(await name.getText(), Qtum.name, 'incorrect token\'s name')
      })

      it('one more token added to confirmation list', async function () {
        const button = await f.waitUntilShowUp(screens.addToken.search.button.next)
        await f.click(button)
        await f.waitUntilShowUp(screens.addToken.search.confirm.token.item)
        const list = await driver.findElements(screens.addToken.search.confirm.token.item)
        assert.equal(list.length, 2, 'token wasn\'t added')
      })

      it('button \'Add tokens\' is enabled and clickable', async function () {
        const button = await f.waitUntilShowUp(screens.addToken.search.confirm.button.add)
        assert.equal(await button.isEnabled(), true, 'button isn\'t enabled')
        await f.click(button)
        const identicon = await f.waitUntilShowUp(screens.main.identicon)
        assert.notEqual(identicon, false, 'main screen didn\'t opened')
      })

      it('all selected tokens are displayed on main screen', async function () {
        await f.waitUntilShowUp(screens.main.tokens.token)
        const tokens = await driver.findElements(screens.main.tokens.token)
        assert.equal(tokens.length, 2, 'tokens weren\'t added')
      })

      it('correct value of counter of owned tokens', async function () {
        const counter = await f.waitUntilShowUp(screens.main.tokens.counter)
        assert.equal(await counter.getText(), 'You own 2 tokens', 'incorrect value of counter')
      })
    })

    describe('Token should be displayed only for network, where it was added ', async function () {

      it('token should not be displayed in POA network', async function () {
        await f.setProvider(NETWORKS.POA)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not be displayed in DAI network', async function () {
        await f.setProvider(NETWORKS.DAI)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not be displayed in SOKOL testnet', async function () {
        await f.setProvider(NETWORKS.SOKOL)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not be displayed in ROPSTEN testnet', async function () {
        await f.setProvider(NETWORKS.ROPSTEN)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not be displayed in KOVAN testnet', async function () {
        await f.setProvider(NETWORKS.KOVAN)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not be displayed in RINKEBY testnet', async function () {
        await f.setProvider(NETWORKS.RINKEBY)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not be displayed in RSK mainnet', async function () {
        await f.setProvider(NETWORKS.RSK)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not be displayed in RSK testnet', async function () {
        await f.setProvider(NETWORKS.RSK_TESTNET)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })

      it('token should not be displayed in LOCALHOST network', async function () {
        await f.setProvider(NETWORKS.LOCALHOST)
        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })
    })
    describe('remove Mainnet\'s tokens', function () {

      it('remove tokens', async function () {

        let menu
        let button
        let counter
        let buttonYes

        await f.setProvider(NETWORKS.MAINNET)
        await f.waitUntilShowUp(elements.loader, 25)
        await f.waitUntilDisappear(elements.loader, 50)
        menu = await f.waitUntilShowUp(menus.token.menu)
        await menu.click()
        button = await f.waitUntilShowUp(menus.token.remove)
        await button.click()
        buttonYes = await f.waitUntilShowUp(screens.removeToken.buttons.yes)
        await buttonYes.click()
        counter = await f.waitUntilShowUp(screens.main.tokens.counter)
        assert.equal(await counter.getText(), 'You own 1 token', 'incorrect value of counter')
        const tokensNumber = await driver.findElements(screens.main.tokens.token)
        assert.equal(tokensNumber.length, 1, 'incorrect amount of token\'s  is displayed')

        menu = await f.waitUntilShowUp(menus.token.menu)
        await menu.click()
        button = await f.waitUntilShowUp(menus.token.remove)
        await button.click()
        buttonYes = await f.waitUntilShowUp(screens.removeToken.buttons.yes)
        await buttonYes.click()
        counter = await f.waitUntilShowUp(screens.main.tokens.counter)
        assert.equal(await counter.getText(), 'No tokens found', 'incorrect value of counter')

        assert.equal(await f.assertTokensNotDisplayed(), true, 'tokens are displayed')
      })
    })
  })

  describe('Custom Rpc', async function () {
    const invalidStringUrl = 'http://lwkdfowi**&#v er'
    const urlWithoutHttp = 'infura.com'
    const invalidEndpoint = 'http://abrakadabrawdjkwjeciwkasuhlvflwe.com'
    const correctRpcUrl = 'https://poa.infura.io/test'

    it('switches to settings screen through menu \'Network -> Custom RPC\'', async function () {
      await f.setProvider(NETWORKS.CUSTOM)
      const settings = await f.waitUntilShowUp(screens.settings.title)
      assert.equal(await settings.getText(), screens.settings.titleText, 'inappropriate screen is opened')
    })

    it('error message if new Rpc url is invalid', async function () {
      const field = await f.waitUntilShowUp(screens.settings.fieldNewRPC)
      await field.sendKeys(invalidStringUrl)
      const button = await f.waitUntilShowUp(screens.settings.buttonSave)
      assert.equal(await button.getText(), 'Save', 'button has incorrect name')
      await f.click(button)
      await f.delay(1000)
      assert.equal(await f.waitUntilShowUp(screens.settings.buttons.delete, 5), false, 'invalid Rpc was added')
      const errors = await driver.findElements(screens.settings.error)
      assert.equal(errors.length, 1, 'error isn\'t displayed if Rpc url incorrect')
      assert.equal(await errors[0].getText(), screens.settings.errors.invalidRpcUrl, 'error\'s text incorrect')
    })

    it('error message if new Rpc url has no HTTP/HTTPS prefix', async function () {
      const fieldRpc = await driver.findElement(screens.settings.fieldNewRPC)
      await f.clearField(fieldRpc)
      await f.clearField(fieldRpc)
      await fieldRpc.sendKeys(urlWithoutHttp)
      const button = await f.waitUntilShowUp(screens.settings.buttonSave)
      await f.click(button)
      await f.delay(1000)
      assert.equal(await f.waitUntilShowUp(screens.settings.buttons.delete, 5), false, 'invalid Rpc was added')
      const errors = await driver.findElements(screens.settings.error)
      assert.equal(errors.length, 1, 'error isn\'t displayed if Rpc url incorrect')
      assert.equal(await errors[0].getText(), screens.settings.errors.invalidHTTP, 'error\'s text incorrect')
    })

    it('error message if Rpc doesn\'t exist', async function () {
      const fieldRpc = await driver.findElement(screens.settings.fieldNewRPC)
      await f.clearField(fieldRpc)
      await f.clearField(fieldRpc)
      await fieldRpc.sendKeys(invalidEndpoint)
      const button = await f.waitUntilShowUp(screens.settings.buttonSave)
      await f.click(button)
      await f.delay(1000)
      assert.equal(await f.waitUntilShowUp(screens.settings.buttons.delete, 5), false, 'invalid Rpc was added')
      await f.waitUntilShowUp(screens.settings.error)
      const errors = await driver.findElements(screens.settings.error)
      assert.equal(errors.length, 1, 'error isn\'t displayed if Rpc url incorrect')
      assert.equal(await errors[0].getText(), screens.settings.errors.invalidRpcEndpoint, 'error\'s text incorrect')
    })

    it('user can add valid custom rpc', async function () {
      const fieldRpc = await driver.findElement(screens.settings.fieldNewRPC)
      await f.clearField(fieldRpc)
      await f.clearField(fieldRpc)
      await f.clearField(fieldRpc)
      await f.clearField(fieldRpc)
      await fieldRpc.sendKeys(correctRpcUrl + 0)
      await driver.findElement(screens.settings.buttonSave).click()
      await f.delay(20000)
      const customUrlElement = await f.waitUntilShowUp(screens.settings.currentNetwork)
      assert.equal(await customUrlElement.getText(), correctRpcUrl + 0, 'Added Url doesn\'t match')
    })

    it('new added Rpc displayed in network dropdown menu', async function () {
      let menu = await f.waitUntilShowUp(screens.main.network)
      await menu.click()
      const item = await f.waitUntilShowUp(menus.networks.addedCustomRpc)
      assert.equal(await item.getText(), correctRpcUrl + 0, 'Added custom Url isn\'t displayed ')
      menu = await f.waitUntilShowUp(screens.main.network)
      await menu.click()
    })

    it('user can add four more valid custom rpc', async function () {
      const fieldRpc = await f.waitUntilShowUp(screens.settings.fieldNewRPC)
      const customUrlElement = await f.waitUntilShowUp(screens.settings.currentNetwork)
      for (let i = 1; i < 5; i++) {
        await f.clearField(fieldRpc)
        await f.clearField(fieldRpc)
        await f.clearField(fieldRpc)
        await f.clearField(fieldRpc)
        await fieldRpc.sendKeys(correctRpcUrl + i)
        await driver.findElement(screens.settings.buttonSave).click()
        await f.delay(5000)
        assert.equal(await customUrlElement.getText(), correctRpcUrl + i, '#' + i + ': Current RPC field contains incorrect URL')
      }
    })

    it('new added Rpc displayed in network dropdown menu', async function () {
      let menu = await f.waitUntilShowUp(screens.main.network)
      await menu.click()
      await f.waitUntilShowUp(menus.networks.addedCustomRpc)
      const items = await driver.findElements(menus.networks.addedCustomRpc)
      assert.equal(items.length, 5, 'Incorrect number of added RPC')

      menu = await f.waitUntilShowUp(screens.main.network)
      await menu.click()
    })

    it('click button \'Delete\' opens screen \'Delete Custom RPC\'', async function () {
      await f.delay(1000)
      const button = await f.waitUntilShowUp(screens.settings.buttons.delete, 10)
      assert.equal(await button.getText(), 'Delete', 'button has incorrect name')
      await f.click(button)
      const title = await f.waitUntilShowUp(screens.settings.title)
      assert.equal(await title.getText(), screens.deleteCustomRPC.titleText, 'inappropriate screen is opened')
    })

    it('click button \'No\' opens screen \'Settings\'', async function () {
      const button = await f.waitUntilShowUp(screens.deleteCustomRPC.buttons.no)
      assert.equal(await button.getText(), 'No', 'button has incorrect name')
      await f.click(button)
      const title = await f.waitUntilShowUp(screens.settings.title)
      assert.equal(await title.getText(), screens.settings.titleText, 'inappropriate screen is opened')
    })

    it('user able to delete custom rpc', async function () {
      const buttonDelete = await f.waitUntilShowUp(screens.settings.buttons.delete, 25)
      await f.click(buttonDelete)
      const yesButton = await f.waitUntilShowUp(screens.deleteCustomRPC.buttons.yes)
      assert.equal(await yesButton.getText(), 'Yes')
      await f.click(yesButton)
      const title = await f.waitUntilShowUp(screens.settings.title)
      assert.equal(await title.getText(), screens.settings.titleText, 'inappropriate screen is opened')
    })

    it('deleted custom rpc isn\'t displayed in \'Settings\' screen', async function () {
      const currentNetwork = await f.waitUntilShowUp(screens.settings.currentNetwork)
      assert.equal(await currentNetwork.getText(), 'POA Network', 'custom Rpc is displayed after deletion')
    })

    it('deleted custom rpc isn\'t displayed in network dropdown menu', async function () {
      await f.delay(2000)
      let menu = await f.waitUntilShowUp(screens.main.network)
      await menu.click()
      await f.waitUntilShowUp(menus.networks.addedCustomRpc, 20)
      const items = await driver.findElements(menus.networks.addedCustomRpc)
      assert.equal(items.length, 4, 'deleted custom rpc is displayed in network dropdown menu')
      menu = await f.waitUntilShowUp(screens.main.network)
      await menu.click()
    })
  })
})


