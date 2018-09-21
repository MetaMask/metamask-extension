const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const assert = require('assert')
const pify = require('pify')
const webdriver = require('selenium-webdriver')
const { By, Key } = webdriver
const { delay, buildChromeWebDriver, buildFirefoxWebdriver, installWebExt, getExtensionIdChrome, getExtensionIdFirefox } = require('./func')
const { menus, screens, elements, NETWORKS } = require('./elements')

describe('Nifty wallet popup page', async function () {
  let driver, accountAddress, tokenAddress, extensionId
  let password = '123456789'

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
      await driver.quit()
  })

  describe('Setup', async function () {

    it('switches to extensions list', async function () {
      await delay(300)
      const windowHandles = await driver.getAllWindowHandles()
      await driver.switchTo().window(windowHandles[0])
    })
  })

  describe('Account Creation', async () => {
    const newAccountName = 'new name'

    it('title is \'Nifty Wallet\'', async () => {
      const title = await driver.getTitle()
      assert.equal(title, 'Nifty Wallet', 'title is incorrect')
    })

    it('screen \'Terms of Use\' has not empty agreement', async () => {
      const terms = await waitUntilShowUp(screens.TOU.agreement)
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

    it('sets provider type to localhost', async function () {
      await setProvider(NETWORKS.LOCALHOST)
      await delay(2000)
    })

    it('copy icon is displayed and clickable', async () => {
      const field = await waitUntilShowUp(screens.main.iconCopy)
      await field.click()
      assert.notEqual(field, false, 'copy icon doesn\'t present')
    })

    it('open  \'Account name\' change dialog', async () => {
      const menu = await waitUntilShowUp(menus.dot.menu)
      await menu.click()
      const field = await waitUntilShowUp(screens.main.edit)
      await field.click()
      const accountName = await waitUntilShowUp(screens.main.accountName)
      assert.notEqual(accountName, false, '\'Account name\' change dialog isn\'t opened')
      assert.equal(await accountName.getAttribute('value'), 'Account 1', 'incorrect placeholder')
    })

    it('fill out new account\'s name', async () => {
      const field = await waitUntilShowUp(screens.main.accountName)
      await field.clear()
      await field.sendKeys(newAccountName)
    })

    it('dialog \'Account name\' is disappeared if click button \'Save\'', async () => {
      const button = await waitUntilShowUp(screens.main.buttons.save)
      assert.equal(await button.getText(), 'Save', 'button has incorrect name')
      assert.notEqual(button, true, 'button \'Save\' does not present')
      await click(button)
      const accountName = await waitUntilShowUp(screens.main.accountName, 10)
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

    it('shows account address', async function () {
      await delay(300)
      const account = await waitUntilShowUp(screens.main.address)
      accountAddress = await account.getText()
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
      assert.equal(text.toLowerCase(), accountAddress.toLowerCase(), 'QR addres doesn\'t match')
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

  describe('Change password', async () => {
    const newPassword = {
      correct: 'abcDEF123!@#',
      short: '123',
      incorrect: '1234567890',
    }
    let fieldNewPassword
    let fieldConfirmNewPassword
    let fieldOldPassword
    let buttonYes

    describe('Check screen "Settings" -> "Change password" ', async () => {

      it('checks if current network name (localhost) is correct', async () => {
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

  describe('Import Account', () => {

    it('opens import account menu', async function () {
      const menu = await waitUntilShowUp(menus.account.menu)
      await menu.click()
      const item = await waitUntilShowUp(menus.account.import)
      await item.click()
      const importAccountTitle = await waitUntilShowUp(screens.importAccounts.title)
      assert.equal(await importAccountTitle.getText(), screens.importAccounts.textTitle)
    })

    it('imports account', async function () {
      const privateKeyBox = await waitUntilShowUp(screens.importAccounts.fieldPrivateKey)
      await privateKeyBox.sendKeys('c6b81c1252415d1acfda94474ab8f662a44c045f96749c805ff12a6074081586')// demo private key
      const button = await waitUntilShowUp(screens.importAccounts.buttonImport)
      await click(button)
      assert.equal(await button.getText(), 'Import', 'button has incorrect name')
      const menu = await waitUntilShowUp(menus.account.menu)
      await menu.click()
      const importedLabel = await waitUntilShowUp(menus.account.labelImported)
      assert.equal(await importedLabel.getText(), 'IMPORTED')
    })

    it('opens delete imported account screen', async function () {
      const menu = await waitUntilShowUp(menus.account.delete)
      await menu.click()
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
      const testSeedPhrase = 'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent'
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
      assert.equal(await balance.getText(), '100.000')
    })

    it('sends transaction', async function () {
      const sendButton = await waitUntilShowUp(screens.main.buttons.send)
      assert.equal(await sendButton.getText(), screens.main.buttons.sendText)
      await click(sendButton)
    })

    it('adds recipient address and amount', async function () {
      const sendTranscationScreen = await waitUntilShowUp(screens.sendTransaction.title)
      assert.equal(await sendTranscationScreen.getText(), screens.sendTransaction.titleText, 'Transaction screen has incorrect titlr')
      const inputAddress = await waitUntilShowUp(screens.sendTransaction.fields.address)
      const inputAmmount = await waitUntilShowUp(screens.sendTransaction.fields.amount)
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970')
      await inputAmmount.sendKeys('10')
      const button = await waitUntilShowUp(screens.sendTransaction.buttonNext)
      assert.equal(await button.getText(), 'Next', 'button has incorrect name')
      await click(button)
    })

    it('confirms transaction', async function () {
      const button = await waitUntilShowUp(screens.confirmTransaction.buttons.submit)
      assert.equal(await button.getAttribute('value'), 'Submit', 'button has incorrect name')
      await click(button)
    })

    it('finds the transaction in the transactions list', async function () {
      const transactionAmount = await waitUntilShowUp(screens.main.transactionList)
      assert.equal(await transactionAmount.getText(), '10.0')
    })
  })

  describe('Token Factory', function () {

    it('navigates to token factory', async function () {
      await driver.get('http://tokenfactory.surge.sh/')
    })

    it('navigates to create token contract link', async function () {
      const createToken = await waitUntilShowUp(By.css('#bs-example-navbar-collapse-1 > ul > li:nth-child(3) > a'))
      await createToken.click()
    })

    it('adds input for token', async function () {
      const totalSupply = await waitUntilShowUp(By.css('#main > div > div > div > div:nth-child(2) > div > div:nth-child(5) > input'))
      const tokenName = await waitUntilShowUp(By.css('#main > div > div > div > div:nth-child(2) > div > div:nth-child(6) > input'))
      const tokenDecimal = await waitUntilShowUp(By.css('#main > div > div > div > div:nth-child(2) > div > div:nth-child(7) > input'))
      const tokenSymbol = await waitUntilShowUp(By.css('#main > div > div > div > div:nth-child(2) > div > div:nth-child(8) > input'))
      const createToken = await waitUntilShowUp(By.css('#main > div > div > div > div:nth-child(2) > div > button'))

      await totalSupply.sendKeys('100')
      await tokenName.sendKeys('Test')
      await tokenDecimal.sendKeys('0')
      await tokenSymbol.sendKeys('TST')
      await click(createToken)
      await delay(1000)
    })

    // There is an issue with blank confirmation window in Firefox, but the button is still there and the driver is able to clicked (?.?)
    it('confirms transaction in MetaMask popup', async function () {
      const windowHandles = await driver.getAllWindowHandles()
      await driver.switchTo().window(windowHandles[windowHandles.length - 1])
      const button = await waitUntilShowUp(screens.confirmTransaction.buttons.submit)
      await click(button)
    })

    it('switches back to Token Factory to grab the token contract address', async function () {
      const windowHandles = await driver.getAllWindowHandles()
      await driver.switchTo().window(windowHandles[0])
      const tokenContactAddress = await waitUntilShowUp(By.css('#main > div > div > div > div:nth-child(2) > span:nth-child(3)'))
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
      await waitUntilShowUp(screens.main.buttons.send)
      const tokensTab = await driver.findElement(screens.main.tokens.menu)
      assert.equal(await tokensTab.getText(), 'Tokens')
      await tokensTab.click()
    })

    it('navigates to the add token screen', async function () {
      const addTokenButton = await waitUntilShowUp(screens.main.tokens.buttonAdd)
      assert.equal(await addTokenButton.getText(), screens.main.tokens.buttonAddText)
      await click(addTokenButton)
    })

    it('checks add token screen has correct title', async function () {
      const addTokenScreen = await waitUntilShowUp(By.className('page-subtitle'))
      assert.equal(await addTokenScreen.getText(), screens.addToken.titleText)
    })

    it('adds token parameters', async function () {
      const tokenContractAddress = await waitUntilShowUp(screens.addToken.fields.contractAddress)
      await tokenContractAddress.sendKeys(tokenAddress)
      const button = await waitUntilShowUp(screens.addToken.buttonAdd)
      await click(button)
    })

    it('checks the token balance', async function () {
      const tokenBalance = await waitUntilShowUp(screens.main.tokens.balance)
      assert.equal(await tokenBalance.getText(), '100 TST')
    })

    it('token balance updates if switch account', async function () {
      const accountMenu = await waitUntilShowUp(menus.account.menu)
      await accountMenu.click()
      const item = await waitUntilShowUp(menus.account.createAccount)
      await item.click()
      const tokenBalance = await waitUntilShowUp(screens.main.tokens.balance)
      assert.equal(await tokenBalance.getText(), '0 TST')
    })

    it('click to token opens the etherscan', async function () {
      await (await waitUntilShowUp(screens.main.tokens.token)).click()
      await switchToLastPage()
      const title = await driver.getCurrentUrl()
      assert.equal(title.includes('https://etherscan.io/token/'), true, 'link leads to wrong page')
      await switchToFirstPage()
    })
  })

  describe('Check support of token per network basis ', async function () {

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

    describe('Add token with the same address to each network  ', async function () {

      const tokenName = 'DVT'
      const tokenDecimals = '13'

      it('adds token with  the same address to POA network', async function () {
        await setProvider(NETWORKS.POA)
        await addToken(tokenAddress, tokenName, tokenDecimals)
        const tokenBalance = await waitUntilShowUp(screens.main.tokens.balance)
        assert.notEqual(await tokenBalance.getText(), '')
      })

      it('adds token with  the same address to SOKOL network', async function () {
        await setProvider(NETWORKS.SOKOL)
        await addToken(tokenAddress, tokenName, tokenDecimals)
        const tokenBalance = await waitUntilShowUp(screens.main.tokens.balance)
        assert.notEqual(await tokenBalance.getText(), '')
      })

      it('adds token with  the same address to MAINNET network', async function () {
        await setProvider(NETWORKS.MAINNET)
        await addToken(tokenAddress, tokenName, tokenDecimals)
        const tokenBalance = await waitUntilShowUp(screens.main.tokens.balance)
        assert.notEqual(await tokenBalance.getText(), '')
      })

      it('adds token with  the same address to ROPSTEN network', async function () {
        await setProvider(NETWORKS.ROPSTEN)
        await addToken(tokenAddress, tokenName, tokenDecimals)
        const tokenBalance = await waitUntilShowUp(screens.main.tokens.balance)
        assert.notEqual(await tokenBalance.getText(), '')
      })

      it('adds token with  the same address to KOVAN network', async function () {
        await setProvider(NETWORKS.KOVAN)
        await addToken(tokenAddress, tokenName, tokenDecimals)
        const tokenBalance = await waitUntilShowUp(screens.main.tokens.balance)
        assert.notEqual(await tokenBalance.getText(), '')
      })

      it('adds token with  the same address to RINKEBY network', async function () {
        await setProvider(NETWORKS.RINKEBY)
        await addToken(tokenAddress, tokenName, tokenDecimals)
        const tokenBalance = await waitUntilShowUp(screens.main.tokens.balance)
        assert.notEqual(await tokenBalance.getText(), '')
      })

      it('token still should be displayed in LOCALHOST network', async function () {
        await setProvider(NETWORKS.LOCALHOST)
        await waitUntilDisappear(screens.main.tokens.amount)
        assert.notEqual(await waitUntilShowUp(screens.main.tokens.amount), false, 'App is frozen')
        const tokens = await driver.findElements(screens.main.tokens.amount)
        assert.equal(tokens.length, 1, '\'Tokens\' section doesn\'t contain field with amount of tokens')
        assert.equal(await tokens[0].getText(), screens.main.tokens.textYouOwn1token, 'Token isn\'t displayed')
      })
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
      await switchToLastPage()
      const title = await driver.getCurrentUrl()
      assert.equal(title.includes('https://etherscan.io/token/'), true, 'link leads to wrong page')
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
  })
  describe('Remove Token', function () {

    it('remove option open \'Remove token\' screen ', async function () {
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
      assert.equal(await title.getText(), screens.removeToken.labelText, 'label is incorrect')
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
      case NETWORKS.SOKOL:
        counter = 1
        break
      case NETWORKS.MAINNET:
        counter = 2
        break
      case NETWORKS.ROPSTEN:
        counter = 3
        break
      case NETWORKS.KOVAN:
        counter = 4
        break
      case NETWORKS.RINKEBY:
        counter = 5
        break
      case NETWORKS.LOCALHOST:
        counter = 6
        break
      case NETWORKS.CUSTOM:
        counter = 7
        break
      default:
        counter = 6
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
      const tokensStatus = await driver.findElements(screens.main.tokens.amount)
      assert.equal(tokensStatus.length, 1, '\'Tokens\' section doesn\'t contain field with amount of tokens')
      assert.equal(await tokensStatus[0].getText(), screens.main.tokens.textNoTokens, 'Unexpected token presents')
      // Check if token presents
      const tokens = await driver.findElements(screens.main.tokens.token)
      assert.equal(tokens.length, 0, 'Unexpected token presents')
      return true
    } catch (err) {
      return false
    }
  }

  async function addToken (tokenAddress, tokenName, tokenDecimals) {
    try {
      const button = await waitUntilShowUp(screens.main.tokens.buttonAdd, 300)
      await click(button)
      const field = await waitUntilShowUp(screens.addToken.fields.contractAddress)
      await clearField(field)
      await field.sendKeys(tokenAddress)

      const buttonAdd = await waitUntilShowUp(screens.addToken.buttonAdd)
      await click(buttonAdd)
      return true
    } catch (err) {
      console.log(err)
      return false
    }
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

})

