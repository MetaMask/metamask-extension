import FixtureBuilder from '../../../fixture-builder';
import { WINDOW_TITLES, withFixtures } from '../../../helpers';
import { Mockttp } from '../../../mock-e2e';
import { Anvil } from '../../../seeder/anvil';
import ContractAddressRegistry from '../../../seeder/contract-address-registry';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import { Driver } from '../../../webdriver/driver';
import { scrollAndConfirmAndAssertConfirm } from '../helpers';
import {
  assertChangedSpendingCap,
  editSpendingCap,
  mocked4BytesIncreaseAllowance,
  openDAppWithContract,
  TestSuiteArguments,
} from './shared';

describe('Confirmation Redesign ERC20 Increase Allowance', function () {
  describe('Submit an increase allowance transaction', function () {
    it('Sends a type 0 transaction (Legacy) with a small spending cap', async function () {
      await withFixtures(
        generateFixtureOptionsForLegacyTx(this),
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await createAndAssertIncreaseAllowanceSubmission(
            driver,
            '3',
            contractRegistry,
          );
        },
      );
    });

    it('Sends a type 2 transaction (EIP1559) with a small spending cap', async function () {
      await withFixtures(
        generateFixtureOptionsForEIP1559Tx(this),
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          await createAndAssertIncreaseAllowanceSubmission(
            driver,
            '3',
            contractRegistry,
            localNodes,
          );
        },
      );
    });

    it('Sends a type 0 transaction (Legacy) with a large spending cap', async function () {
      await withFixtures(
        generateFixtureOptionsForLegacyTx(this),
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          await createAndAssertIncreaseAllowanceSubmission(
            driver,
            '3000',
            contractRegistry,
            localNodes,
          );
        },
      );
    });

    it('Sends a type 2 transaction (EIP1559) with a large spending cap', async function () {
      await withFixtures(
        generateFixtureOptionsForEIP1559Tx(this),
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          await createAndAssertIncreaseAllowanceSubmission(
            driver,
            '3000',
            contractRegistry,
            localNodes,
          );
        },
      );
    });
  });
});

function generateFixtureOptionsForLegacyTx(mochaContext: Mocha.Context) {
  return {
    dapp: true,
    fixtures: new FixtureBuilder()
      .withPermissionControllerConnectedToTestDapp()
      .build(),
    localNodeOptions: {
      hardfork: 'muirGlacier',
    },
    smartContract: SMART_CONTRACTS.HST,
    testSpecificMock: mocks,
    title: mochaContext.test?.fullTitle(),
  };
}

function generateFixtureOptionsForEIP1559Tx(mochaContext: Mocha.Context) {
  return {
    dapp: true,
    fixtures: new FixtureBuilder()
      .withPermissionControllerConnectedToTestDapp()
      .build(),
    smartContract: SMART_CONTRACTS.HST,
    testSpecificMock: mocks,
    title: mochaContext.test?.fullTitle(),
  };
}

async function createAndAssertIncreaseAllowanceSubmission(
  driver: Driver,
  newSpendingCap: string,
  contractRegistry?: ContractAddressRegistry,
  localNodes?: Anvil[],
) {
  await openDAppWithContract(
    driver,
    contractRegistry,
    SMART_CONTRACTS.HST,
    localNodes?.[0],
  );

  await createERC20IncreaseAllowanceTransaction(driver);

  await editSpendingCap(driver, newSpendingCap);

  await scrollAndConfirmAndAssertConfirm(driver);

  await assertChangedSpendingCap(driver, newSpendingCap);
}

async function mocks(server: Mockttp) {
  return [await mocked4BytesIncreaseAllowance(server)];
}

async function createERC20IncreaseAllowanceTransaction(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#increaseTokenAllowance');
}
