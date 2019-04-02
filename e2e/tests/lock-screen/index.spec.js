const {withFixtures} = require('../../')

describe('MetaMask Browser Extension from existing state', function () {
  it('displays the lock screen', async () => {
    await withFixtures('onboarded', async ({driver}) => {
      await driver.clickElement('.unlock-page__title')
    })
  })
})
