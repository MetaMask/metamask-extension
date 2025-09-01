import { Suite } from 'mocha';
import TestDappPage from '../../../page-objects/pages/test-dapp';
import FixtureBuilder from '../../../fixture-builder';
import { DAPP_URL, WINDOW_TITLES, withFixtures } from '../../../helpers';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../../stub/keyring-bridge';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import CreateContractModal from '../../../page-objects/pages/dialog/create-contract';
import TransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import HomePage from '../../../page-objects/pages/home/homepage';
import NFTListPage from '../../../page-objects/pages/home/nft-list';
import SetApprovalForAllTransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/set-approval-for-all-transaction-confirmation';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import ContractAddressRegistry from '../../../seeder/contract-address-registry';
import { TestSuiteArguments } from '../../confirmations/transactions/shared';
import { Driver } from '../../../webdriver/driver';

describe('Trezor Hardware', function (this: Suite) {
  const smartContract = SMART_CONTRACTS.NFTS;

  describe('can perform actions on an ERC-721 token', function () {

    async function deployContract(testDappPage: TestDappPage, driver: Driver) {
      await testDappPage.clickERC721DeployButton();
      await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
      const createContractModal = new CreateContractModal(driver);
      await createContractModal.checkPageIsLoaded();
      await createContractModal.clickConfirm();
      await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
      await testDappPage.checkERC721TokenAddressesValue(
        '0xcB17707e0623251182A654BEdaE16429C78A7424',
      );
    }

    async function mintNft(testDappPage: TestDappPage, driver: Driver) {
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
      // Check that NFT image is displayed in NFT tab on homepagexp
      await nftListPage.checkNftImageIsDisplayed();
      await homePage.goToActivityList();
      const activityListPage = new ActivityListPage(driver);
      await activityListPage.checkTransactionActivityByText('Deposit');
      await activityListPage.checkWaitForTransactionStatus('confirmed');
    }

    it('deploys an ERC-721 token', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withTrezorAccount()
            .withPermissionControllerConnectedToTestDapp({
              account: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
            })
            .build(),
          title: this.test?.fullTitle(),
          smartContract,
          dapp: true,
        },
        async ({ driver, localNodes }) => {
          await localNodes?.[0]?.setAccountBalance(
            KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
            '0x100000000000000000000',
          );
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
          await deployContract(testDappPage, driver);
        },
      );
    });

    it('mints an ERC-721 token', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withTrezorAccount()
            .withPermissionControllerConnectedToTestDapp({
              account: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
            })
            .build(),
          title: this.test?.fullTitle(),
          smartContract,
          dapp: true,
        },
        async ({
          driver,
          localNodes,
          contractRegistry,
        }: TestSuiteArguments) => {
          await localNodes?.[0]?.setAccountBalance(
            KNOWN_PUBLIC_KEY_ADDRESSES[0].address as `0x${string}`,
            '0x100000000000000000000',
          );
          await loginWithBalanceValidation(
            driver,
            undefined,
            undefined,
            '1208925.8196',
          );

          const contractAddress = await (
            contractRegistry as ContractAddressRegistry
          ).getContractAddress(smartContract);

          const testDappPage = new TestDappPage(driver);
          await testDappPage.openTestDappPage({
            contractAddress,
            url: DAPP_URL,
          });
          await testDappPage.checkPageIsLoaded();

          await mintNft(testDappPage, driver);
        },
      );
    });

    it('approves an ERC-721 token', async function () {
      // Approve function is difference since caller must be owner of contract,
      // so we need to deploy and mint token first to make sure contract belong to caller.
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withTrezorAccount()
            .withPermissionControllerConnectedToTestDapp({
              account: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
            })
            .build(),
          title: this.test?.fullTitle(),
          dapp: true,
        },
        async ({ driver, localNodes }: TestSuiteArguments) => {
          await localNodes?.[0]?.setAccountBalance(
            KNOWN_PUBLIC_KEY_ADDRESSES[0].address as `0x${string}`,
            '0x100000000000000000000',
          );
          await loginWithBalanceValidation(
            driver,
            undefined,
            undefined,
            '1208925.8196',
          );

          const testDappPage = new TestDappPage(driver);
          await testDappPage.openTestDappPage();
          await testDappPage.checkPageIsLoaded();
          await deployContract(testDappPage, driver);

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await mintNft(testDappPage, driver);

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await testDappPage.clickERC721ApproveButton();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const approveConfirmation = new TransactionConfirmation(driver);
          await approveConfirmation.clickFooterConfirmButton();
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          const homePage = new HomePage(driver);
          const activityListPage = new ActivityListPage(driver);
          await homePage.goToActivityList();
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
          fixtures: new FixtureBuilder()
            .withTrezorAccount()
            .withPermissionControllerConnectedToTestDapp({
              account: KNOWN_PUBLIC_KEY_ADDRESSES[0].address as `0x${string}`,
            })
            .build(),
          title: this.test?.fullTitle(),
          smartContract,
          dapp: true,
        },
        async ({
          driver,
          localNodes,
          contractRegistry,
        }: TestSuiteArguments) => {
          await localNodes?.[0]?.setAccountBalance(
            KNOWN_PUBLIC_KEY_ADDRESSES[0].address as `0x${string}`,
            '0x100000000000000000000',
          );
          await loginWithBalanceValidation(
            driver,
            undefined,
            undefined,
            '1208925.8196',
          );
          const contractAddress = await (
            contractRegistry as ContractAddressRegistry
          ).getContractAddress(smartContract);
          const testDappPage = new TestDappPage(driver);
          await testDappPage.openTestDappPage({
            contractAddress,
            url: DAPP_URL,
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
});
