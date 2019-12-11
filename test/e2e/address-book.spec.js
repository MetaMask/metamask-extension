import assert from 'assert'

const {
  // setupFetchMocking
  prepareExtensionForTesting,
  verboseReportOnFailure,
} = require('./helpers')

import { firstTimeFlow } from './lib/features/first-time-flow'
import { logout, login } from './lib/features/logout-login'
import importSeedPhrase from './lib/features/import-seed'
import { send } from './lib/features/send'
import { transactionList, transactionDetail } from './view/index'


describe('MetaMask', function () {
  let driver, page

  const testSeedPhrase = 'forum vessel pink push lonely enact gentle tail admit parrot grunt dress'

  this.timeout(0)
  this.bail(true)

  before(async function () {
    const result = await prepareExtensionForTesting()
    driver = await result.driver
    // await setupFetchMocking(driver) TODO: Find alternative Puppeteer implementation
    const pages = await driver.pages()
    page = pages[0]
  })

  afterEach(async function () {
    // if (process.env.SELENIUM_BROWSER === 'chrome') {
    //   const errors = await checkBrowserForConsoleErrors(driver)
    //   if (errors.length) {
    //     const errorReports = errors.map(err => err.message)
    //     const errorMessage = `Errors found in browser console:\n${errorReports.join('\n')}`
    //     console.error(new Error(errorMessage))
    //   }
    // }
    if (this.currentTest.state === 'failed') {
      await verboseReportOnFailure(page, this.currentTest)
    }

    // TODO: checkBrowserForConsoleErrors find alternative to driver.manage().logs()
    // https://github.com/GoogleChrome/puppeteer/blob/v1.20.0/docs/api.md#class-consolemessage
  })

  after(async function () {
    await driver.close()
  })

  describe('Going through the first time flow', () => {
    it('', async () => {
      await firstTimeFlow(page, 'create')

    })
  })

  describe('Log Out and Log In', () => {
    it('logout', async () => {
      await logout(page)
    })

    it('login', async () => {
      await login(page)
    })
  })


  describe('Import seed phrase', () => {
    it('', async () => {
      await importSeedPhrase(page, testSeedPhrase)
    })
  })


  describe('Adds an entry to the address book and sends eth to that address', () => {
    it('', async () => {

      const opts = {
        address: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        amount: '1',
        gasOption: 'Average',
        addToaddressBook: true,
      }

      await send(page, opts)
    })

    it('finds the transaction in the transaction list', async () => {
      const txList = await transactionList(page)
      assert.equal(txList.length, 1)
    })

    it('transaction amount', async () => {
      assert.equal(await transactionDetail(page, 'amount'), '-1 ETH')
    })
  })

  describe('Sends to an address book entry', () => {
    it('starts a send transaction by clicking address book entry', async () => {
      const opts = {
        amount: '1',
        addressBook: true,
        gasOption: 'Average',
      }

      await send(page, opts)
    })
  })
})
