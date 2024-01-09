const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  WALLET_PASSWORD,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const ConfirmTxPage = require('../page-objects/confirm-tx.page');
const HomePage = require('../page-objects/home.page');
const SendToPage = require('../page-objects/send-to.page');
const SendAmountPage = require('../page-objects/send-amount.page');
const unlockWallet = require('../processes/unlock-wallet');

describe('Simple send', function () {
  it('can send a simple transaction from one account to another', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        // Process
        await unlockWallet(driver, WALLET_PASSWORD);

        // Page Objects and Components
        const confirmTxPage = new ConfirmTxPage(driver);
        const homePage = new HomePage(driver);
        const sendAmountPage = new SendAmountPage(driver);
        const sendToPage = new SendToPage(driver);

        // Actions and Assertions
        await homePage.startSendFlow();
        await sendToPage.addRecipient(
          '0x985c30949c92df7a0bd42e0f3e3d539ece98db24',
        );
        await sendAmountPage.addAmount('1');
        await sendAmountPage.goToNextScreen();
        await confirmTxPage.confirmTx();
        await homePage.goToActivityList();

        const confirmedTx = await homePage.isConfirmedTxInActivity();
        assert.equal(confirmedTx, true, 'Confirmed tx is not found');
      },
    );
  });
});
