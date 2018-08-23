const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const assert = require('assert')
const pify = require('pify')
const webdriver = require('selenium-webdriver')
const { By, Key, until } = webdriver
const { clearField, delay, buildChromeWebDriver, buildFirefoxWebdriver, installWebExt, getExtensionIdChrome, getExtensionIdFirefox } = require('./func')

const accountsMenuSelector = '#app-content > div > div.full-width > div > div:nth-child(2) > span > div'
const settingsTitleSelector = '#app-content > div > div.app-primary.from-right > div > div.section-title.flex-row.flex-center > h2'
const deleteImportedAccountTitleSelector = '#app-content > div > div.app-primary.from-left > div > div.section-title.flex-row.flex-center > h2'
const importedAccountRemoveIconSelector = '#app-content > div > div.full-width > div > div:nth-child(2) > span > div > div > span > div > li:nth-child(4) > div.remove'
const importedLabelSelector = '#app-content > div > div.full-width > div > div:nth-child(2) > span > div > div > span > div > li:nth-child(4) > div.keyring-label'
const buttonChangePassword = '#app-content > div > div.app-primary.from-right > div > div.flex-column.flex-justify-center.flex-grow.select-none > div > div:nth-child(10) > button:nth-child(5)'
let password = '123456789'

const sandwichMenuSelectors = {
  Menu: '.sandwich-expando',
  Settings: '#app-content > div > div:nth-child(3) > span > div > li:nth-child(2)',
  LogOut: '#app-content > div > div:nth-child(3) > span > div > li:nth-child(3)',
}

const titlesOfScreensSelectors = {
  ChangePassword: 'Change Password',
  Settings: 'Settings',
}
const mainScreenSelectors = {
  buttonBuy: '#app-content > div > div.app-primary.from-right > div > div > div.flex-row > button:nth-child(3)',
}

const screenChangePassword = {
  ById: {
    fieldOldPassword: 'old-password-box',
    fieldNewPassword: 'new-password-box',
    fieldConfirmNewPassword: 'password-box-confirm',
  },
  ByCss: {
    buttonNo: '#app-content > div > div.app-primary.from-right > div > div.flex-row.flex-right > button.btn-violet',
    buttonYes: '#app-content > div > div.app-primary.from-right > div > div.flex-row.flex-right > button:nth-child(2)',
  },
  ByClassName: {
    label: 'confirm-label',
    arrowLeft: 'fa fa-arrow-left fa-lg cursor-pointer',
    error: 'error',
  },
  labelText: 'Are you sure you want to change the password for unlocking of your wallet?',
  error: {
    differ: 'New password should differ from the current one',
    notLong: 'Password not long enough',
    dontMatch: 'Passwords don\'t match',
    incorrectPassword: 'Incorrect password',
  },
}
const screenLock = {
  fieldPassword: 'password-box',
  error: 'error',
  errorText: 'Incorrect password',
  buttonLogin: 'cursor-pointer',
}

describe('Metamask popup page', async function () {
  let driver, accountAddress, tokenAddress, extensionId

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
        this.test.error(new Error(errorMessage))
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

    it('switches to Chrome extensions list', async function () {
      await delay(300)
      const windowHandles = await driver.getAllWindowHandles()
      await driver.switchTo().window(windowHandles[0])
    })

    it('sets provider type to localhost', async function () {
      await delay(300)
      await setProviderType('localhost')
    })

  })

  describe('Account Creation', async () => {

    it('matches Nifty Wallet title', async () => {
      const title = await driver.getTitle()
      assert.equal(title, 'Nifty Wallet', 'title matches Nifty Wallet')
      await delay(300)
    })

    it('show terms of use', async () => {
      const terms = await driver.findElement(By.css('.terms-header')).getText()
      assert.equal(terms, 'Terms of Use', 'shows terms of use')
      delay(300)
    })

    it('checks if the TOU button is enabled', async () => {
      const button = await driver.findElement(By.css('button')).isEnabled()
      assert.equal(button, true, 'enabled continue button')
      const element = await driver.findElement(By.linkText('Terms of Service'))
      await driver.executeScript('arguments[0].scrollIntoView(true)', element)
      await delay(700)
    })

    it('allows the button to be clicked when scrolled to the bottom of TOU', async () => {
      const button = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div.flex-column.flex-center.flex-grow > button'))
      await button.click()
    })

    it('accepts password with length of eight', async () => {
      const passwordBox = await driver.findElement(By.id('password-box'))
      const passwordBoxConfirm = await driver.findElement(By.id('password-box-confirm'))
      const button = await driver.findElements(By.css('button'))

      await passwordBox.sendKeys(password)
      await passwordBoxConfirm.sendKeys(password)
      await button[0].click()
      await delay(500)
    })

    it('shows value was created and seed phrase', async () => {
      await delay(300)
      const element = await driver.findElement(By.css('.twelve-word-phrase'))
      const seedPhrase = await element.getText()
      assert.equal(seedPhrase.split(' ').length, 12)
      const continueAfterSeedPhrase = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > button:nth-child(4)'))
      assert.equal(await continueAfterSeedPhrase.getText(), `I've copied it somewhere safe`)
      await continueAfterSeedPhrase.click()
      await delay(300)
    })

    it('adds a second account', async function () {
      await driver.findElement(By.css(accountsMenuSelector)).click()
      await delay(300)
      await driver.findElement(By.css('#app-content > div > div.full-width > div > div:nth-child(2) > span > div > div > span > div > li:nth-child(3) > span')).click()
    })

    it('shows account address', async function () {
      await delay(300)
      accountAddress = await driver.findElement(By.css('#app-content > div > div.app-primary.from-left > div > div > div:nth-child(1) > flex-column > div.flex-row > div')).getText()
    })

    it('logs out of the vault', async () => {
      await driver.findElement(By.css('.sandwich-expando')).click()
      await delay(500)
      const logoutButton = await driver.findElement(By.css('#app-content > div > div:nth-child(3) > span > div > li:nth-child(3)'))
      assert.equal(await logoutButton.getText(), 'Log Out')
      await logoutButton.click()
    })

    it('accepts account password after lock', async () => {
      await delay(500)
      await driver.findElement(By.id('password-box')).sendKeys(password)
      await driver.findElement(By.id('password-box')).sendKeys(Key.ENTER)
      await delay(500)
    })

    it('shows QR code option', async () => {
      await delay(300)
      await driver.findElement(By.css('.account-dropdown')).click()
      await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div > div:nth-child(1) > flex-column > div.name-label > div > span > div > div > div > li:nth-child(3)')).click()
      await delay(300)
    })

    it('checks QR code address is the same as account details address', async () => {
      const QRaccountAddress = await driver.findElement(By.css('.ellip-address')).getText()
      assert.equal(accountAddress.toLowerCase(), QRaccountAddress)
      await driver.findElement(By.css('.fa-arrow-left')).click()
      await delay(500)
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

    describe('check screen "Settings" -> "Change password" ', async () => {

      it('checks if "Change password" button is present and enabled', async () => {
        await driver.findElement(By.css(sandwichMenuSelectors.Menu)).click()
        await delay(500)
        await driver.findElement(By.css(sandwichMenuSelectors.Settings)).click()
        await delay(500)
        const buttons = await driver.findElements(By.css(buttonChangePassword))
        assert.equal(buttons.length, 1, 'Button "Change password" is not present')
        assert.equal(await buttons[0].isEnabled(), true, 'Button "Change password" is disabled')
      })

      it('screen contains correct title', async () => {
        const button = await driver.findElement(By.css(buttonChangePassword))
        await button.click()
        const title = await driver.findElement(By.className('page-subtitle'))
        assert.equal(await title.getText(), titlesOfScreensSelectors.ChangePassword, '"Change password" screen contains incorrect title')
      })

      it('screen contains correct label', async () => {
        const labels = await driver.findElements(By.className(screenChangePassword.ByClassName.label))
        assert.equal(labels.length, 1, 'screen "Change password" doesn\'t contain label')
        assert.equal(await labels[0].getText(), screenChangePassword.labelText, 'label contains incorrect title')
      })

      it('clicking the button "No" bring back to "Setting" screen ', async () => {
        const button = await driver.findElement(By.css(screenChangePassword.ByCss.buttonNo))
        await button.click()
        const title = await driver.findElement(By.css(settingsTitleSelector))
        assert.equal(await title.getText(), titlesOfScreensSelectors.Settings, 'button "No" doesnt open settings screen')
        const buttonChangePass = await driver.findElement(By.css(buttonChangePassword))
        await buttonChangePass.click()
      })
    })

    describe('Validation of errors ', async () => {

      before(async () => {
        fieldOldPassword = await driver.findElement(By.id(screenChangePassword.ById.fieldOldPassword))
        await fieldOldPassword.sendKeys(password)
        fieldNewPassword = await driver.findElement(By.id(screenChangePassword.ById.fieldNewPassword))
        fieldConfirmNewPassword = await driver.findElement(By.id(screenChangePassword.ById.fieldConfirmNewPassword))
        buttonYes = await driver.findElement(By.css(screenChangePassword.ByCss.buttonYes))
      })

      it('error if new password shorter than 8 digits', async () => {
        await fieldNewPassword.sendKeys(newPassword.short)
        await fieldConfirmNewPassword.sendKeys(newPassword.short)
        await buttonYes.click()
        const errors = await driver.findElements(By.className(screenChangePassword.ByClassName.error))
        assert.equal(errors.length > 0, true, 'error isn\'t displayed')
        assert.equal(await errors[0].getText(), screenChangePassword.error.notLong, 'Error\'s text incorrect')
      })

      it('error if new password  doesn\'t match confirmation', async () => {
        await clearField(fieldNewPassword)
        await clearField(fieldConfirmNewPassword)
        await fieldNewPassword.sendKeys(newPassword.correct)
        await fieldConfirmNewPassword.sendKeys(newPassword.incorrect)
        await buttonYes.click()
        const errors = await driver.findElements(By.className(screenChangePassword.ByClassName.error))
        assert.equal(errors.length > 0, true, 'error isn\'t displayed')
        assert.equal(await errors[0].getText(), screenChangePassword.error.dontMatch, 'Error\'s text incorrect')
      })

      it('error if new password match old password', async () => {
        await clearField(fieldNewPassword)
        await clearField(fieldConfirmNewPassword)
        await fieldNewPassword.sendKeys(password)
        await fieldConfirmNewPassword.sendKeys(password)
        await buttonYes.click()
        const errors = await driver.findElements(By.className(screenChangePassword.ByClassName.error))
        assert.equal(errors.length > 0, true, 'error isn\'t displayed')
        assert.equal(await errors[0].getText(), screenChangePassword.error.differ, 'Error\'s text incorrect')
      })

      it.skip('error if old password incorrect, https://github.com/poanetwork/metamask-extension/issues/86 ', async () => {
        await clearField(fieldOldPassword)
        await fieldOldPassword.sendKeys(newPassword.incorrect)
        await buttonYes.click()
        const errors = await driver.findElements(By.className(screenChangePassword.ByClassName.error))
        assert.equal(errors.length > 0, true, 'error isn\'t displayed')
        assert.equal(await errors[0].getText(), screenChangePassword.error.incorrectPassword, 'Error\'s text incorrect')
      })

      it('no errors if old, new, confirm new passwords are correct; user can change password', async () => {
        await clearField(fieldNewPassword)
        await clearField(fieldOldPassword)
        await clearField(fieldConfirmNewPassword)

        await fieldOldPassword.sendKeys(password)
        await fieldNewPassword.sendKeys(newPassword.correct)
        await fieldConfirmNewPassword.sendKeys(newPassword.correct)
        await buttonYes.click()

        await driver.wait(until.elementLocated(By.css(buttonChangePassword)))
        const buttons = await driver.findElements(By.css(buttonChangePassword))
        assert.equal(buttons.length, 1, 'Button "Change password" is not present')
        assert.equal(await buttons[0].isEnabled(), true, 'Button "Change password" is disabled')
      })
    })

    describe('Check if new password is accepted', async () => {

      it('user can log out', async () => {
        await driver.findElement(By.css(sandwichMenuSelectors.Menu)).click()
        await delay(500)
        await driver.wait(until.elementLocated(By.css(sandwichMenuSelectors.LogOut)))
        const itemLogOut = await driver.findElement(By.css(sandwichMenuSelectors.LogOut))
        await driver.wait(until.elementIsVisible(itemLogOut))
        itemLogOut.click()
        await driver.wait(until.elementLocated(By.id(screenLock.fieldPassword)))
        const fields = await driver.findElements(By.id(screenLock.fieldPassword))
        assert.equal(fields.length, 1, 'password box isn\'t present after logout')
      })
      it.skip('can\'t login with old password', async () => {
        const field = await driver.findElement(By.id(screenLock.fieldPassword))
        await field.sendKeys(password)
        await driver.findElement(By.className(screenLock.buttonLogin)).click()
        const errors = await driver.findElements(By.className(screenLock.error))
        assert.equal(errors.length, 1, 'error isn\'t displayed if password incorrect')
        assert.equal(await errors[0].getText(), screenLock.errorText, 'error\'s text incorrect')
      })
      it('accepts new password after lock', async () => {
        const field = await driver.findElement(By.id(screenLock.fieldPassword))
        await field.sendKeys(newPassword.correct)
        await driver.findElement(By.className(screenLock.buttonLogin)).click()

        await driver.wait(until.elementLocated(By.css(mainScreenSelectors.buttonBuy)))
        const buttons = await driver.findElements(By.css(mainScreenSelectors.buttonBuy))
        assert.equal(buttons.length, 1, 'main screen isn\'t displayed')
        password = newPassword.correct
      })
    })
  })

  describe('Import Account', () => {

    it('opens import account menu', async function () {
      await driver.wait(until.elementLocated(By.css(accountsMenuSelector)))
      await driver.findElement(By.css(accountsMenuSelector)).click()
      await delay(500)
      await driver.findElement(By.css('#app-content > div > div.full-width > div > div:nth-child(2) > span > div > div > span > div > li:nth-child(5) > span')).click()
      await delay(500)
      const importAccountTitle = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div:nth-child(2) > div.flex-row.flex-center > h2'))
      assert.equal(await importAccountTitle.getText(), 'Import Accounts')
    })

    it('imports account', async function () {
      const privateKeyBox = await driver.findElement(By.css('#private-key-box'))
      const importButton = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div:nth-child(2) > div:nth-child(4) > button'))
      privateKeyBox.sendKeys('c6b81c1252415d1acfda94474ab8f662a44c045f96749c805ff12a6074081586')// demo private key
      importButton.click()
      await delay(200)
      // check, that account is added
      await driver.findElement(By.css(accountsMenuSelector)).click()
      await delay(500)
      const importedLabel = await driver.findElement(By.css(importedLabelSelector))
      assert.equal(await importedLabel.getText(), 'IMPORTED')
    })

    it('opens delete imported account screen', async function () {
      await driver.findElement(By.css(importedAccountRemoveIconSelector)).click()
      await delay(200)
      const deleteImportedAccountTitle = await driver.findElement(By.css(deleteImportedAccountTitleSelector))
      assert.equal(await deleteImportedAccountTitle.getText(), 'Delete Imported Account')
    })

    it('doesn\'t remove imported account with \'No\' button', async function () {
      const NoButton = await driver.findElement(By.css('#app-content > div > div.app-primary.from-left > div > div.flex-row.flex-right > button.btn-violet'))
      NoButton.click()
      await delay(500)
      const settingsTitle = await driver.findElement(By.css(settingsTitleSelector))
      assert.equal(await settingsTitle.getText(), 'Settings')

      // check, that imported account still exists
      await driver.findElement(By.css(accountsMenuSelector)).click()
      await delay(500)
      const importedLabel = await driver.findElement(By.css(importedLabelSelector))
      assert.equal(await importedLabel.getText(), 'IMPORTED')
    })

    it('opens delete imported account screen again', async function () {
      await driver.findElement(By.css(importedAccountRemoveIconSelector)).click()
      await delay(500)
    })

    it('removes imported account with \'Yes\' button', async function () {
      const YesButton = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div.flex-row.flex-right > button:nth-child(2)'))
      YesButton.click()
      await delay(500)
      const settingsTitle = await driver.findElement(By.css(settingsTitleSelector))
      assert.equal(await settingsTitle.getText(), 'Settings')

      // check, that imported account is removed
      await driver.findElement(By.css(accountsMenuSelector)).click()
      await delay(500)
      const importedAccounts = await driver.findElements(By.css(importedLabelSelector))
      assert.ok(importedAccounts.length === 0)
      await driver.findElement(By.css(accountsMenuSelector)).click()
      await delay(500)
    })
  })

  describe('Import Ganache seed phrase', function () {

    it('logs out', async function () {
      await driver.findElement(By.css('.sandwich-expando')).click()
      await delay(200)
      const logOut = await driver.findElement(By.css('#app-content > div > div:nth-child(3) > span > div > li:nth-child(3)'))
      assert.equal(await logOut.getText(), 'Log Out')
      await logOut.click()
      await delay(300)
    })

    it('restores from seed phrase', async function () {
      const restoreSeedLink = await driver.findElement(By.css('#app-content > div > div.app-primary.from-left > div > div.flex-row.flex-center.flex-grow > p'))
      assert.equal(await restoreSeedLink.getText(), 'Restore from seed phrase')
      await restoreSeedLink.click()
      await delay(100)
    })

    it('adds seed phrase', async function () {
      const testSeedPhrase = 'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent'
      const seedTextArea = await driver.findElement(By.css('#app-content > div > div.app-primary.from-left > div > div.initialize-screen.flex-column.flex-center.flex-grow > textarea'))
      await seedTextArea.sendKeys(testSeedPhrase)

      await driver.findElement(By.id('password-box')).sendKeys('123456789')
      await driver.findElement(By.id('password-box-confirm')).sendKeys('123456789')
      await driver.findElement(By.css('#app-content > div > div.app-primary.from-left > div > div.initialize-screen.flex-column.flex-center.flex-grow > div > button:nth-child(2)')).click()
      await delay(500)
    })

    it('balance renders', async function () {
      await delay(200)
      const balance = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div > div.flex-row > div.ether-balance.ether-balance-amount > div > div > div:nth-child(1) > div:nth-child(1)'))
      assert.equal(await balance.getText(), '100.000')
      await delay(200)
    })

    it('sends transaction', async function () {
      const sendButton = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div > div.flex-row > button:nth-child(4)'))
      assert.equal(await sendButton.getText(), 'Send')
      await sendButton.click()
      await delay(200)
    })

    it('adds recipient address and amount', async function () {
      const sendTranscationScreen = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > h3:nth-child(2)')).getText()
      assert.equal(sendTranscationScreen, 'Send Transaction')
      const inputAddress = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > section:nth-child(3) > div > input'))
      const inputAmmount = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > section:nth-child(4) > input'))
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970')
      await inputAmmount.sendKeys('10')
      await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > section:nth-child(4) > button')).click()
      await delay(300)
    })

    it('confirms transaction', async function () {
      await delay(300)
      const bySubmitButton = By.css('#pending-tx-form > div.flex-row.flex-space-around.conf-buttons > input')
      const submitButton = await driver.wait(until.elementLocated(bySubmitButton))

      submitButton.click()

      await delay(1500)
    })

    it('finds the transaction in the transactions list', async function () {
      const tranasactionAmount = await driver.findElement(By.css('#app-content > div > div.app-primary.from-left > div > section > section > div > div > div > div.ether-balance.ether-balance-amount > div > div > div > div:nth-child(1)'))
      assert.equal(await tranasactionAmount.getText(), '10.0')
    })
  })

  describe('Token Factory', function () {

    it('navigates to token factory', async function () {
      await driver.get('http://tokenfactory.surge.sh/')
    })

    it('navigates to create token contract link', async function () {
      const createToken = await driver.findElement(By.css('#bs-example-navbar-collapse-1 > ul > li:nth-child(3) > a'))
      await createToken.click()
    })

    it('adds input for token', async function () {
      const totalSupply = await driver.findElement(By.css('#main > div > div > div > div:nth-child(2) > div > div:nth-child(5) > input'))
      const tokenName = await driver.findElement(By.css('#main > div > div > div > div:nth-child(2) > div > div:nth-child(6) > input'))
      const tokenDecimal = await driver.findElement(By.css('#main > div > div > div > div:nth-child(2) > div > div:nth-child(7) > input'))
      const tokenSymbol = await driver.findElement(By.css('#main > div > div > div > div:nth-child(2) > div > div:nth-child(8) > input'))
      const createToken = await driver.findElement(By.css('#main > div > div > div > div:nth-child(2) > div > button'))

      await totalSupply.sendKeys('100')
      await tokenName.sendKeys('Test')
      await tokenDecimal.sendKeys('0')
      await tokenSymbol.sendKeys('TST')
      await createToken.click()
      await delay(1000)
    })

    // There is an issue with blank confirmation window in Firefox, but the button is still there and the driver is able to clicked (?.?)
    it('confirms transaction in MetaMask popup', async function () {
      const windowHandles = await driver.getAllWindowHandles()
      await driver.switchTo().window(windowHandles[windowHandles.length - 1])
      const byMetamaskSubmit = By.css('#pending-tx-form > div.flex-row.flex-space-around.conf-buttons > input')
      const metamaskSubmit = await driver.wait(until.elementLocated(byMetamaskSubmit))
      await metamaskSubmit.click()
      await delay(1000)
    })

    it('switches back to Token Factory to grab the token contract address', async function () {
      const windowHandles = await driver.getAllWindowHandles()
      await driver.switchTo().window(windowHandles[0])
      const tokenContactAddress = await driver.findElement(By.css('#main > div > div > div > div:nth-child(2) > span:nth-child(3)'))
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
      const tokensTab = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > section > div > div.inactiveForm.pointer'))
      assert.equal(await tokensTab.getText(), 'Tokens')
      await tokensTab.click()
      await delay(300)
    })

    it('navigates to the add token screen', async function () {
      const addTokenButton = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > section > div.full-flex-height > div > button'))
      assert.equal(await addTokenButton.getText(), 'Add Token')
      await addTokenButton.click()
    })

    it('checks add token screen rendered', async function () {
      const addTokenScreen = await driver.findElement(By.css(settingsTitleSelector))
      assert.equal(await addTokenScreen.getText(), 'Add Token')
    })

    it('adds token parameters', async function () {
      const tokenContractAddress = await driver.findElement(By.css('#token-address'))
      await tokenContractAddress.sendKeys(tokenAddress)
      await delay(300)
      await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div.flex-column.flex-justify-center.flex-grow.select-none > div > button')).click()
      await delay(200)
    })

    it('checks the token balance', async function () {
      const tokenBalance = await driver.findElement(By.css('#app-content > div > div.app-primary.from-left > div > section > div.full-flex-height > ol > li:nth-child(2) > h3'))
      assert.equal(await tokenBalance.getText(), '100 TST')
    })
  })

  describe('Remove Token', function () {
    it('navigates to the remove token screen and goes back', async function () {
      // Click to remove first token
      const removeTokenButton = await driver.findElement(By.css('#app-content > div > div.app-primary.from-left > div > section > div.full-flex-height > ol > li:nth-child(2) > .trash'))
      await removeTokenButton.click()
      const removeTokenTitle = await driver.findElement(By.css(settingsTitleSelector))

      // Check that the correct page is opened
      assert.equal(await removeTokenTitle.getText(), 'Remove Token')

      // Go back
      await driver.findElement(By.css('.fa-arrow-left')).click()
      await delay(300)

      // Check that the token was not deleted
      const tokens = await driver.findElements(By.css('#app-content > div > div.app-primary.from-left > div > section > div.full-flex-height > ol > li'))
      assert.equal(tokens.length, 1, 'There should be 1 token')
    })

    it('navigates to the remove token screen and removes the token', async function () {
      // Click to remove first token
      const removeTokenButton = await driver.findElement(By.css('#app-content > div > div.app-primary.from-left > div > section > div.full-flex-height > ol > li:nth-child(2) > .trash'))
      await removeTokenButton.click()
      const removeTokenTitle = await driver.findElement(By.css(settingsTitleSelector))

      // Check that the correct page is opened
      assert.equal(await removeTokenTitle.getText(), 'Remove Token')

      // Confirm the removal
      const confirmRemoveTokenButton = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div.flex-column.flex-justify-center.flex-grow.select-none > div > button:nth-child(2)'))
      assert.equal(await confirmRemoveTokenButton.getText(), 'Yes')
      await confirmRemoveTokenButton.click()
      await delay(300)

      // Check that the token was deleted
      const tokens = await driver.findElements(By.css('#app-content > div > div.app-primary.from-left > div > section > div.full-flex-height > ol > li'))
      assert.equal(tokens.length, 0, 'There should be no tokens')
    })
  })

  describe('Custom Rpc', function () {
    it('switches to settings screen', async function () {
      await driver.findElement(By.css('.sandwich-expando')).click()
      await delay(200)
      const settings = await driver.findElement(By.css('#app-content > div > div:nth-child(3) > span > div > li:nth-child(2)'))
      assert.equal(await settings.getText(), 'Settings')
      await settings.click()
      await delay(300)
    })

    it('add custom rpc', async function () {
      const customUrl = 'http://test.com'
      const input = await driver.findElement(By.css('#new_rpc'))
      input.sendKeys(customUrl)
      await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div.flex-column.flex-justify-center.flex-grow.select-none > div > div:nth-child(2) > button')).click()
      if (process.env.SELENIUM_BROWSER === 'firefox') {
        input.sendKeys(Key.ENTER)
      }
      await delay(400)
      const customUrlElement = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div.flex-column.flex-justify-center.flex-grow.select-none > div > div:nth-child(1) > span:nth-child(2)'))
      assert.equal(await customUrlElement.getText(), customUrl)
    })

    it('delete custom rpc', async function () {
      await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div.flex-column.flex-justify-center.flex-grow.select-none > div > div:nth-child(1) > button')).click()
      await delay(300)
      const titleConfirmPage = await driver.findElement(By.css(settingsTitleSelector))
      assert.equal(await titleConfirmPage.getText(), 'Delete Custom RPC')
      const yesButton = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div.flex-row.flex-right > button:nth-child(2)'))
      assert.equal(await yesButton.getText(), 'Yes')
      await yesButton.click()
      await delay(300)
      const urlElement = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div.flex-column.flex-justify-center.flex-grow.select-none > div > div:nth-child(1) > span:nth-child(2)'))
      assert.equal(await urlElement.getText(), 'POA Network')
    })
  })

  async function setProviderType (type) {
    await driver.executeScript('window.metamask.setProviderType(arguments[0])', type)
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

})


