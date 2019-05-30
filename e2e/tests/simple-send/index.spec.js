const {Key} = require('selenium-webdriver')
const {withFixtures} = require('../../')

describe('MetaMask Browser Extension', function () {
  it('can send a simple transaction from one account to another', async () => {
    await withFixtures('simple-send', async ({driver}) => {
      await driver.findElement('#password').sendKeys('password')
      await driver.findElement('#password').sendKeys(Key.ENTER)
      await driver.clickElement('#app-content > div > div.main-container-wrapper > div > div > div.transaction-view > div.transaction-view__balance-wrapper > div > div.transaction-view-balance__buttons > button:nth-child(2)')
      await driver.findElement('input[placeholder="Recipient Address"]').sendKeys('0x985c30949c92df7a0bd42e0f3e3d539ece98db24')
      await driver.findElement('.unit-input__input').sendKeys('1')
      await driver.delay(1000)
      await driver.clickElement('#app-content > div > div.main-container-wrapper > div > div.page-container__footer > header > button.button.btn-primary.btn--large.page-container__footer-button')
      await driver.clickElement('#app-content > div > div.main-container-wrapper > div > div.page-container__footer > header > button.button.btn-confirm.btn--large.page-container__footer-button')
      await driver.findElement('.transaction-list-item')
    })
  })
})
