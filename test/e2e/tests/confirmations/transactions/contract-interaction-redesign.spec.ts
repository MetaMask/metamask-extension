/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { openDapp, unlockWallet } from '../../../helpers';
import ContractAddressRegistry from '../../../seeder/contract-address-registry';
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
            })
            .withTransactionControllerOPLayer2Transaction()
            .build(),
          ganacheOptions: {
            ...defaultGanacheOptionsForType2Transactions,
            network_id: hexToNumber(CHAIN_IDS.OPTIMISM),
            chainId: hexToNumber(CHAIN_IDS.OPTIMISM),
          },
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await unlockWallet(driver);

          const contractAddress = await (
            contractRegistry as ContractAddressRegistry
          ).getContractAddress(smartContract);

          await openDapp(driver, contractAddress);

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

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
