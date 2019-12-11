import { clickByText } from '../../lib/helpers'
import { openAccountMenu } from '../index'

const {
  createAccount,
  importAccount,
  connectHardwareWallet,
  infoHelp,
  settings,
  create,
} = require('../../../../app/_locales/en/messages.json')

module.exports = {
  account,
  accountName,
  accountBalance,
  addAccount,
  clickImportAccount,
  clickConnectHDWallet,
  clickInfo,
  clickSettings,
  switchAccount,
}

async function account (page, index) {
  const accountSelector = '.account-menu__account.menu__item--clickable'
  const accounts = await page.$x(accountSelector)
  return accounts[index]
}

async function accountName (page, account) {
  const accountName = '.account-menu__name'
  const name = page.$(account)
  return await name.$eval(accountName, el => el.innerText())
}

async function accountBalance (page, account) {
  const accountBalance = '.account-menu__balance'
  const balance = page.$(account)
  return await balance.$eval(accountBalance, el => el.innerText())
}

async function addAccount (page, accountName) {
  // Click Account Menu Icon
  await openAccountMenu()

  // Click Create Account Button
  await clickByText(page, createAccount.message)

  if (accountName) {
    // Set Account Name
    await page.waitFor('.new-account')
    await page.type('.new-account-create-form input', accountName)
  }

  // Create
  await clickByText(page, create.message)
}

async function switchAccount (page, accountName) {
  await openAccountMenu(page)
  await clickByText(page, accountName)
}

async function clickImportAccount (page) {
  await openAccountMenu(page)
  await clickByText(page, importAccount.message)
}

async function clickConnectHDWallet (page) {
  await openAccountMenu(page)
  await clickByText(page, connectHardwareWallet.message)
}

async function clickInfo (page) {
  await openAccountMenu(page)
  await clickByText(page, infoHelp.message)
}

async function clickSettings (page) {
  await clickByText(page, settings.message)
}
