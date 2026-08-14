import { Suite } from 'mocha';
import TestDappPage from '../../../page-objects/pages/test-dapp';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { WINDOW_TITLES } from '../../../constants';
import { withFixtures } from '../../../helpers';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../../stub/keyring-bridge';
import { login } from '../../../page-objects/flows/login.flow';
import CreateContractModal from '../../../page-objects/pages/dialog/create-contract';
import TransactionConfirmation from '../../../page-objects/pages/confirmations/transaction-confirmation';
import HomePage from '../../../page-objects/pages/home/homepage';
import NftsTab from '../../../page-objects/pages/home/nfts-tab';
import SetApprovalForAllTransactionConfirmation from '../../../page-objects/pages/confirmations/set-approval-for-all-transaction-confirmation';
import ActivityTab from '../../../page-objects/pages/home/activity-tab';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';

describe('Ledger Hardware', function (this: Suite) {
  const erc721 = SMART_CONTRACTS.NFTS;
  it('deploys an ERC-721 token', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withLedgerAccount()
          .withPermissionControllerConnectedToTestDapp({
            account: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes }) => {
        (await localNodes?.[0]?.setAccountBalance(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          '0x100000000000000000000',
        )) ?? console.error('localNodes is undefined or empty');
        await login(driver, {
          expectedBalance: '1.21M',
          waitForNonEvmAccounts: false,
        });

        // deploy action
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
        fixtures: new FixtureBuilderV2()
          .withLedgerAccount()
          .withPermissionControllerConnectedToTestDapp({
            account: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          })
          .build(),
        title: this.test?.fullTitle(),
        smartContract: [
          {
            name: erc721,
            deployerOptions: {
              fromAddress: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
            },
          },
        ],
      },
      async ({ driver, localNodes, contractRegistry }) => {
        (await localNodes?.[0]?.setAccountBalance(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          '0x100000000000000000000',
        )) ?? console.error('localNodes is undefined or empty');
        // mine block to ensure balance is updated in both browsers
        await localNodes?.[0]?.mineBlock();
        const balance = await localNodes?.[0]?.getBalance(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address as `0x${string}`,
        );
        await login(driver, {
          expectedBalance:
            `${((balance ?? 0) / 1_000_000).toFixed(2)}M`.toString(),
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

        // Check that NFT image is displayed in NFT tab on homepage
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
        fixtures: new FixtureBuilderV2()
          .withLedgerAccount()
          .withPermissionControllerConnectedToTestDapp({
            account: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          })
          .build(),
        title: this.test?.fullTitle(),
        smartContract: [
          {
            name: erc721,
            deployerOptions: {
              fromAddress: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
            },
          },
        ],
      },
      async ({ driver, localNodes, contractRegistry }) => {
        (await localNodes?.[0]?.setAccountBalance(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          '0x100000000000000000000',
        )) ?? console.error('localNodes is undefined or empty');
        // mine block to ensure balance is updated in both browsers
        await localNodes?.[0]?.mineBlock();
        const balance = await localNodes?.[0]?.getBalance(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address as `0x${string}`,
        );
        await login(driver, {
          expectedBalance:
            `${((balance ?? 0) / 1_000_000).toFixed(2)}M`.toString(),
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
        fixtures: new FixtureBuilderV2()
          .withLedgerAccount()
          .withPermissionControllerConnectedToTestDapp({
            account: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          })
          .build(),
        title: this.test?.fullTitle(),
        smartContract: [
          {
            name: erc721,
            deployerOptions: {
              fromAddress: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
            },
          },
        ],
      },
      async ({ driver, localNodes, contractRegistry }) => {
        (await localNodes?.[0]?.setAccountBalance(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          '0x100000000000000000000',
        )) ?? console.error('localNodes is undefined or empty');
        // mine block to ensure balance is updated in both browsers
        await localNodes?.[0]?.mineBlock();
        const balance = await localNodes?.[0]?.getBalance(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address as `0x${string}`,
        );
        await login(driver, {
          expectedBalance:
            `${((balance ?? 0) / 1_000_000).toFixed(2)}M`.toString(),
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
