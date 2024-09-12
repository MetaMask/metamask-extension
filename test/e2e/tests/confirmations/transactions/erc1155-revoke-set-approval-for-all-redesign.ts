/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { MockttpServer } from 'mockttp';
import { WINDOW_TITLES } from '../../../helpers';
import GanacheContractAddressRegistry from '../../../seeder/ganache-contract-address-registry';
import { Driver } from '../../../webdriver/driver';
import { scrollAndConfirmAndAssertConfirm } from '../helpers';
import { openDAppWithContract, TestSuiteArguments } from './shared';

const {
  defaultGanacheOptions,
  defaultGanacheOptionsForType2Transactions,
  withFixtures,
} = require('../../../helpers');
const FixtureBuilder = require('../../../fixture-builder');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');

describe('Confirmation Redesign ERC1155 Revoke setApprovalForAll', function () {
  const smartContract = SMART_CONTRACTS.NFTS;

  describe('Submit an revoke transaction @no-mmi', function () {
    it('Sends a type 0 transaction (Legacy)', async function () {
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
          await createTransactionAndAssertDetails(driver, contractRegistry);
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
          await createTransactionAndAssertDetails(driver, contractRegistry);
        },
      );
    });
  });
});

async function mocks(server: MockttpServer) {
  return [await mocked4BytesSetApprovalForAll(server)];
}

export async function mocked4BytesSetApprovalForAll(mockServer: MockttpServer) {
  return await mockServer
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    .withQuery({ hex_signature: '0xa22cb465' })
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            bytes_signature: '¢,´e',
            created_at: '2018-04-11T21:47:39.980645Z',
            hex_signature: '0xa22cb465',
            id: 29659,
            text_signature: 'setApprovalForAll(address,bool)',
          },
        ],
      },
    }));
}

async function createTransactionAndAssertDetails(
  driver: Driver,
  contractRegistry?: GanacheContractAddressRegistry,
) {
  await openDAppWithContract(driver, contractRegistry, SMART_CONTRACTS.NFTS);

  await createERC1155SetApprovalForAllRevokeTransaction(driver);

  await driver.waitForSelector({
    css: 'h2',
    text: 'Withdrawal request',
  });

  await driver.waitForSelector({
    css: 'p',
    text: 'This site wants permission to withdraw your NFTs',
  });

  await scrollAndConfirmAndAssertConfirm(driver);
}

async function createERC1155SetApprovalForAllRevokeTransaction(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#revokeERC1155Button');
}
