import { Suite } from 'mocha';
import TestDappPage from '../../../page-objects/pages/test-dapp';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { WINDOW_TITLES, withFixtures } from '../../../helpers';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../../stub/keyring-bridge';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import CreateContractModal from '../../../page-objects/pages/dialog/create-contract';
import TransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import HomePage from '../../../page-objects/pages/home/homepage';
import NFTListPage from '../../../page-objects/pages/home/nft-list';
import SetApprovalForAllTransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/set-approval-for-all-transaction-confirmation';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';

describe('Ledger Hardware', function (this: Suite) {
  const erc721 = SMART_CONTRACTS.NFTS;
  it('deploys an ERC-721 token', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
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
        await loginWithBalanceValidation(
          driver,
          undefined,
          undefined,
          '1208925.8196',
        );

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
        fixtures: new FixtureBuilder()
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
        await loginWithBalanceValidation(
          driver,
          undefined,
          undefined,
          balance?.toString(),
        );

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
        await homePage.goToNftTab();
        const nftListPage = new NFTListPage(driver);
        // Check that NFT image is displayed in NFT tab on homepage
        await nftListPage.checkNftImageIsDisplayed();
        await homePage.goToActivityList();
        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkTransactionActivityByText('Deposit');
        await activityListPage.checkWaitForTransactionStatus('confirmed');
      },
    );
  });
  it('approves an ERC-721 token', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
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
        await loginWithBalanceValidation(
          driver,
          undefined,
          undefined,
          balance?.toString(),
        );

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
        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkTransactionActivityByText(
          'Approve TDN spending cap',
        );
        await activityListPage.checkWaitForTransactionStatus('confirmed');
      },
    );
  });
  it('sets approval for all an ERC-721 token', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
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
        await loginWithBalanceValidation(
          driver,
          undefined,
          undefined,
          balance?.toString(),
        );

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
        const activityListPage = new ActivityListPage(driver);
        await homePage.goToActivityList();
        await activityListPage.checkTransactionActivityByText(
          'Approve TDN with no spend limit',
        );
        await activityListPage.checkWaitForTransactionStatus('confirmed');
      },
    );
  });
});
