/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { MockttpServer } from 'mockttp';
import { WINDOW_TITLES } from '../../../constants';
import { withFixtures } from '../../../helpers';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { Driver } from '../../../webdriver/driver';
import { scrollAndConfirmAndAssertConfirm } from '../helpers';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import TestDapp from '../../../page-objects/pages/test-dapp';
import {
  assertChangedSpendingCap,
  editSpendingCap,
  mocked4BytesApprove,
  TestSuiteArguments,
} from './shared';

describe('Confirmation Redesign ERC20 Revoke Allowance', function () {
  const smartContract = SMART_CONTRACTS.HST;

  describe('Submit an revoke transaction', function () {
    it('submits an ERC20 revoke allowance transaction', async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilderV2()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          smartContract,
          testSpecificMock: mocks,
          title: this.test?.fullTitle(),
        },
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          const contractAddress =
            await contractRegistry?.getContractAddress(smartContract);

          await loginWithBalanceValidation(driver, localNodes?.[0]);
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage({ contractAddress });
          await testDapp.checkPageIsLoaded();

          await createERC20ApproveTransaction(driver);

          const NEW_SPENDING_CAP = '0';
          await editSpendingCap(driver, NEW_SPENDING_CAP);

          await driver.waitForSelector({
            css: 'h2',
            text: 'Remove permission',
          });

          await scrollAndConfirmAndAssertConfirm(driver);

          await assertChangedSpendingCap(driver, NEW_SPENDING_CAP);
        },
      );
    });
  });
});

async function mocks(server: MockttpServer) {
  return [await mocked4BytesApprove(server)];
}

async function createERC20ApproveTransaction(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#approveTokens');
}
