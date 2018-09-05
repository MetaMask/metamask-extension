const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const assert = require('assert')
const pify = require('pify')
const webdriver = require('selenium-webdriver')
const { By, Key, until } = webdriver
const { clearField, delay, buildChromeWebDriver, buildFirefoxWebdriver, installWebExt, getExtensionIdChrome, getExtensionIdFirefox } = require('./func')

let password = '123456789'
const loader = '#app-content > div > div.full-flex-height > img'
const { menus, screens, NETWORKS } = require('./elements')


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
      assert.equal(title, screens.TOU.titleText, 'title matches Nifty Wallet')
      await delay(300)
    })

    it('show terms of use', async () => {
      const terms = await driver.findElement(By.css(screens.TOU.header)).getText()
      assert.equal(terms, 'Terms of Use', 'shows terms of use')
      delay(300)
    })

    it('checks if the TOU button is enabled', async () => {
      const button = await driver.findElement(By.css(screens.TOU.button)).isEnabled()
      assert.equal(button, true, 'enabled continue button')
      const element = await driver.findElement(By.linkText('Terms of Service'))
      await driver.executeScript('arguments[0].scrollIntoView(true)', element)
      await delay(700)
    })

    it('allows the button to be clicked when scrolled to the bottom of TOU', async () => {
      const button = await driver.findElement(By.css(screens.TOU.button))
      await button.click()
    })

    it('accepts password with length of eight', async () => {
      const passwordBox = await driver.findElement(By.id(screens.create.fieldPassword))
      const passwordBoxConfirm = await driver.findElement(By.id(screens.create.fieldPasswordConfirm))
      const button = await driver.findElements(By.css(screens.create.button))

      await passwordBox.sendKeys(password)
      await passwordBoxConfirm.sendKeys(password)
      await button[0].click()
      await delay(500)
    })

    it('shows vault was created and seed phrase', async () => {
      await delay(300)
      const element = await driver.findElement(By.css(screens.seedPhrase.fieldPhrase))
      const seedPhrase = await element.getText()
      assert.equal(seedPhrase.split(' ').length, 12)
      const continueAfterSeedPhrase = await driver.findElement(By.css(screens.seedPhrase.buttonIveCopied))
      assert.equal(await continueAfterSeedPhrase.getText(), screens.seedPhrase.textButtonIveCopied)
      await continueAfterSeedPhrase.click()
      await delay(300)
    })

    it('adds a second account', async function () {
      // throw('sf')
      await driver.findElement(By.css(menus.account.menu)).click()
      await delay(300)
      await driver.findElement(By.css(menus.account.createAccount)).click()
    })

    it('shows account address', async function () {
      await delay(300)
      accountAddress = await driver.findElement(By.css(screens.main.address)).getText()
    })

    it('logs out of the vault', async () => {
      await driver.findElement(By.css(menus.sandwich.menu)).click()
      await delay(500)
      const logoutButton = await driver.findElement(By.css(menus.sandwich.logOut))
      assert.equal(await logoutButton.getText(), 'Log Out')
      await logoutButton.click()
    })

    it('accepts account password after lock', async () => {
      await delay(500)
      await driver.findElement(By.id(screens.lock.fieldPassword)).sendKeys(password)
      await driver.findElement(By.id(screens.lock.fieldPassword)).sendKeys(Key.ENTER)
      await delay(500)
    })

    it('shows QR code option', async () => {
      await delay(300)
      await driver.findElement(By.css(menus.dot.menu)).click()
      await driver.findElement(By.css(menus.dot.showQRcode)).click()
      await delay(300)
    })

    it('checks QR code address is the same as account details address', async () => {
      const QRaccountAddress = await driver.findElement(By.css(screens.QRcode.address)).getText()
      assert.equal(accountAddress.toLowerCase(), QRaccountAddress)
      await driver.findElement(By.css(screens.QRcode.buttonArrow)).click()
      await delay(500)
    })
  })

  // it doesn't work for Firefox in Circle CI
  if (process.env.SELENIUM_BROWSER === 'chrome') {
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

        it('checks if "Change password" button is present and enabled', async () => {
          await driver.findElement(By.css(menus.sandwich.menu)).click()
          await delay(500)
          await driver.findElement(By.css(menus.sandwich.settings)).click()
          await delay(500)
          const buttons = await driver.findElements(By.css(screens.settings.buttons.changePassword))
          assert.equal(buttons.length, 1, 'Button "Change password" is not present')
          assert.equal(await buttons[0].isEnabled(), true, 'Button "Change password" is disabled')
        })

        it('screen contains correct title', async () => {
          const button = await driver.findElement(By.css(screens.settings.buttons.changePassword))
          await delay(500)
          await driver.executeScript('arguments[0].scrollIntoView(true)', button)
          await delay(700)
          await button.click()
          await delay(500)
          const title = await driver.findElement(By.css(screens.changePassword.ByCss.subtitle))
          assert.equal(await title.getText(), screens.changePassword.titleText, '"Change password" screen contains incorrect title')
        })

        it('screen contains correct label', async () => {
          const labels = await driver.findElements(By.css(screens.changePassword.ByCss.label))
          assert.equal(labels.length, 1, 'screen "Change password" doesn\'t contain label')
          assert.equal(await labels[0].getText(), screens.changePassword.labelText, 'label contains incorrect title')
        })

        it('clicking the button "No" bring back to "Setting" screen ', async () => {
          const button = await driver.findElement(By.css(screens.changePassword.ByCss.buttonNo))
          await button.click()
          const title = await driver.findElement(By.css(screens.settings.title))
          assert.equal(await title.getText(), screens.settings.titleText, 'button "No" doesnt open settings screen')
          const buttonChangePass = await driver.findElement(By.css(screens.settings.buttons.changePassword))
          await buttonChangePass.click()
        })
      })

      describe('Validation of errors ', async () => {

        before(async () => {
          fieldOldPassword = await driver.findElement(By.id(screens.changePassword.ById.fieldOldPassword))
          await fieldOldPassword.sendKeys(password)
          fieldNewPassword = await driver.findElement(By.id(screens.changePassword.ById.fieldNewPassword))
          fieldConfirmNewPassword = await driver.findElement(By.id(screens.changePassword.ById.fieldConfirmNewPassword))
          buttonYes = await driver.findElement(By.css(screens.changePassword.ByCss.buttonYes))
        })

        it('error if new password shorter than 8 digits', async () => {
          await fieldNewPassword.sendKeys(newPassword.short)
          await fieldConfirmNewPassword.sendKeys(newPassword.short)
          await buttonYes.click()
          const errors = await driver.findElements(By.className(screens.changePassword.ByClassName.error))
          assert.equal(errors.length > 0, true, 'error isn\'t displayed')
          assert.equal(await errors[0].getText(), screens.changePassword.error.notLong, 'Error\'s text incorrect')
        })

        it('error if new password  doesn\'t match confirmation', async () => {
          await clearField(fieldNewPassword)
          await clearField(fieldConfirmNewPassword)
          await fieldNewPassword.sendKeys(newPassword.correct)
          await fieldConfirmNewPassword.sendKeys(newPassword.incorrect)
          await buttonYes.click()
          const errors = await driver.findElements(By.className(screens.changePassword.ByClassName.error))
          assert.equal(errors.length > 0, true, 'error isn\'t displayed')
          assert.equal(await errors[0].getText(), screens.changePassword.error.dontMatch, 'Error\'s text incorrect')
        })

        it('error if new password match old password', async () => {
          await clearField(fieldNewPassword)
          await clearField(fieldConfirmNewPassword)
          await fieldNewPassword.sendKeys(password)
          await fieldConfirmNewPassword.sendKeys(password)
          await buttonYes.click()
          const errors = await driver.findElements(By.className(screens.changePassword.ByClassName.error))
          assert.equal(errors.length > 0, true, 'error isn\'t displayed')
          assert.equal(await errors[0].getText(), screens.changePassword.error.differ, 'Error\'s text incorrect')
        })

        it.skip('error if old password incorrect, https://github.com/poanetwork/metamask-extension/issues/86 ', async () => {
          await clearField(fieldOldPassword)
          await fieldOldPassword.sendKeys(newPassword.incorrect)
          await buttonYes.click()
          const errors = await driver.findElements(By.className(screens.changePassword.ByClassName.error))
          assert.equal(errors.length > 0, true, 'error isn\'t displayed')
          assert.equal(await errors[0].getText(), screens.changePassword.error.incorrectPassword, 'Error\'s text incorrect')
        })

        it('no errors if old, new, confirm new passwords are correct; user can change password', async () => {
          await clearField(fieldNewPassword)
          await clearField(fieldOldPassword)
          await clearField(fieldConfirmNewPassword)

          await fieldOldPassword.sendKeys(password)
          await fieldNewPassword.sendKeys(newPassword.correct)
          await fieldConfirmNewPassword.sendKeys(newPassword.correct)
          await buttonYes.click()

          await driver.wait(until.elementLocated(By.css(screens.settings.buttons.changePassword)))
          const buttons = await driver.findElements(By.css(screens.settings.buttons.changePassword))
          assert.equal(buttons.length, 1, 'Button "Change password" is not present')
          assert.equal(await buttons[0].isEnabled(), true, 'Button "Change password" is disabled')
        })
      })

      describe('Check if new password is accepted', async () => {

        it('user can log out', async () => {
          await driver.findElement(By.css(menus.sandwich.menu)).click()
          await delay(500)
          await driver.wait(until.elementLocated(By.css(menus.sandwich.logOut)))
          const itemLogOut = await driver.findElement(By.css(menus.sandwich.logOut))
          await driver.wait(until.elementIsVisible(itemLogOut))
          itemLogOut.click()
          await driver.wait(until.elementLocated(By.id(screens.lock.fieldPassword)))
          const fields = await driver.findElements(By.id(screens.lock.fieldPassword))
          assert.equal(fields.length, 1, 'password box isn\'t present after logout')
        })
        it.skip('can\'t login with old password', async () => {
          const field = await driver.findElement(By.id(screens.lock.fieldPassword))
          await field.sendKeys(password)
          await driver.findElement(By.className(screens.lock.buttonLogin)).click()
          const errors = await driver.findElements(By.className(screens.lock.error))
          assert.equal(errors.length, 1, 'error isn\'t displayed if password incorrect')
          assert.equal(await errors[0].getText(), screens.lock.errorText, 'error\'s text incorrect')
        })
        it('accepts new password after lock', async () => {
          const field = await driver.findElement(By.id(screens.lock.fieldPassword))
          await field.sendKeys(newPassword.correct)
          await driver.findElement(By.className(screens.lock.buttonLogin)).click()

          await driver.wait(until.elementLocated(By.css(screens.main.buttons.buy)))
          const buttons = await driver.findElements(By.css(screens.main.buttons.buy))
          assert.equal(buttons.length, 1, 'main screen isn\'t displayed')
          password = newPassword.correct
        })
      })
    })
  }

  // it doesn't work for Firefox in Circle CI
  if (process.env.SELENIUM_BROWSER === 'chrome') {
    describe('Import Account', () => {

      it('opens import account menu', async function () {
        await driver.wait(until.elementLocated(By.css(menus.account.menu)))
        await driver.findElement(By.css(menus.account.menu)).click()
        await delay(500)
        await driver.findElement(By.css(menus.account.import)).click()
        await delay(500)
        const importAccountTitle = await driver.findElement(By.css(screens.importAccounts.title))
        assert.equal(await importAccountTitle.getText(), screens.importAccounts.textTitle)
      })

      it('imports account', async function () {
        const privateKeyBox = await driver.findElement(By.css(screens.importAccounts.fieldPrivateKey))
        const importButton = await driver.findElement(By.css(screens.importAccounts.buttonImport))
        await privateKeyBox.sendKeys('c6b81c1252415d1acfda94474ab8f662a44c045f96749c805ff12a6074081586')// demo private key
        importButton.click()
        await delay(500)
        // check, that account is added
        await driver.findElement(By.css(menus.account.menu)).click()
        await delay(500)
        const importedLabel = await driver.findElement(By.css(menus.account.labelImported))
        assert.equal(await importedLabel.getText(), 'IMPORTED')
      })

      it('opens delete imported account screen', async function () {
        await driver.findElement(By.css(menus.account.delete)).click()
        await delay(200)
        const deleteImportedAccountTitle = await driver.findElement(By.css(screens.deleteImportedAccount.title))
        assert.equal(await deleteImportedAccountTitle.getText(), screens.deleteImportedAccount.titleText)
      })

      it('doesn\'t remove imported account with \'No\' button', async function () {
        const NoButton = await driver.findElement(By.css(screens.deleteImportedAccount.buttons.no))
        NoButton.click()
        await delay(500)
        const settingsTitle = await driver.findElement(By.css(screens.settings.title))
        assert.equal(await settingsTitle.getText(), 'Settings')

        // check, that imported account still exists
        await driver.findElement(By.css(menus.account.menu)).click()
        await delay(500)
        const importedLabel = await driver.findElement(By.css(menus.account.labelImported))
        assert.equal(await importedLabel.getText(), 'IMPORTED')
      })

      it('opens delete imported account screen again', async function () {
        await driver.findElement(By.css(menus.account.delete)).click()
        await delay(500)
      })

      it('removes imported account with \'Yes\' button', async function () {
        const YesButton = await driver.findElement(By.css(screens.deleteImportedAccount.buttons.yes))
        YesButton.click()
        await delay(500)
        const settingsTitle = await driver.findElement(By.css(screens.settings.title))
        assert.equal(await settingsTitle.getText(), 'Settings')

        // check, that imported account is removed
        await driver.findElement(By.css(menus.account.menu)).click()
        await delay(500)
        const importedAccounts = await driver.findElements(By.css(menus.account.labelImported))
        assert.ok(importedAccounts.length === 0)
        await driver.findElement(By.css(menus.account.menu)).click()
        await delay(500)
      })
    })
  }

  describe('Import Ganache seed phrase', function () {

    it('logs out', async function () {
      await driver.findElement(By.css(menus.sandwich.menu)).click()
      await delay(200)
      const logOut = await driver.findElement(By.css(menus.sandwich.logOut))
      assert.equal(await logOut.getText(), menus.sandwich.textLogOut)
      await logOut.click()
      await delay(300)
    })

    it('restores from seed phrase', async function () {
      const restoreSeedLink = await driver.findElement(By.css(screens.lock.linkRestore))
      assert.equal(await restoreSeedLink.getText(), screens.lock.linkRestoreText)
      await restoreSeedLink.click()
      await delay(100)
    })

    it('adds seed phrase', async function () {
      const testSeedPhrase = 'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent'
      const seedTextArea = await driver.findElement(By.css(screens.restoreVault.textArea))
      await seedTextArea.sendKeys(testSeedPhrase)

      await driver.findElement(By.id(screens.restoreVault.fieldPassword)).sendKeys(password)
      await driver.findElement(By.id(screens.restoreVault.fieldPasswordConfirm)).sendKeys(password)
      await driver.findElement(By.css(screens.restoreVault.buttos.ok)).click()
      await delay(500)
    })

    it('balance renders', async function () {
      await delay(200)
      const balance = await driver.findElement(By.css(screens.main.balance))
      assert.equal(await balance.getText(), '100.000')
      await delay(200)
    })

    it('sends transaction', async function () {
      const sendButton = await driver.findElement(By.css(screens.main.buttons.send))
      assert.equal(await sendButton.getText(), screens.main.buttons.sendText)
      await sendButton.click()
      await delay(200)
    })

    it('adds recipient address and amount', async function () {
      const sendTranscationScreen = await driver.findElement(By.css(screens.sendTransaction.title)).getText()
      assert.equal(sendTranscationScreen, screens.sendTransaction.titleText)
      const inputAddress = await driver.findElement(By.css(screens.sendTransaction.fields.address))
      const inputAmmount = await driver.findElement(By.css(screens.sendTransaction.fields.amount))
      await inputAddress.sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970')
      await inputAmmount.sendKeys('10')
      await driver.findElement(By.css(screens.sendTransaction.buttonNext)).click()
      await delay(300)
    })

    it('confirms transaction', async function () {
      await delay(300)
      const bySubmitButton = By.css(screens.confirmTransaction.buttons.submit)
      const submitButton = await driver.wait(until.elementLocated(bySubmitButton))

      submitButton.click()

      await delay(1500)
    })

    it('finds the transaction in the transactions list', async function () {
      const tranasactionAmount = await driver.findElement(By.css(screens.main.transactionList))
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
      const addTokenScreen = await driver.findElement(By.css(screens.settings.title))
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
      const tokenBalance = await driver.findElement(By.css(screens.main.tokens.balance))
      assert.equal(await tokenBalance.getText(), '100 TST')
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
        const tokenBalance = await await waitUntilShowUp(By.css(screens.main.tokens.balance))
        assert.notEqual(await tokenBalance.getText(), '')
      })

      it('adds token with  the same address to SOKOL network', async function () {
        await setProvider(NETWORKS.SOKOL)
        await addToken(tokenAddress, tokenName, tokenDecimals)
        const tokenBalance = await await waitUntilShowUp(By.css(screens.main.tokens.balance))
        assert.notEqual(await tokenBalance.getText(), '')
      })

      it('adds token with  the same address to MAINNET network', async function () {
        await setProvider(NETWORKS.MAINNET)
        await addToken(tokenAddress, tokenName, tokenDecimals)
        const tokenBalance = await await waitUntilShowUp(By.css(screens.main.tokens.balance))
        assert.notEqual(await tokenBalance.getText(), '')
      })

      it('adds token with  the same address to ROPSTEN network', async function () {
        await setProvider(NETWORKS.ROPSTEN)
        await addToken(tokenAddress, tokenName, tokenDecimals)
        const tokenBalance = await await waitUntilShowUp(By.css(screens.main.tokens.balance))
        assert.notEqual(await tokenBalance.getText(), '')
      })

      it('adds token with  the same address to KOVAN network', async function () {
        await setProvider(NETWORKS.KOVAN)
        await addToken(tokenAddress, tokenName, tokenDecimals)
        const tokenBalance = await await waitUntilShowUp(By.css(screens.main.tokens.balance))
        assert.notEqual(await tokenBalance.getText(), '')
      })

      it('adds token with  the same address to RINKEBY network', async function () {
        await setProvider(NETWORKS.RINKEBY)
        await addToken(tokenAddress, tokenName, tokenDecimals)
        const tokenBalance = await await waitUntilShowUp(By.css(screens.main.tokens.balance))
        assert.notEqual(await tokenBalance.getText(), '')
      })

      it('token still should be displayed in LOCALHOST network', async function () {
        await setProvider(NETWORKS.LOCALHOST)
        await waitUntilDisappear(By.css(screens.main.tokens.amount))
        assert.notEqual(await waitUntilShowUp(By.css(screens.main.tokens.amount)), false, 'App is frozen')
        const tokens = await driver.findElements(By.css(screens.main.tokens.amount))
        assert.equal(tokens.length, 1, '\'Tokens\' section doesn\'t contain field with amount of tokens')
        assert.equal(await tokens[0].getText(), screens.main.tokens.textYouOwn1token, 'Token isn\'t displayed')
      })
    })
  })

  describe('Remove Token', function () {
    it('navigates to the remove token screen and goes back', async function () {
      // Click to remove first token
      await setProvider(NETWORKS.LOCALHOST)
      const removeTokenButton = await driver.findElement(By.css('#app-content > div > div.app-primary.from-left > div > section > div.full-flex-height > ol > li:nth-child(2) > .trash'))
      await removeTokenButton.click()
      const removeTokenTitle = await driver.findElement(By.css(screens.settings.title))

      // Check that the correct page is opened
      assert.equal(await removeTokenTitle.getText(), 'Remove Token')

      // Go back
      await delay(500)
      await driver.findElement(By.className('fa fa-arrow-left fa-lg cursor-pointer')).click()

      await delay(300)

      // Check that the token was not deleted
      const tokens = await driver.findElements(By.css('#app-content > div > div.app-primary.from-left > div > section > div.full-flex-height > ol > li'))
      assert.equal(tokens.length, 1, 'There should be 1 token')
    })

    it('navigates to the remove token screen and removes the token from LOCALHOST', async function () {
      // Click to remove first token
      const removeTokenButton = await driver.findElement(By.css('#app-content > div > div.app-primary.from-left > div > section > div.full-flex-height > ol > li:nth-child(2) > .trash'))
      await removeTokenButton.click()
      const removeTokenTitle = await driver.findElement(By.css(screens.settings.title))

      // Check that the correct page is opened
      assert.equal(await removeTokenTitle.getText(), 'Remove Token')

      // Confirm the removal
      const confirmRemoveTokenButton = await driver.findElement(By.css('#app-content > div > div.app-primary.from-right > div > div.flex-column.flex-justify-center.flex-grow.select-none > div > button:nth-child(2)'))
      assert.equal(await confirmRemoveTokenButton.getText(), 'Yes')
      await confirmRemoveTokenButton.click()
      await delay(300)

      // Check that the token was deleted
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
    it('switches to settings screen', async function () {
      await driver.findElement(By.css(menus.sandwich.menu)).click()
      await delay(200)
      const settings = await driver.findElement(By.css(menus.sandwich.settings))
      assert.equal(await settings.getText(), menus.sandwich.textSettings)
      await settings.click()
      await delay(300)
    })

    it('add custom rpc', async function () {
      const customUrl = 'http://test.com'
      const input = await driver.findElement(By.css(screens.settings.fieldNewRPC))
      input.sendKeys(customUrl)
      await driver.findElement(By.css(screens.settings.buttonSave)).click()
      if (process.env.SELENIUM_BROWSER === 'firefox') {
        input.sendKeys(Key.ENTER)
      }
      await delay(400)
      const customUrlElement = await driver.findElement(By.css(screens.settings.customUrl))
      assert.equal(await customUrlElement.getText(), customUrl)
    })

    it('delete custom rpc', async function () {
      await driver.findElement(By.css(screens.settings.buttons.delete)).click()
      await delay(300)
      const titleConfirmPage = await driver.findElement(By.css(screens.settings.title))
      assert.equal(await titleConfirmPage.getText(), 'Delete Custom RPC')
      const yesButton = await driver.findElement(By.css(screens.deleteCustomRPC.buttons.yes))
      assert.equal(await yesButton.getText(), 'Yes')
      await yesButton.click()
      await delay(300)
      const urlElement = await driver.findElement(By.css(screens.settings.currentNetwork))
      assert.equal(await urlElement.getText(), 'POA Network')
    })
  })

  async function setProviderType (type) {
    await driver.executeScript('window.metamask.setProviderType(arguments[0])', type)
  }

  async function setProvider (network) {
    await driver.findElement(By.className(screens.main.network)).click()
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

  async function waitUntilDisappear (by, Twait) {
    if (Twait === undefined) Twait = 10
    do {
      await delay(100)
      if (!await isElementDisplayed(by)) return true

    } while (Twait-- > 0)
    return false
  }

  async function waitUntilShowUp (by, Twait) {
    if (Twait === undefined) Twait = 2000
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
      await waitUntilDisappear(By.css(loader))
      assert.notEqual(await waitUntilShowUp(By.css(screens.main.tokens.amount)), false, 'App is frozen')
      // Check tokens title
      const tokensStatus = await driver.findElements(By.css(screens.main.tokens.amount))
      assert.equal(tokensStatus.length, 1, '\'Tokens\' section doesn\'t contain field with amount of tokens')
      assert.equal(await tokensStatus[0].getText(), screens.main.tokens.textNoTokens, 'Unexpected token presents')
      // Check if token presents
      const tokens = await driver.findElements(By.css(screens.main.tokens.token))
      assert.equal(tokens.length, 0, 'Unexpected token presents')
      return true
    } catch (err) {
      return err
    }
  }

  async function addToken (tokenAddress, tokenName, tokenDecimals) {
    try {
      const button = await waitUntilShowUp(By.css(screens.main.tokens.buttonAdd))
      await button.click()
      const field = await waitUntilShowUp(By.css(screens.addToken.fieldTokenContractAddress))
      await field.sendKeys(tokenAddress)
      await delay(500)
      await driver.findElement(By.css(screens.addToken.fieldTokenSymbol)).sendKeys(tokenName)
      await delay(500)
      await driver.findElement(By.css(screens.addToken.fieldDecimals)).sendKeys(tokenDecimals)
      const buttonAdd = await waitUntilShowUp(By.css(screens.addToken.buttonAdd))
      await buttonAdd.click()
      return true
    } catch (err) {
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

})


