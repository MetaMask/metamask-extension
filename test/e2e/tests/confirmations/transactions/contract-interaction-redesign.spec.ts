/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { Mockttp } from 'mockttp';
import { unlockWallet } from '../../../helpers';
import { createDappTransaction } from '../../../page-objects/flows/transaction';
import ContractAddressRegistry from '../../../seeder/contract-address-registry';
import { Driver } from '../../../webdriver/driver';
import { MockedEndpoint } from '../../../mock-e2e';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import TestDapp from '../../../page-objects/pages/test-dapp';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import TransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import AdvancedSettings from '../../../page-objects/pages/settings/advanced-settings';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
import {
  assertAdvancedGasDetails,
  TestSuiteArguments,
  toggleAdvancedDetails,
} from './shared';

const { hexToNumber } = require('@metamask/utils');
const { WINDOW_TITLES, withFixtures } = require('../../../helpers');
const {
  KNOWN_PUBLIC_KEY_ADDRESSES,
} = require('../../../../stub/keyring-bridge');
const FixtureBuilder = require('../../../fixtures/fixture-builder');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');
const { CHAIN_IDS } = require('../../../../../shared/constants/network');

describe('Confirmation Redesign Contract Interaction Component', function () {
  const smartContract = SMART_CONTRACTS.PIGGYBANK;

  describe('Create a deposit transaction', function () {
    it(`Sends a contract interaction type 0 transaction (Legacy)`, async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          localNodeOptions: {
            hardfork: 'muirGlacier',
          },
          smartContract,
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

          await testDapp.createDepositTransaction();
          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkPageIsLoaded();
          await transactionConfirmation.clickFooterConfirmButton();
        },
      );
    });

    it(`Sends a contract interaction type 2 transaction (EIP1559)`, async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          smartContract,
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
          await testDapp.createDepositTransaction();
          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkPageIsLoaded();
          await transactionConfirmation.clickFooterConfirmButton();
        },
      );
    });

    it(`Sends a contract interaction type 0 transaction (Legacy) with a Trezor account`, async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilder()
            .withTrezorAccount()
            .withPermissionControllerConnectedToTestDapp({
              account: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
            })
            .build(),
          localNodeOptions: {
            hardfork: 'muirGlacier',
          },
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          // Seed the Trezor account with balance
          (await localNodes?.[0]?.setAccountBalance(
            KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
            '0x100000000000000000000',
          )) ?? console.error('localNodes is undefined or empty');

          const contractAddress =
            await contractRegistry?.getContractAddress(smartContract);

          await loginWithBalanceValidation(driver, localNodes?.[0]);
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage({ contractAddress });
          await testDapp.checkPageIsLoaded();
          await testDapp.createDepositTransaction();
          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkPageIsLoaded();
          await transactionConfirmation.clickFooterConfirmButton();

          // Assert transaction is completed
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          const homePage = new HomePage(driver);
          await homePage.goToActivityList();
          const activityList = new ActivityListPage(driver);
          await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
          await activityList.checkTxAction({ action: 'Deposit' });
        },
      );
    });

    it(`Opens a contract interaction type 2 transaction that includes layer 1 fees breakdown on a layer 2`, async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilder({ inputChainId: CHAIN_IDS.OPTIMISM })
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({
              useTransactionSimulations: false,
            })
            .withAppStateController({
              [CHAIN_IDS.OPTIMISM]: true,
            })
            .withNetworkControllerOnOptimism()
            .build(),
          localNodeOptions: {
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

          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage({ contractAddress });

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          await toggleAdvancedDetails(driver);

          await assertAdvancedGasDetails(driver);
        },
      );
    });
  });

  describe('Custom nonce editing', function () {
    it('Sends a contract interaction type 2 transaction without custom nonce editing (EIP1559)', async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          smartContract,
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
          await testDapp.createDepositTransaction();
          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkPageIsLoaded();
          await transactionConfirmation.clickFooterConfirmButton();
        },
      );
    });

    it('Sends a contract interaction type 2 transaction with custom nonce editing (EIP1559)', async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          smartContract,
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
          await testDapp.createDepositTransaction();
          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkPageIsLoaded();
          await transactionConfirmation.clickAdvancedDetailsButton();
          await transactionConfirmation.setCustomNonce('10');
          await transactionConfirmation.clickFooterConfirmButton();
        },
      );
    });
  });

  describe('Advanced Gas Details', function () {
    it('Sends a contract interaction type 2 transaction (EIP1559) and checks the advanced gas details', async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          smartContract,
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
          await testDapp.createDepositTransaction();
          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkPageIsLoaded();
          await transactionConfirmation.clickAdvancedDetailsButton();
          await assertAdvancedGasDetails(driver);
        },
      );
    });

    it('If hex data is enabled, advanced details are shown', async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          smartContract,
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
          const homePage = new HomePage(driver);
          await homePage.headerNavbar.openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.clickAdvancedTab();
          const advancedSettingsPage = new AdvancedSettings(driver);
          await advancedSettingsPage.checkPageIsLoaded();
          await advancedSettingsPage.toggleOnHexData();

          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage({ contractAddress });
          await testDapp.checkPageIsLoaded();

          await testDapp.createDepositTransaction();
          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkPageIsLoaded();
          await transactionConfirmation.clickAdvancedDetailsButton();

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
