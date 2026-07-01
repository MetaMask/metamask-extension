import { Suite } from 'mocha';
import TestDappPage from '../../../page-objects/pages/test-dapp';
import { WINDOW_TITLES } from '../../../constants';
import { withFixtures } from '../../../helpers';
import { login } from '../../../page-objects/flows/login.flow';
import CreateContractModal from '../../../page-objects/pages/dialog/create-contract';
import TransactionConfirmation from '../../../page-objects/pages/confirmations/transaction-confirmation';
import HomePage from '../../../page-objects/pages/home/homepage';
import NftsTab from '../../../page-objects/pages/home/nfts-tab';
import SetApprovalForAllTransactionConfirmation from '../../../page-objects/pages/confirmations/set-approval-for-all-transaction-confirmation';
import ActivityTab from '../../../page-objects/pages/home/activity-tab';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import {
  buildLedgerDappFixtures,
  LEDGER_ADDRESS,
  LEDGER_LOGIN_EXPECTED_BALANCE,
  mockLedgerHardwareEndpoints,
  seedLedgerAccountBalance,
} from './ledger-test-helpers';

describe('Ledger Hardware', function (this: Suite) {
  const erc721 = SMART_CONTRACTS.NFTS;
  it('deploys an ERC-721 token', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: buildLedgerDappFixtures(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockLedgerHardwareEndpoints,
      },
      async ({ driver, localNodes }) => {
        await seedLedgerAccountBalance(localNodes);
        await login(driver, {
          expectedBalance: LEDGER_LOGIN_EXPECTED_BALANCE,
          waitForNonEvmAccounts: false,
        });

        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage();
        await testDappPage.checkPageIsLoaded();
        await testDappPage.clickERC721DeployButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const createContractModal = new CreateContractModal(driver);
        await createContractModal.checkPageIsLoaded();
        await createContractModal.clickConfirm();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDappPage.checkERC721TokenAddressesValue(
          '0xcB17707e0623251182A654BEdaE16429C78A7424',
        );
      },
    );
  });
  it('mints an ERC-721 token', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: buildLedgerDappFixtures(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockLedgerHardwareEndpoints,
        smartContract: [
          {
            name: erc721,
            deployerOptions: {
              fromAddress: LEDGER_ADDRESS,
            },
          },
        ],
      },
      async ({ driver, localNodes, contractRegistry }) => {
        await seedLedgerAccountBalance(localNodes);
        await localNodes?.[0]?.mineBlock();
        await login(driver, {
          expectedBalance: LEDGER_LOGIN_EXPECTED_BALANCE,
          waitForNonEvmAccounts: false,
        });

        const contractAddress =
          await contractRegistry.getContractAddress(erc721);
        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage({
          contractAddress,
        });
        await testDappPage.checkPageIsLoaded();
        await testDappPage.clickERC721MintButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const mintConfirmation = new TransactionConfirmation(driver);
        await mintConfirmation.clickFooterConfirmButton();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkTransactionActivityByText(
          'Contract interaction',
        );
        await activityTab.checkWaitForTransactionStatus('confirmed');

        await homePage.goToNftTab();
        const nftsTab = new NftsTab(driver);
        await nftsTab.checkNftImageIsDisplayed();
      },
    );
  });
  it('approves an ERC-721 token', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: buildLedgerDappFixtures(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockLedgerHardwareEndpoints,
        smartContract: [
          {
            name: erc721,
            deployerOptions: {
              fromAddress: LEDGER_ADDRESS,
            },
          },
        ],
      },
      async ({ driver, localNodes, contractRegistry }) => {
        await seedLedgerAccountBalance(localNodes);
        await localNodes?.[0]?.mineBlock();
        await login(driver, {
          expectedBalance: LEDGER_LOGIN_EXPECTED_BALANCE,
          waitForNonEvmAccounts: false,
        });

        const contractAddress =
          await contractRegistry.getContractAddress(erc721);
        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage({
          contractAddress,
        });
        await testDappPage.checkPageIsLoaded();
        await testDappPage.clickERC721ApproveButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const approveConfirmation = new TransactionConfirmation(driver);
        await approveConfirmation.clickFooterConfirmButton();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkTransactionActivityByText(
          'Approved spending cap',
        );
        await activityTab.checkWaitForTransactionStatus('confirmed');
      },
    );
  });
  it('sets approval for all an ERC-721 token', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: buildLedgerDappFixtures(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockLedgerHardwareEndpoints,
        smartContract: [
          {
            name: erc721,
            deployerOptions: {
              fromAddress: LEDGER_ADDRESS,
            },
          },
        ],
      },
      async ({ driver, localNodes, contractRegistry }) => {
        await seedLedgerAccountBalance(localNodes);
        await localNodes?.[0]?.mineBlock();
        await login(driver, {
          expectedBalance: LEDGER_LOGIN_EXPECTED_BALANCE,
          waitForNonEvmAccounts: false,
        });

        const contractAddress =
          await contractRegistry.getContractAddress(erc721);
        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage({
          contractAddress,
        });
        await testDappPage.checkPageIsLoaded();

        await testDappPage.clickERC721SetApprovalForAllButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const setApprovalForAllConfirmation =
          new SetApprovalForAllTransactionConfirmation(driver);
        await setApprovalForAllConfirmation.checkSetApprovalForAllTitle();
        await setApprovalForAllConfirmation.checkSetApprovalForAllSubHeading();
        await setApprovalForAllConfirmation.clickScrollToBottomButton();
        await setApprovalForAllConfirmation.clickFooterConfirmButton();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        const activityTab = new ActivityTab(driver);
        await homePage.goToActivityList();
        await activityTab.checkTransactionActivityByText(
          'Approved spending cap',
        );
        await activityTab.checkWaitForTransactionStatus('confirmed');
      },
    );
  });
});
