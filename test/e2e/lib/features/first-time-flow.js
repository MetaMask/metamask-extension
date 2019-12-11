const {
  createAWallet,
  createPassword,
  confirmSecretBackupPhrase,
  importWallet,
  importAccountSeedPhrase,
  congratulations,
} = require('../../../../app/_locales/en/messages.json')

module.exports = {
  firstTimeFlow,
  confirmSeedPhase,
}

async function firstTimeFlow (page, path, skipChallenge = false) {

  const password = 'correct horse battery staple'

  // Welcome Screen
  await page.waitFor('.first-time-flow')
  await page.click('.first-time-flow__button')

  switch (path) {

    case 'create':

      // Create Wallet Path
      const createWalletXPath = `//button[contains(text(), '${createAWallet.message}')]`
      await page.waitForXPath(createWalletXPath)
      const createWalletButton = await page.$x(createWalletXPath)
      await createWalletButton[0].click()

      // MetaMetrics
      await page.waitFor('.metametrics-opt-in')
      await page.click('button.btn-default.btn--large.page-container__footer-button')

      // Create New Account Password
      const createPasswordElement = `//div[contains(text(), '${createPassword.message}')]`
      await page.waitForXPath(createPasswordElement)

      await page.type('.first-time-flow__form #create-password', password)
      await page.type('.first-time-flow__form #confirm-password', password)

      await page.click('.first-time-flow__checkbox') // TOS Checkbox
      await page.click('.first-time-flow__form button')

      await confirmSeedPhase(page, skipChallenge)
      break

    case 'import':

      // Import Account Path
      const importWalletXPath = `//button[contains(text(), '${importWallet.message}')]`
      await page.waitForXPath(importWalletXPath)
      const importWalletButton = await page.$x(importWalletXPath)
      await importWalletButton[0].click()

      // MetaMetrics
      await page.waitFor('.metametrics-opt-in')
      await page.click('button.btn-default.btn--large.page-container__footer-button')

      // Import Account Details
      const importAccount = `//div[contains(text(), '${importAccountSeedPhrase.message}')]`
      await page.waitForXPath(importAccount)

      const testSeedPhrase = 'forum vessel pink push lonely enact gentle tail admit parrot grunt dress'
      await page.type('textarea.first-time-flow__textarea', testSeedPhrase)

      await page.type('.first-time-flow__form #password', password)
      await page.type('.first-time-flow__form #confirm-password', password)

      await page.click('.first-time-flow__checkbox') // TOS Checkbox
      await page.click('.first-time-flow__form button')

      await page.click('button.first-time-flow__button')

      // Success Screen
      await page.waitForXPath(`//div[contains(text(), '${congratulations.message}')]`)
      await page.click('button.first-time-flow__button')
      break

    default:
      throw new Error(`Select either 'import' or 'create' path for first time flow`)

  }

}

async function clickWord (page, word) {
  const xpath = `//div[contains(@class, 'confirm-seed-phrase__seed-word--shuffled') and not(contains(@class, 'confirm-seed-phrase__seed-word--selected')) and contains(text(), '${word}')]`

  const wordButton = await page.$x(xpath)
  await wordButton[0].click('button.first-time-flow__button')
}

async function confirmSeedPhase (page, skipChallenge) {
  // Reveal Seed Phrase
  const seedPhraseBlocker = '.reveal-seed-phrase__secret-blocker'
  await page.waitFor(seedPhraseBlocker)
  await page.click(seedPhraseBlocker)

  const seedPhrase = await page.evaluate(() => document.querySelector('.reveal-seed-phrase__secret').innerText)

  if (skipChallenge) {
    const remindMeLater = 'button.btn-secondary.first-time-flow__button'
    await page.click(remindMeLater)
  } else {

    const nextScreen = 'button.btn-primary.first-time-flow__button'
    await page.click(nextScreen)

    // Confirm Seed Phrase
    const confirmSeedPhrase = `//div[contains(text(), '${confirmSecretBackupPhrase.message}')]`
    await page.waitForXPath(confirmSeedPhrase)

    // Seed Phrase Challenge
    const words = seedPhrase.split(' ')
    for (const word of words) {
      await clickWord(page, word)
    }

    await page.click('button.first-time-flow__button')

    // Success Screen
    await page.waitForXPath(`//div[contains(text(), '${congratulations.message}')]`)
    await page.click('button.first-time-flow__button')
}
}