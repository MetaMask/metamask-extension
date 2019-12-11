import assert from 'assert'

const {
  // setupFetchMocking,
  verboseReportOnFailure,
  prepareExtensionForTesting,
} = require('./helpers')

import { firstTimeFlow } from './lib/features/first-time-flow'
import { send } from './lib/features/send'
import { transactionDetail } from './view/index'

describe('Using MetaMask with an existing account', function () {
  let driver, page

  this.timeout(0)
  this.bail(true)

  before(async function () {
    const result = await prepareExtensionForTesting()
    driver = await result.driver
    const pages = await driver.pages()
    page = pages[0]
    // await setupFetchMocking(driver)
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
  })

  after(async function () {
    await driver.close()
  })

  describe('First time flow starting from an existing seed phrase', () => {
    it('goes through import wallet first time flow', async () => {
      await firstTimeFlow(page, 'import')
    })
  })

  describe('Send ETH from inside MetaMask', () => {
    it('send with edit gas price and limit', async () => {
      const opts = {
        address: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        gasOption: 'Advanced',
        amount: '1',
        gasPrice: '10',
        gasLimit: '25000',
        editTx: true,
      }
      await send(page, opts)
    })
  })

  describe('Transaction List', () => {
    it('finds the transaction in the transactions list', async () => {
      assert.equal(await transactionDetail(page, 'amount'), '-2.2 ETH', 'Should have editted the tx')
    })
  })
})
