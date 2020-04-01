const { By, Key } = require('selenium-webdriver')
const { withFixtures } = require('../helpers')

describe('MetaMask Browser Extension', function() {
  it('can send a simple transaction from one account to another', async function() {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x680031FFE9A0EE33CC25E4214E8793622F43088EC5E91638720C37B2708469B1',
          balance: 25000000000000000000,
        },
      ],
    }
    await withFixtures(
      { fixtures: 'imported-account', ganacheOptions },
      async ({ driver }) => {
        const passwordField = await driver.findElement(By.css('#password'))
        await passwordField.sendKeys('correct horse battery staple')
        await passwordField.sendKeys(Key.ENTER)
        await driver.clickElement(
          By.css('[data-testid="transaction-view-send"]')
        )
        const recipientAddressField = await driver.findElement(
          By.css('[data-testid="ens-input"]')
        )
        await recipientAddressField.sendKeys(
          '0x985c30949c92df7a0bd42e0f3e3d539ece98db24'
        )
        const amountField = await driver.findElement(
          By.css('.unit-input__input')
        )
        await amountField.sendKeys('1')
        await driver.clickElement(
          By.css('[data-testid="page-container-footer-next"]')
        )
        await driver.clickElement(
          By.css('[data-testid="page-container-footer-next"]')
        )
        await driver.findElement(By.css('.transaction-list-item'))
      }
    )
  })
})
