const {
  convertToHexValue,
  withFixtures,
  openDapp,
  locateAccountBalanceDOM,
} = require('../helpers');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');
const FixtureBuilder = require('../fixture-builder');

describe('Deploy contract and call contract methods', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  const smartContract = SMART_CONTRACTS.PIGGYBANK;
  it('should display the correct account balance after contract interactions', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        smartContract,
        title: this.test.title,
      },
      async ({ driver, contractRegistry, ganacheServer }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // deploy contract
        await openDapp(driver, contractAddress);

        // wait for deployed contract, calls and confirms a contract method where ETH is sent
        await driver.findClickableElement('#deployButton');
        await driver.clickElement('#depositButton');
        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        const dapp = await driver.switchToWindowWithTitle(
          'E2E Test Dapp',
          windowHandles,
        );

        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.waitForSelector({
          css: '.confirm-page-container-summary__action__name',
          text: 'Deposit',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);
        await driver.clickElement({ text: 'Activity', tag: 'button' });
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(1)',
        );
        await driver.waitForSelector({
          css: '.transaction-list-item__primary-currency',
          text: '-4 ETH',
        });

        // calls and confirms a contract method where ETH is received
        await driver.switchToWindow(dapp);
        await driver.clickElement('#withdrawButton');
        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(2)',
        );
        await driver.waitForSelector({
          css: '.transaction-list-item__primary-currency',
          text: '-0 ETH',
        });

        // renders the correct ETH balance
        await driver.switchToWindow(extension);
        await locateAccountBalanceDOM(driver, ganacheServer);
      },
    );
  });
});
