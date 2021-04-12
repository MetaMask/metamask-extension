const { withFixtures } = require('../helpers');

describe('Simple send', function () {
  it('can send a simple transaction from one account to another', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: 25000000000000000000,
        },
      ],
    };
    await withFixtures(
      { fixtures: 'imported-account', ganacheOptions, title: this.test.title },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        await driver.clickElement('[data-testid="eth-overview-send"]');
        await driver.fill(
          '[data-testid="ens-input"]',
          '0x985c30949c92df7a0bd42e0f3e3d539ece98db24',
        );
        await driver.fill('.unit-input__input', '1');
        await driver.clickElement('[data-testid="page-container-footer-next"]');
        await driver.clickElement('[data-testid="page-container-footer-next"]');
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.findElement('.transaction-list-item');
      },
    );
  });
});
