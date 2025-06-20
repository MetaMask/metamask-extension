import { Suite } from 'mocha';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import { withSignatureFixtures } from '../helpers';
import { TestSuiteArguments } from '../transactions/shared';
import TestDapp from '../../../page-objects/pages/test-dapp';

describe('Eth sign', function (this: Suite) {
  it('will throw method not found error', async function () {
    await withSignatureFixtures(
      this.test?.fullTitle(),
      async ({ driver }: TestSuiteArguments) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();
        await testDapp.clickEthSignButton();
        await testDapp.check_ethSignErrorMessage();
      },
    );
  });
});
