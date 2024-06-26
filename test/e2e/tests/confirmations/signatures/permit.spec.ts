import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import {
  scrollAndConfirmAndAssertConfirm,
  withRedesignConfirmationFixtures,
} from '../helpers';
import {
  DAPP_HOST_ADDRESS,
  WINDOW_TITLES,
  openDapp,
  switchToNotificationWindow,
  unlockWallet,
} from '../../../helpers';
import { Ganache } from '../../../seeder/ganache';
import { Driver } from '../../../webdriver/driver';

describe('Confirmation Signature - Permit', function (this: Suite) {
  if (!process.env.ENABLE_CONFIRMATION_REDESIGN) {
    return;
  }

  it('initiates and confirms', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer: Ganache;
      }) => {
        const addresses = await ganacheServer.getAccounts();
        const publicAddress = addresses?.[0] as string;

        await unlockWallet(driver);
        await openDapp(driver);
        await driver.clickElement('#signPermit');
        await switchToNotificationWindow(driver);

        await assertInfoValues(driver);
        await scrollAndConfirmAndAssertConfirm(driver);
        await assertVerifiedResults(driver, publicAddress);
      },
    );
  });

  it('initiates and rejects', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);
        await driver.clickElement('#signPermit');
        await switchToNotificationWindow(driver);

        await driver.clickElement(
          '[data-testid="confirm-footer-cancel-button"]',
        );

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const rejectionResult = await driver.waitForSelector({
          css: '#signPermitResult',
          text: 'Error: User rejected the request.',
        });
        assert.ok(rejectionResult);
      },
    );
  });
});

async function assertInfoValues(driver: Driver) {
  const origin = driver.findElement({ text: DAPP_HOST_ADDRESS });
  const contractPetName = driver.findElement({
    css: '.name__value',
    text: '0xCcCCc...ccccC',
  });

  const primaryType = driver.findElement({ text: 'Permit' });
  const owner = driver.findElement({ css: '.name__name', text: 'Account 1' });
  const spender = driver.findElement({
    css: '.name__value',
    text: '0x5B38D...eddC4',
  });
  const value = driver.findElement({ text: '3000' });
  const nonce = driver.findElement({ text: '0' });
  const deadline = driver.findElement({ text: '02 August 1971, 16:53' });

  assert.ok(await origin, 'origin');
  assert.ok(await contractPetName, 'contractPetName');
  assert.ok(await primaryType, 'primaryType');
  assert.ok(await owner, 'owner');
  assert.ok(await spender, 'spender');
  assert.ok(await value, 'value');
  assert.ok(await nonce, 'nonce');
  assert.ok(await deadline, 'deadline');
}

async function assertVerifiedResults(driver: Driver, publicAddress: string) {
  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#signPermitVerify');

  const verifyResult = await driver.findElement('#signPermitResult');
  const verifyResultR = await driver.findElement('#signPermitResultR');
  const verifyResultS = await driver.findElement('#signPermitResultS');
  const verifyResultV = await driver.findElement('#signPermitResultV');

  await driver.waitForSelector({
    css: '#signPermitVerifyResult',
    text: publicAddress,
  });
  const verifyRecoverAddress = await driver.findElement(
    '#signPermitVerifyResult',
  );

  assert.equal(
    await verifyResult.getText(),
    '0x0a396f89ee073214f7e055e700048abd7b4aba6ecca0352937d6a2ebb7176f2f43c63097ad7597632e34d6a801695702ba603d5872a33ee7d7562fcdb9e816ee1c',
  );
  assert.equal(
    await verifyResultR.getText(),
    'r: 0x0a396f89ee073214f7e055e700048abd7b4aba6ecca0352937d6a2ebb7176f2f',
  );
  assert.equal(
    await verifyResultS.getText(),
    's: 0x43c63097ad7597632e34d6a801695702ba603d5872a33ee7d7562fcdb9e816ee',
  );
  assert.equal(await verifyResultV.getText(), 'v: 28');
  assert.equal(await verifyRecoverAddress.getText(), publicAddress);
}
