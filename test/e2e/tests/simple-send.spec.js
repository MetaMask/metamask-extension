const {
  convertToHexValue,
  withFixtures,
  sendTransaction,
  logInWithBalanceValidation,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Simple send', function () {
  it('can send a simple transaction from one account to another', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);

        await sendTransaction(
          driver,
          '0x985c30949c92df7a0bd42e0f3e3d539ece98db24',
          '1',
        );
      },
    );
  });
});
