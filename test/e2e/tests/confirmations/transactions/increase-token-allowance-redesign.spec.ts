import FixtureBuilder from '../../../fixture-builder';
import {
  defaultGanacheOptions,
  defaultGanacheOptionsForType2Transactions,
  largeDelayMs,
  veryLargeDelayMs,
  WINDOW_TITLES,
  withFixtures,
} from '../../../helpers';
import { Mockttp } from '../../../mock-e2e';
import ContractAddressRegistry from '../../../seeder/contract-address-registry';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import { Driver } from '../../../webdriver/driver';
import { scrollAndConfirmAndAssertConfirm } from '../helpers';
import { openDAppWithContract, TestSuiteArguments } from './shared';

describe('Confirmation Redesign ERC20 Increase Allowance', function () {
  describe('Submit an increase allowance transaction @no-mmi', function () {
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
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await createAndAssertIncreaseAllowanceSubmission(
            driver,
            '3',
            contractRegistry,
          );
        },
      );
    });

    it('Sends a type 0 transaction (Legacy) with a large spending cap', async function () {
      await withFixtures(
        generateFixtureOptionsForLegacyTx(this),
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await createAndAssertIncreaseAllowanceSubmission(
            driver,
            '3000',
            contractRegistry,
          );
        },
      );
    });

    it('Sends a type 2 transaction (EIP1559) with a large spending cap', async function () {
      await withFixtures(
        generateFixtureOptionsForEIP1559Tx(this),
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await createAndAssertIncreaseAllowanceSubmission(
            driver,
            '3000',
            contractRegistry,
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
      .withPreferencesController({
        preferences: {
          redesignedConfirmationsEnabled: true,
          isRedesignedConfirmationsDeveloperEnabled: true,
        },
      })
      .build(),
    ganacheOptions: defaultGanacheOptions,
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
      .withPreferencesController({
        preferences: {
          redesignedConfirmationsEnabled: true,
          isRedesignedConfirmationsDeveloperEnabled: true,
        },
      })
      .build(),
    ganacheOptions: defaultGanacheOptionsForType2Transactions,
    smartContract: SMART_CONTRACTS.HST,
    testSpecificMock: mocks,
    title: mochaContext.test?.fullTitle(),
  };
}

async function createAndAssertIncreaseAllowanceSubmission(
  driver: Driver,
  newSpendingCap: string,
  contractRegistry?: ContractAddressRegistry,
) {
  await openDAppWithContract(driver, contractRegistry, SMART_CONTRACTS.HST);

  await createERC20IncreaseAllowanceTransaction(driver);

  await editSpendingCap(driver, newSpendingCap);

  await scrollAndConfirmAndAssertConfirm(driver);

  await assertChangedSpendingCap(driver, newSpendingCap);
}

async function mocks(server: Mockttp) {
  return [await mocked4BytesIncreaseAllowance(server)];
}

export async function mocked4BytesIncreaseAllowance(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    .always()
    .withQuery({ hex_signature: '0x39509351' })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 46002,
              created_at: '2018-06-24T21:43:27.354648Z',
              text_signature: 'increaseAllowance(address,uint256)',
              hex_signature: '0x39509351',
              bytes_signature: '9PQ',
            },
          ],
        },
      };
    });
}

async function createERC20IncreaseAllowanceTransaction(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#increaseTokenAllowance');
}

export async function editSpendingCap(driver: Driver, newSpendingCap: string) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.clickElement('[data-testid="edit-spending-cap-icon"');

  await driver.fill(
    '[data-testid="custom-spending-cap-input"]',
    newSpendingCap,
  );

  await driver.delay(largeDelayMs);

  await driver.clickElement({ text: 'Save', tag: 'button' });

  // wait for the confirmation to be updated before submitting tx
  await driver.delay(veryLargeDelayMs * 2);
}

export async function assertChangedSpendingCap(
  driver: Driver,
  newSpendingCap: string,
) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  await driver.clickElement({ text: 'Activity', tag: 'button' });

  await driver.delay(veryLargeDelayMs);

  await driver.clickElement(
    '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
  );

  await driver.waitForSelector({
    text: `${newSpendingCap} TST`,
    tag: 'span',
  });

  await driver.waitForSelector({ text: 'Confirmed', tag: 'div' });
}
