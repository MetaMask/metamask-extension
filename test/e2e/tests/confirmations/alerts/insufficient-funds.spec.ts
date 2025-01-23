import FixtureBuilder from '../../../fixture-builder';
import {
  PRIVATE_KEY,
  convertETHToHexGwei,
  withFixtures,
  WINDOW_TITLES,
} from '../../../helpers';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import {
  TestSuiteArguments,
  openDAppWithContract,
} from '../transactions/shared';
import { Driver } from '../../../webdriver/driver';

describe('Alert for insufficient funds @no-mmi', function () {
  it('Shows an alert when the user tries to send a transaction with insufficient funds', async function () {
    const nftSmartContract = SMART_CONTRACTS.NFTS;
    const ganacheOptions = {
      accounts: [
        {
          secretKey: PRIVATE_KEY,
          balance: convertETHToHexGwei(0.0053), // Low balance only to create the contract and then trigger the alert for insufficient funds
        },
      ],
    };
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        smartContract: nftSmartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, contractRegistry }: TestSuiteArguments) => {
        await openDAppWithContract(driver, contractRegistry, nftSmartContract);

        await mintNft(driver);

        await verifyAlertForInsufficientBalance(driver);
      },
    );
  });
});

async function verifyAlertForInsufficientBalance(driver: Driver) {
  await driver.waitForSelector({
    css: '[data-testid="inline-alert"]',
    text: 'Alert',
  });
  await driver.clickElementSafe('.confirm-scroll-to-bottom__button');
  await driver.clickElement('[data-testid="inline-alert"]');

  await displayAlertForInsufficientBalance(driver);
  await driver.clickElement('[data-testid="alert-modal-button"]');
}

async function mintNft(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement(`#mintButton`);

  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
}

async function displayAlertForInsufficientBalance(driver: Driver) {
  await driver.waitForSelector({
    css: '[data-testid="alert-modal__selected-alert"]',
    text: 'You do not have enough ETH in your account to pay for network fees.',
  });
}
