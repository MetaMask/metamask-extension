import assert from 'assert'

const {
  verboseReportOnFailure,
  // setupFetchMocking,
  prepareExtensionForTesting,
} = require('./helpers')

import { firstTimeFlow, confirmSeedPhase } from './lib/features/first-time-flow'
import accountInfo from './lib/features/account-info'
import { balanceChecker, clickByText } from './lib/helpers'

const {
  backupNow,
} = require('../../app/_locales/en/messages.json')

describe('MetaMask', function () {
  let driver, page, dapp
  let publicAddress

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

  describe('First time flow skipping seed phrase challenge', () => {
    it('creates account in first time flow', async () => {
      const skipChallenge = true
      await firstTimeFlow(page, 'create', skipChallenge)
    })

    it('gets account address', async () => {
      await accountInfo(page)
      publicAddress = await page.$eval('.qr-ellip-address', el => el.value)
      await page.waitFor(500)
      await page.$eval('.account-modal-close', el => el.click())
    })
  })

  describe('Dapp Context', () => {
    it('switches to a dapp', async () => {
      dapp = await driver.newPage()
      await dapp.goto('localhost:8080')
      await dapp.waitFor('#address')
    })

    it('sends eth to the current account', async () => {
      await dapp.type('#address', publicAddress)
      await dapp.click('#send')
    })
  })

  describe('MetaMask Context', () => {
    it('switches back to MetaMask', async () => {
      await page.bringToFront()
    })

    it('checks balance', async () => {
      const expectedBalance = '1 ETH'
      const selector = '.currency-display-component.token-amount'
      // Wait to receive
      await page.waitFor(5000)
      await balanceChecker(page, selector, expectedBalance)
    })

    it('click back up message from notification modal', async () => {
      await clickByText(page, backupNow.message)
    })

    it('reveal and confirm seed phrase challenge', async () => {
      await confirmSeedPhase(page)
    })

    it('backup notification is not rendered again', async () => {
      const element = await page.$$('.backup-notification')
      assert.equal(element.length, 0)
    })

  })
})
