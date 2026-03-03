import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../../helpers';
import { Mockttp } from '../../../mock-e2e';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import TestDapp from '../../../page-objects/pages/test-dapp';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import { scrollAndConfirmAndAssertConfirm } from '../helpers';
import {
  assertChangedSpendingCap,
  editSpendingCap,
  mocked4BytesIncreaseAllowance,
  TestSuiteArguments,
} from './shared';

describe('Confirmation Redesign ERC20 Increase Allowance', function () {
  describe('Submit an increase allowance transaction', function () {
    it('submits an increase allowance transaction with a small spending cap', async function () {
      await withFixtures(
        generateFixtureOptions(this),
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          const contractAddress = await contractRegistry?.getContractAddress(
            SMART_CONTRACTS.HST,
          );
          await loginWithBalanceValidation(driver, localNodes?.[0]);
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage({ contractAddress });
          await testDapp.checkPageIsLoaded();

          await testDapp.clickERC20IncreaseAllowanceButton();
          const newSpendingCap = '3';
          await editSpendingCap(driver, newSpendingCap);
          await scrollAndConfirmAndAssertConfirm(driver);
          await assertChangedSpendingCap(driver, newSpendingCap);
        },
      );
    });

    it('submits an increase allowance transaction with a large spending cap', async function () {
      await withFixtures(
        generateFixtureOptions(this),
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          const contractAddress = await contractRegistry?.getContractAddress(
            SMART_CONTRACTS.HST,
          );
          await loginWithBalanceValidation(driver, localNodes?.[0]);
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage({ contractAddress });
          await testDapp.checkPageIsLoaded();

          await testDapp.clickERC20IncreaseAllowanceButton();
          const newSpendingCap = '3000';
          await editSpendingCap(driver, newSpendingCap);
          await scrollAndConfirmAndAssertConfirm(driver);
          await assertChangedSpendingCap(driver, newSpendingCap);
        },
      );
    });
  });
});

function generateFixtureOptions(mochaContext: Mocha.Context) {
  return {
    dappOptions: { numberOfTestDapps: 1 },
    fixtures: new FixtureBuilderV2()
      .withPermissionControllerConnectedToTestDapp()
      .build(),
    smartContract: SMART_CONTRACTS.HST,
    testSpecificMock: mocks,
    title: mochaContext.test?.fullTitle(),
  };
}

async function mocks(server: Mockttp) {
  return [await mocked4BytesIncreaseAllowance(server)];
}
