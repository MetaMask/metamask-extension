import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { withRedesignConfirmationFixtures } from '../helper-fixture';
import {
  DAPP_URL_WITHOUT_SCHEMA,
  WINDOW_TITLES,
  openDapp,
  unlockWallet,
} from '../../../helpers';
import { Ganache } from '../../../seeder/ganache';
import { Driver } from '../../../webdriver/driver';

describe('Confirmation Signature - Sign Typed Data V4', function (this: Suite) {
  if (!process.env.ENABLE_CONFIRMATION_REDESIGN) {
    return;
  }

  it('initiates and confirms', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      async ({ driver, ganacheServer }: { driver: Driver, ganacheServer: Ganache }) => {
        const addresses = await ganacheServer.getAccounts();
        const publicAddress = addresses?.[0] as string;

        await unlockWallet(driver);
        await openDapp(driver);
        await driver.clickElement('#signTypedDataV4');

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog
        );

        const origin = driver.findElement({
          text: DAPP_URL_WITHOUT_SCHEMA,
        });
        const contractPetName = driver.findElement({
          css: '.name__value',
          text: '0xCcCCc...ccccC',
        });

        const primaryType = driver.findElement({ text: 'Mail' });
        const contents = driver.findElement({ text: 'Hello, Bob!' });

        const fromName = driver.findElement({ text: 'Cow' });
        const fromAddressNum0 = driver.findElement({ css: '.name__value', text: '0xCD2a3...DD826' });
        const toName = driver.findElement({ text: 'Bob' });
        const toAddressNum2 = driver.findElement({ css: '.name__value', text: '0xB0B0b...00000' });
        const attachment = driver.findElement({ text: '0x' });

        assert.ok(await origin, 'origin');
        assert.ok(await contractPetName, 'contractPetName');

        assert.ok(await primaryType, 'primaryType');
        assert.ok(await contents, 'contents');
        assert.ok(await fromName, 'fromName');
        assert.ok(await fromAddressNum0, 'fromAddressNum0');
        assert.ok(await toName, 'toName');
        assert.ok(await toAddressNum2, 'toAddressNum2');
        assert.ok(await attachment, 'attachment');

        await driver.clickElement('[data-testid="confirm-footer-button"]');

        await assertVerifiedResults(driver, publicAddress);
      },
    );
  });
});

async function assertVerifiedResults(driver: Driver, publicAddress: string) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#signTypedDataV4Verify');

  const verifyResult = await driver.findElement(
    '#signTypedDataV4Result',
  );
  await driver.waitForSelector({
    css: '#signTypedDataV4VerifyResult',
    text: publicAddress,
  });
  const verifyRecoverAddress = await driver.findElement(
    '#signTypedDataV4VerifyResult',
  );

  assert.equal(await verifyResult.getText(), '0x089bfbf84d16c9b7a48c3d768e200e8b84e651bf4efb6c444ad2c89aa311859f1c4c637982939ec69fe8519214257d5bbb2e2ae0b8e9644a4008412863a2e0ae1b');
  assert.equal(await verifyRecoverAddress.getText(), publicAddress);
}
