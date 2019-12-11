import { clickByText } from '../../lib/helpers'

const {
  exportPrivKey,
} = require('../../../../app/_locales/en/messages.json')

module.exports = {
  exportPriVkey,
}

async function exportPriVkey (page, password) {
  await page.waitFor('.wallet-view')
  const accountDetails = '.account-details__details-button'

  await page.click(accountDetails)
  await page.waitFor('.account-modal-container')

  await clickByText(page, exportPrivKey.message)

  const passwordInput = '.private-key-password-input'
  await page.waitFor(password)

  await page.type(passwordInput, password)

  const exportConfirm = '.export-private-key__button'
  await page.click(exportConfirm)

  await page.waitFor('.private-key-password-display-textarea')
}
