import { logout } from '../features/logout-login'

export default async function importSeedPhrase (page, seed, password = 'correct horse battery staple') {
  await logout(page)

  // Click Import Using Account Seed Phrase
  await page.click('.unlock-page__link--import')
  await page.waitFor('.import-account')

  // Type Seed Phrase
  await page.type('textarea.import-account__secret-phrase', seed)

  // Type Vault Password
  await page.type('.first-time-flow__input #password', password)
  await page.type('.first-time-flow__input #confirm-password', password)

  // Click Restore Button
  const restore = `//button[contains(text(), 'Restore')]`
  const restoreButton = await page.$x(restore)
  await restoreButton[0].click()

  await page.waitFor('.account-and-transaction-details')
}
