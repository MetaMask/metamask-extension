import { Suite } from 'mocha';
import { Driver } from '../webdriver/driver';
import { withFixtures } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { TestSnaps } from '../page-objects/pages/test-snaps';

describe('Test Snap getEntropy', function (this: Suite) {
  it('can use snap_getEntropy inside a snap', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withKeyringControllerMultiSRP().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);

        // Navigate to `test-snaps` page, and install the Snap.
        await testSnaps.openPage();
        await testSnaps.installSnap('#connectGetEntropySnap', false);

        await testSnaps.pasteIntoField('#entropyMessage', '1234');
        await testSnaps.clickButton('#signEntropyMessage');

        await testSnaps.approveDialog();

        // check the results of the message signature using waitForSelector
        await driver.waitForSelector({
          css: '#entropySignResult',
          text: '"0x9341785782b512c86235612365f1076b16731ed9473beb4d0804c30b7fcc3a055aa7103b02dc64014d923220712dfbef023ddcf6327b313ea2dfd4d83dc5a53e1c5e7f4e10bce49830eded302294054df8a7a46e5b6cb3e50eec564ecba17941"',
        });

        // Select a different entropy source.
        await testSnaps.selectEntropySource('get-entropy', 'SRP 1 (primary)');

        // Sign a message with the new entropy source.
        await testSnaps.pasteIntoField('#entropyMessage', '5678');
        await testSnaps.clickButton('#signEntropyMessage');

        await testSnaps.approveDialog();

        // Check the results of the message signature using `waitForSelector`.
        await driver.waitForSelector({
          css: '#entropySignResult',
          text: '"0xadd276f9d715223dcd20a595acb475f9b7353c451a57af64efb23633280c21aa172bd6689c27a0ac3c003ec4469b093207db956a6bf76689b3cc0b710c4187d5fcdca5f09c9594f146c9a39461e2f6cb03a446f4e62bd341a448ca9a33e96cf2"',
        });

        // Select a different entropy source and sign a message.
        await testSnaps.selectEntropySource('get-entropy', 'SRP 2');
        await testSnaps.clickButton('#signEntropyMessage');

        await testSnaps.approveDialog();

        // Check the results of the message signature using `waitForSelector`.
        await driver.waitForSelector({
          css: '#entropySignResult',
          text: '"0xa1dba3ddefabb56c5d6d37135fd07752662b5d720c005d619c0ff49eede2fe6f92a3e88e70ff4bb706b9ec2a076925ec159e3f6aa7170d51e428ccafe2353dd858da425c075912f0cd78c750942afef230393dff20d9fb58de14c56a5cd213b1"',
        });

        // Select a different entropy source and sign a message.
        await testSnaps.selectEntropySource('get-entropy', 'Invalid');
        await testSnaps.clickButton('#signEntropyMessage');

        await testSnaps.approveDialog();

        // Check the error message and close the alert.
        await driver.waitForAlert(
          'Entropy source with ID "invalid" not found.',
        );
        await driver.closeAlertPopup();
      },
    );
  });
});
