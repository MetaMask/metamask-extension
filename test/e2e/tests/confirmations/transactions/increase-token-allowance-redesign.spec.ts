/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { MockttpServer } from 'mockttp';
import { WINDOW_TITLES } from '../../../helpers';
import { Driver } from '../../../webdriver/driver';
import {
  confirmApproveTransaction,
  createERC20ApproveTransaction,
  importTST,
} from './erc20-approve-redesign.spec';
import { openDAppWithContract, TestSuiteArguments } from './shared';

const {
  defaultGanacheOptions,
  defaultGanacheOptionsForType2Transactions,
  withFixtures,
} = require('../../../helpers');
const FixtureBuilder = require('../../../fixture-builder');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');

describe('Confirmation Redesign ERC20 Increase Allowance', function () {
  const smartContract = SMART_CONTRACTS.HST;

  describe.only('Submit an increase allowance transaction @no-mmi', function () {
    it.only('Sends a type 0 transaction (Legacy)', async function () {
      await withFixtures(
        {
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
          smartContract,
          testSpecificMock: mocks,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await openDAppWithContract(driver, contractRegistry, smartContract);

          await createERC20ApproveTransaction(driver);

          await confirmApproveTransaction(driver);

          await createERC20IncreaseAllowanceTransaction(driver);

          await driver.delay(1024 ** 2);
        },
      );
    });

    it('Sends a type 2 transaction (EIP1559)', async function () {
      await withFixtures(
        {
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
          smartContract,
          testSpecificMock: mocks,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await openDAppWithContract(driver, contractRegistry, smartContract);

          await createERC20ApproveTransaction(driver);

          await confirmApproveTransaction(driver);

          await createERC20IncreaseAllowanceTransaction(driver);

          await driver.delay(1024 ** 2);
        },
      );
    });
  });
});

async function mocked4BytesApprove(mockServer: MockttpServer) {
  return await mockServer
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    .withQuery({ hex_signature: '0x095ea7b3' })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 149,
            created_at: '2016-07-09T03:58:29.617584Z',
            text_signature: 'approve(address,uint256)',
            hex_signature: '0x095ea7b3',
            bytes_signature: '\t^§³',
          },
        ],
      },
    }));
}

async function mocked4BytesIncreaseAllowance(mockServer: MockttpServer) {
  return await mockServer
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    .withQuery({ hex_signature: '0x39509351' })
    .thenCallback(() => ({
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
    }));
}

async function mocks(server: MockttpServer) {
  return [
    await mocked4BytesApprove(server),
    await mocked4BytesIncreaseAllowance(server),
  ];
}

async function createERC20IncreaseAllowanceTransaction(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#increaseTokenAllowance');
}
