import { TestDappTron } from '../../page-objects/pages/test-dapp-tron';
import { WINDOW_TITLES } from '../../constants';
import { connectTronTestDapp } from '../../page-objects/flows/tron-dapp.flow';
import SnapSignMessageConfirmation from '../../page-objects/pages/confirmations/snap-sign-message-confirmation';
import { DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS } from './testHelpers';
import { withTronAccountSnap, DEFAULT_MESSAGE_SIGNATURE } from './common-tron';

describe('Tron Connect - Sign Message - e2e tests', function () {
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

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const signMessageConfiramtion = new SnapSignMessageConfirmation(driver);
        await signMessageConfiramtion.checkPageIsLoaded();
        await signMessageConfiramtion.clickFooterConfirmButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TronTestDApp);

        await signMessageTest.findSignedMessage(DEFAULT_MESSAGE_SIGNATURE);
      },
    );
  });
});
