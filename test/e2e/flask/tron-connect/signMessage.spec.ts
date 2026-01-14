import { withTronAccountSnap } from './common-tron';
import { TestDappTron } from '../../page-objects/pages/test-dapp-tron';
import { DEFAULT_TRON_ADDRESS, WINDOW_TITLES } from '../../constants';
import {
  DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS,
  connectTronTestDapp,
  clickConfirmButton,
  assertSignedMessageIsValid
} from './testHelpers';
import { veryLargeDelayMs } from '../../helpers';

describe('Tron Connect - Sign Message - e2e tests', function () {
  describe(`Tron Connect - Sign Message`, function () {
    it('Should be able to sign a message', async function () {
      await withTronAccountSnap(
        {
          ...DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
        const messageToSign = 'Hello, world!';
        const testDappTron = new TestDappTron(driver);

        await testDappTron.openTestDappPage();
        await testDappTron.checkPageIsLoaded();
        await testDappTron.switchTo();

        // 1. Connect
        await connectTronTestDapp(driver, testDappTron);

        const signMessageTest = await testDappTron.getSignMessageTest();
        await signMessageTest.setMessage(messageToSign);

        // 2. Sign message
        await signMessageTest.signMessage();

        await driver.delay(veryLargeDelayMs);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await clickConfirmButton(driver);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TronTestDApp);

        const signedMessage = await signMessageTest.getSignedMessage();

        // 3. Verify signed message
        await assertSignedMessageIsValid({
          signature: signedMessage[0],
          originalMessageString: messageToSign,
          addressBase58: DEFAULT_TRON_ADDRESS,
        });
      });
    });
  })
});
