/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { Mockttp } from 'mockttp';
import { openDapp, unlockWallet } from '../../../helpers';
import { createDappTransaction } from '../../../page-objects/flows/transaction';
import ContractAddressRegistry from '../../../seeder/contract-address-registry';
import { Driver } from '../../../webdriver/driver';
import { MockedEndpoint } from '../../../mock-e2e';
import {
  assertAdvancedGasDetails,
  confirmDepositTransaction,
  confirmDepositTransactionWithCustomNonce,
  createDepositTransaction,
  openDAppWithContract,
  TestSuiteArguments,
  toggleAdvancedDetails,
  toggleOnHexData,
} from './shared';

const { hexToNumber } = require('@metamask/utils');
const {
  defaultGanacheOptions,
  defaultGanacheOptionsForType2Transactions,
  WINDOW_TITLES,
  withFixtures,
} = require('../../../helpers');
const {
  KNOWN_PUBLIC_KEY_ADDRESSES,
} = require('../../../../stub/keyring-bridge');
const FixtureBuilder = require('../../../fixture-builder');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');
const { CHAIN_IDS } = require('../../../../../shared/constants/network');

describe('Confirmation Redesign Contract Interaction Component', function () {
  const smartContract = SMART_CONTRACTS.PIGGYBANK;

  describe('Create a deposit transaction @no-mmi', function () {
    it(`Sends a contract interaction type 0 transaction (Legacy)`, async function () {
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
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await openDAppWithContract(driver, contractRegistry, smartContract);

          await createDepositTransaction(driver);
          await confirmDepositTransaction(driver);
        },
      );
    });

    it(`Sends a contract interaction type 2 transaction (EIP1559)`, async function () {
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
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await openDAppWithContract(driver, contractRegistry, smartContract);

          await createDepositTransaction(driver);
          await confirmDepositTransaction(driver);
        },
      );
    });

    it(`Sends a contract interaction type 0 transaction (Legacy) with a Trezor account`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withTrezorAccount()
            .withPermissionControllerConnectedToTestDapp({
              account: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
            })
            .withPreferencesController({
              preferences: {
                redesignedConfirmationsEnabled: true,
                isRedesignedConfirmationsDeveloperEnabled: true,
              },
            })
            .build(),
          ganacheOptions: defaultGanacheOptions,
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({
          driver,
          contractRegistry,
          ganacheServer,
        }: TestSuiteArguments) => {
          // Seed the Trezor account with balance
          await ganacheServer?.setAccountBalance(
            KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
            '0x100000000000000000000',
          );
          await openDAppWithContract(driver, contractRegistry, smartContract);

          await createDepositTransaction(driver);
          await confirmDepositTransaction(driver);

          // Assert transaction is completed
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );
          await driver.waitForSelector('.transaction-status-label--confirmed');
        },
      );
    });

    it(`Opens a contract interaction type 2 transaction that includes layer 1 fees breakdown on a layer 2`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder({ inputChainId: CHAIN_IDS.OPTIMISM })
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({
              preferences: {
                redesignedConfirmationsEnabled: true,
                isRedesignedConfirmationsDeveloperEnabled: true,
              },
              useTransactionSimulations: false,
            })
            .withAppStateController({
              [CHAIN_IDS.OPTIMISM]: true,
            })
            .withNetworkControllerOnOptimism()
            .build(),
          ganacheOptions: {
            ...defaultGanacheOptionsForType2Transactions,
            network_id: hexToNumber(CHAIN_IDS.OPTIMISM),
            chainId: hexToNumber(CHAIN_IDS.OPTIMISM),
          },
          smartContract,
          title: this.test?.fullTitle(),
          testSpecificMock: mockOptimismOracle,
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await unlockWallet(driver);
          await createLayer2Transaction(driver);

          const contractAddress = await (
            contractRegistry as ContractAddressRegistry
          ).getContractAddress(smartContract);

          await openDapp(driver, contractAddress);

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          await toggleAdvancedDetails(driver);

          await assertAdvancedGasDetails(driver);
        },
      );
    });
  });

  describe('Custom nonce editing @no-mmi', function () {
    it('Sends a contract interaction type 2 transaction without custom nonce editing (EIP1559)', async function () {
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
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await openDAppWithContract(driver, contractRegistry, smartContract);

          await createDepositTransaction(driver);

          await confirmDepositTransaction(driver);
        },
      );
    });

    it('Sends a contract interaction type 2 transaction with custom nonce editing (EIP1559)', async function () {
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
              useNonceField: true,
            })
            .build(),
          ganacheOptions: defaultGanacheOptionsForType2Transactions,
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await openDAppWithContract(driver, contractRegistry, smartContract);

          await createDepositTransaction(driver);

          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await confirmDepositTransactionWithCustomNonce(driver, '10');
        },
      );
    });
  });

  describe('Advanced Gas Details @no-mmi', function () {
    it('Sends a contract interaction type 2 transaction (EIP1559) and checks the advanced gas details', async function () {
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
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await openDAppWithContract(driver, contractRegistry, smartContract);

          await createDepositTransaction(driver);

          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          await toggleAdvancedDetails(driver);
          await assertAdvancedGasDetails(driver);
        },
      );
    });

    it('If nonce editing is enabled, advanced details are shown', async function () {
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
              useNonceField: true,
            })
            .build(),
          ganacheOptions: defaultGanacheOptionsForType2Transactions,
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await openDAppWithContract(driver, contractRegistry, smartContract);

          await createDepositTransaction(driver);

          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          await assertAdvancedGasDetails(driver);
        },
      );
    });

    it('If hex data is enabled, advanced details are shown', async function () {
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
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await openDAppWithContract(driver, contractRegistry, smartContract);

          await toggleOnHexData(driver);

          await createDepositTransaction(driver);

          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          // re open advanced details
          await toggleAdvancedDetails(driver);

          await assertAdvancedGasDetails(driver);
        },
      );
    });
  });
});

async function createLayer2Transaction(driver: Driver) {
  await createDappTransaction(driver, {
    data: '0x1234',
    to: '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
  });
}

async function mockOptimismOracle(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return [
    await mockServer
      .forPost(/infura/u)
      .withJsonBodyIncluding({
        method: 'eth_call',
        params: [{ to: '0x420000000000000000000000000000000000000f' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: '1111111111111111',
            result:
              '0x0000000000000000000000000000000000000000000000000000000c895f9d79',
          },
        };
      }),
  ];
}
