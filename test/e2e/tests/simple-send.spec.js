const { By, Key } = require('selenium-webdriver')
const { withFixtures } = require('../helpers')
// use sleep to debug
// const sleep = require('sleep-promise')

describe('MetaMask Browser Extension', function() {
  it('can send a simple transaction from one account to another', async function() {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x6FDFA72C7DB5CF9CFF1563264EC84429BF34F133CDA285C8358FA5BAC0EB63F4',
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
          'net2999:aapf2peyxwkr88un4u1a8tv7mstp7gg5euf00turfa'
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
