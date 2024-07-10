/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import GanacheContractAddressRegistry from '../../../seeder/ganache-contract-address-registry';
import {
  assertAdvancedGasDetails,
  assertAdvancedGasDetailsWithL2Breakdown,
  confirmContractDeploymentTransaction,
  confirmDepositTransaction,
  confirmDepositTransactionWithCustomNonce,
  createContractDeploymentTransaction,
  createDepositTransaction,
  TestSuiteArguments,
  toggleAdvancedDetails,
  toggleOnCustomNonce,
  toggleOnHexData,
} from './shared';

const { hexToNumber } = require('@metamask/utils');
const {
  defaultGanacheOptions,
  defaultGanacheOptionsForType2Transactions,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} = require('../../../helpers');
const FixtureBuilder = require('../../../fixture-builder');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');
const { CHAIN_IDS } = require('../../../../../shared/constants/network');

describe('Confirmation Redesign Contract Interaction Component', function () {
  const smartContract = SMART_CONTRACTS.PIGGYBANK;

  if (!process.env.ENABLE_CONFIRMATION_REDESIGN) {
    return;
  }

  describe('Create a deposit transaction', function () {
    it(`Sends a contract interaction type 0 transaction (Legacy)`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({
              preferences: { redesignedConfirmationsEnabled: true },
            })
            .build(),
          ganacheOptions: defaultGanacheOptions,
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          const contractAddress = await (
            contractRegistry as GanacheContractAddressRegistry
          ).getContractAddress(smartContract);
          await unlockWallet(driver);

          await openDapp(driver, contractAddress);

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
              preferences: { redesignedConfirmationsEnabled: true },
            })
            .build(),
          ganacheOptions: defaultGanacheOptionsForType2Transactions,
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          const contractAddress = await (
            contractRegistry as GanacheContractAddressRegistry
          ).getContractAddress(smartContract);
          await unlockWallet(driver);

          await openDapp(driver, contractAddress);

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
              preferences: { redesignedConfirmationsEnabled: true },
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
          const contractAddress = await (
            contractRegistry as GanacheContractAddressRegistry
          ).getContractAddress(smartContract);
          await unlockWallet(driver);

          await openDapp(driver, contractAddress);

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          await toggleAdvancedDetails(driver);
        },
      );
    });
  });

  describe('Custom nonce editing', function () {
    it('Sends a contract interaction type 2 transaction without custom nonce editing (EIP1559)', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({
              preferences: { redesignedConfirmationsEnabled: true },
            })
            .build(),
          ganacheOptions: defaultGanacheOptionsForType2Transactions,
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          const contractAddress = await (
            contractRegistry as GanacheContractAddressRegistry
          ).getContractAddress(smartContract);
          await unlockWallet(driver);

          await openDapp(driver, contractAddress);

          await createContractDeploymentTransaction(driver);
          await confirmContractDeploymentTransaction(driver);

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
              preferences: { redesignedConfirmationsEnabled: true },
            })
            .build(),
          ganacheOptions: defaultGanacheOptionsForType2Transactions,
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          const contractAddress = await (
            contractRegistry as GanacheContractAddressRegistry
          ).getContractAddress(smartContract);
          await unlockWallet(driver);

          await openDapp(driver, contractAddress);

          await toggleOnCustomNonce(driver);

          await createContractDeploymentTransaction(driver);
          await confirmContractDeploymentTransaction(driver);

          await createDepositTransaction(driver);
          await confirmDepositTransactionWithCustomNonce(driver, '10');
        },
      );
    });
  });

  describe('Advanced Gas Details', function () {
    it('Sends a contract interaction type 2 transaction (EIP1559) and checks the advanced gas details', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({
              preferences: { redesignedConfirmationsEnabled: true },
            })
            .build(),
          ganacheOptions: defaultGanacheOptionsForType2Transactions,
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          const contractAddress = await (
            contractRegistry as GanacheContractAddressRegistry
          ).getContractAddress(smartContract);
          await unlockWallet(driver);

          await openDapp(driver, contractAddress);

          await toggleOnCustomNonce(driver);

          await createContractDeploymentTransaction(driver);
          await confirmContractDeploymentTransaction(driver);

          await createDepositTransaction(driver);

          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          await toggleAdvancedDetails(driver);
          await assertAdvancedGasDetails(driver);
        },
      );
    });

    it(`Sends a contract interaction type 2 transaction that includes layer 1 fees breakdown on a layer 2 and checks the advanced gas details`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder({ inputChainId: CHAIN_IDS.OPTIMISM })
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({
              preferences: { redesignedConfirmationsEnabled: true },
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
          const contractAddress = await (
            contractRegistry as GanacheContractAddressRegistry
          ).getContractAddress(smartContract);
          await unlockWallet(driver);

          await openDapp(driver, contractAddress);

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          await toggleAdvancedDetails(driver);

          await assertAdvancedGasDetailsWithL2Breakdown(driver);
        },
      );
    });
  });
});
