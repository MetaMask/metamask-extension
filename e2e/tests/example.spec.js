const {withFixtures} = require('../')

describe('MetaMask Browser Extension first-time flow', function () {
  it('displays a welcome screen with a clickable continue button', async () => {
    await withFixtures(null, async ({driver}) => {
      const button = await driver.findElement('.welcome-page .first-time-flow__button')
      await button.click()
    })
  })
})

describe('MetaMask Browser Extension from existing state', function () {
  it('displays the lock screen', async () => {
    await withFixtures('onboarded', async ({driver}) => {
      const button = await driver.findElement('.unlock-page__title')
      await button.click()
    })
  })
})
