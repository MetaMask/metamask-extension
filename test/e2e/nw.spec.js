const path = require('path')
const Func = require('./func').Functions
const account1 = '0x2E428ABd9313D256d64D1f69fe3929C3BE18fD1f'
const account2 = '0xd7b7AFeCa35e32594e29504771aC847E2a803742'
const testsFolder = './test-cases'
const setup = require(`${testsFolder}/setup.spec`)
const login = require(`${testsFolder}/login.spec`)
const { accountCreation, getCreatedAccounts } = require(`${testsFolder}/account-creation.spec`)
const connectHDWallet = require(`${testsFolder}/connect-hd-wallet.spec`)
const importAccount = require(`${testsFolder}/import-account.spec`)
const importContractAccount = require(`${testsFolder}/import-contract-account.spec`)
const deleteImportedAccount = require(`${testsFolder}/delete-imported-account.spec`)
const signData = require(`${testsFolder}/sign-data.spec`)
const exportPrivateKey = require(`${testsFolder}/export-private-key.spec`)
const importGanacheSeedPhrase = require(`${testsFolder}/import-ganache-seed-phrase.spec`)
const RSKNetworkTests = require(`${testsFolder}/RSK-network-tests.js`)
const checkEmittedEvents = require(`${testsFolder}/check-emitted-events.spec`)
// const addCustomToken = require(`${testsFolder}/add-token-custom.spec`)
const changePassword = require(`${testsFolder}/change-password.spec`)
const addTokeFromSearch = require(`${testsFolder}/add-token-search.spec`)
const customRPC = require(`${testsFolder}/custom-rpc.spec`)

describe('Metamask popup page', async function () {

  this.timeout(15 * 60 * 1000)
  const f = new Func()
  let driver, extensionId
  const password = '123456789'
  const newPassword = {
    correct: 'abcDEF123!@#',
    short: '123',
    incorrect: '1234567890',
  }

  before(async function () {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      const extPath = path.resolve('dist/chrome')
      driver = await Func.buildChromeWebDriver(extPath)
      f.driver = driver
      extensionId = await f.getExtensionIdChrome()
      f.extensionId = extensionId
      await driver.get(`chrome-extension://${extensionId}/popup.html`)

    } else if (process.env.SELENIUM_BROWSER === 'firefox') {
      const extPath = path.resolve('dist/firefox')
      driver = await Func.buildFirefoxWebdriver()
      f.driver = driver
      await f.installWebExt(extPath)
      await f.delay(700)
      extensionId = await f.getExtensionIdFirefox()
      f.extensionId = extensionId
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

  describe('Setup', async () => {
    await setup(f)
  })

  describe('Log In', async () => {
    await login(f, password)
  })

  describe('Account Creation', async () => {
    await accountCreation(f, password)
  })

  describe('Connect Hardware Wallet', async () => {
    await connectHDWallet(f)
  })

  describe('Import Account', async () => {
    await importAccount(f)
  })

  describe('Import Contract account', async () => {
    await importContractAccount(f, account1, getCreatedAccounts)
  })

  describe('Delete Imported Account', async () => {
    await deleteImportedAccount(f)
  })

  describe('Sign Data', async () => {
    await signData(f)
  })

  describe('Export private key', async () => {
    await exportPrivateKey(f, password)
  })

  describe('Import Ganache seed phrase', async () => {
    await importGanacheSeedPhrase(f, account2, password)
  })

  describe('RSK network tests', async () => {
    await RSKNetworkTests(f, account1)
  })

  describe('Check the filter of emitted events', async () => {
    await checkEmittedEvents(f, account1, account2)
  })

  // todo: it works locally, but doesn't work in CI
  // describe('Add Token: Custom', async () => {
  //   await addCustomToken(f, account1, account2)
  // })

  describe('Change password', async () => {
    await changePassword(f, password, newPassword)
  })

  describe('Add Token:Search', async () => {
    await addTokeFromSearch(f)
  })

  describe('Custom Rpc', async () => {
    await customRPC(f)
  })
})


