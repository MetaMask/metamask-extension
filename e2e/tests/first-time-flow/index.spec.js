const assert = require('assert')
const {withFixtures} = require('../../')

const SECURE_PASSWORD = 'correct horse battery staple'

describe('MetaMask Browser Extension first-time flow', function () {
  it('displays a welcome screen with a clickable continue button', async () => {
    await withFixtures(null, async ({driver}) => {
      await driver.clickElement('.welcome-page .first-time-flow__button')
    })
  })

  it('can on-board by creating a new wallet', async () => {
    await withFixtures(null, async ({driver}) => {
      // Step 0. Welcome!
      await driver.clickElement('.welcome-page .first-time-flow__button')

      // Step 1. Select "Create a Wallet"
      await driver.clickElementXPath(`//button[contains(text(), 'Create a Wallet')]`)

      // Step 2. Opt out of MetaMetrics
      await driver.clickElement('.btn-default')

      // Step 3. Enter a secure password
      const passwordBox = await driver.findElement('.first-time-flow__form #create-password')
      const passwordBoxConfirm = await driver.findElement('.first-time-flow__form #confirm-password')

      await passwordBox.sendKeys(SECURE_PASSWORD)
      await passwordBoxConfirm.sendKeys(SECURE_PASSWORD)
      await driver.clickElement('.first-time-flow__checkbox')
      await driver.clickElement('.first-time-flow__form button')

      // Step 4. Reveal the seed phrase
      await driver.clickElement('.reveal-seed-phrase__secret-blocker .reveal-seed-phrase__reveal-button')

      const seedPhrase = await driver.findElement('.reveal-seed-phrase__secret-words').getText()
      const words = seedPhrase.split(' ')

      assert.equal(words.length, 12)

      await driver.clickElement('button.first-time-flow__button')

      // Step 5. Retype the seed phrase for verification
      await Promise.all(words.map(async (word) => {
        await driver.clickElementXPath(`//div[contains(@class, 'confirm-seed-phrase__seed-word--shuffled') and not(contains(@class, 'confirm-seed-phrase__seed-word--selected')) and contains(text(), '${word}')]`)
      }))
      await driver.clickElementXPath(`//button[contains(text(), 'Confirm')]`)

      // Step 6. Success!
      await driver.clickElement('button.first-time-flow__button')
    })
  })
})
