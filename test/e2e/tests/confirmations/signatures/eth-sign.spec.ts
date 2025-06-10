import { Suite } from 'mocha';
import { openDapp, unlockWallet } from '../../../helpers';
import { withSignatureFixtures } from '../helpers';
import { TestSuiteArguments } from '../transactions/shared';
import TestDapp from '../../../page-objects/pages/test-dapp';

describe('Eth sign', function (this: Suite) {
  it('will throw method not found error', async function () {
    await withSignatureFixtures(
      this.test?.fullTitle(),
      async ({ driver }: TestSuiteArguments) => {
        await unlockWallet(driver);
        await openDapp(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.clickEthSignButton();
        await driver.delay(1000);
        await testDapp.verifyEthSignErrorMessage();
      },
    );
  });
});
