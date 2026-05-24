import { Suite } from 'mocha';
import TestDappPage from '../../../page-objects/pages/test-dapp';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { WINDOW_TITLES } from '../../../constants';
import {
  withSpeculosFixtures,
  startSharedSpeculos,
  stopSharedSpeculos,
} from '../../../speculos/with-speculos-fixtures';
import type { SharedSpeculosContext } from '../../../speculos/with-speculos-fixtures';
import type { ApduBridge } from '../../../speculos/apdu-bridge';
import type { DeviceInteraction } from '../../../speculos/device-interaction';
import { SPECULOS_LEDGER_ADDRESS } from '../../../speculos/constants';
import { login } from '../../../page-objects/flows/login.flow';
import { switchToHardwareAccount } from '../../../page-objects/flows/account-list.flow';
import CreateContractModal from '../../../page-objects/pages/dialog/create-contract';
import TransactionConfirmation from '../../../page-objects/pages/confirmations/transaction-confirmation';
import HomePage from '../../../page-objects/pages/home/homepage';
import NFTListPage from '../../../page-objects/pages/home/nft-list';
import SetApprovalForAllTransactionConfirmation from '../../../page-objects/pages/confirmations/set-approval-for-all-transaction-confirmation';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';

const erc721 = SMART_CONTRACTS.NFTS;

const LEDGER_SEED_BALANCE = [
  { address: SPECULOS_LEDGER_ADDRESS, balance: '0x100000000000000000000' },
];

async function approveLedgerAfterSigningApdu(
  interaction: DeviceInteraction,
  apduBridge: ApduBridge,
) {
  await apduBridge.waitForSigningApdu(90000);
  await new Promise((r) => setTimeout(r, 1500));
  await interaction.approveBlindSigning();
}

describe('Ledger Hardware ERC721 @speculos', function (this: Suite) {
  this.timeout(120000);

  let shared: SharedSpeculosContext;

  before(async function () {
    this.timeout(120000);
    shared = await startSharedSpeculos();
  });

  after(async function () {
    this.timeout(30000);
    await stopSharedSpeculos(shared);
  });

  // TODO: Contract deployment from Ledger account requires signing the deploy tx.
  // The hardcoded token address is deterministic for the default account, not the Ledger account.
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('deploys an ERC-721 token', async function () {
    await withSpeculosFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withLedgerAccount()
          .withPermissionControllerConnectedToTestDapp({
            account: SPECULOS_LEDGER_ADDRESS,
          })
          .build(),
        title: this.test?.fullTitle(),
        sharedContext: shared,
        seedBalances: LEDGER_SEED_BALANCE,
      },
      async ({ driver, interaction, apduBridge }) => {
        await login(driver, { validateBalance: false });
        await switchToHardwareAccount(driver, 'Ledger 1');

        const ledgerDone = approveLedgerAfterSigningApdu(
          interaction,
          apduBridge,
        );

        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage();
        await testDappPage.checkPageIsLoaded();
        await testDappPage.clickERC721DeployButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const createContractModal = new CreateContractModal(driver);
        await createContractModal.checkPageIsLoaded();
        await createContractModal.clickConfirm();

        await ledgerDone;

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDappPage.checkERC721TokenAddressesValue(
          '0xcB17707e0623251182A654BEdaE16429C78A7424',
        );
      },
    );
  });

  it('mints an ERC-721 token', async function () {
    await withSpeculosFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withLedgerAccount()
          .withPermissionControllerConnectedToTestDapp({
            account: SPECULOS_LEDGER_ADDRESS,
          })
          .build(),
        title: this.test?.fullTitle(),
        sharedContext: shared,
        seedBalances: LEDGER_SEED_BALANCE,
        smartContract: [
          {
            name: erc721,
            deployerOptions: {
              fromAddress: SPECULOS_LEDGER_ADDRESS,
            },
          },
        ],
      },
      async ({ driver, contractRegistry, interaction, apduBridge }) => {
        await login(driver, { validateBalance: false });
        await switchToHardwareAccount(driver, 'Ledger 1');

        const contractAddress =
          contractRegistry.getContractAddress(erc721);
        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage({ contractAddress });
        await testDappPage.checkPageIsLoaded();

        const ledgerDone = approveLedgerAfterSigningApdu(
          interaction,
          apduBridge,
        );

        await testDappPage.clickERC721MintButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const mintConfirmation = new TransactionConfirmation(driver);
        await mintConfirmation.clickFooterConfirmButtonOrReconnect();

        await ledgerDone;

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkTransactionActivityByText('Deposit');
        await activityListPage.checkWaitForTransactionStatus('confirmed');

        await homePage.goToNftTab();
        const nftListPage = new NFTListPage(driver);
        await nftListPage.checkNftImageIsDisplayed();
      },
    );
  });

  it('approves an ERC-721 token', async function () {
    await withSpeculosFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withLedgerAccount()
          .withPermissionControllerConnectedToTestDapp({
            account: SPECULOS_LEDGER_ADDRESS,
          })
          .build(),
        title: this.test?.fullTitle(),
        sharedContext: shared,
        seedBalances: LEDGER_SEED_BALANCE,
        smartContract: [
          {
            name: erc721,
            deployerOptions: {
              fromAddress: SPECULOS_LEDGER_ADDRESS,
            },
          },
        ],
      },
      async ({ driver, contractRegistry, interaction, apduBridge }) => {
        await login(driver, { validateBalance: false });
        await switchToHardwareAccount(driver, 'Ledger 1');

        const contractAddress =
          contractRegistry.getContractAddress(erc721);
        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage({ contractAddress });
        await testDappPage.checkPageIsLoaded();

        const ledgerDone = approveLedgerAfterSigningApdu(
          interaction,
          apduBridge,
        );

        await testDappPage.clickERC721ApproveButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const approveConfirmation = new TransactionConfirmation(driver);
        await approveConfirmation.clickFooterConfirmButtonOrReconnect();

        await ledgerDone;

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
    await withSpeculosFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withLedgerAccount()
          .withPermissionControllerConnectedToTestDapp({
            account: SPECULOS_LEDGER_ADDRESS,
          })
          .build(),
        title: this.test?.fullTitle(),
        sharedContext: shared,
        seedBalances: LEDGER_SEED_BALANCE,
        smartContract: [
          {
            name: erc721,
            deployerOptions: {
              fromAddress: SPECULOS_LEDGER_ADDRESS,
            },
          },
        ],
      },
      async ({ driver, contractRegistry, interaction, apduBridge }) => {
        await login(driver, { validateBalance: false });
        await switchToHardwareAccount(driver, 'Ledger 1');

        const contractAddress =
          contractRegistry.getContractAddress(erc721);
        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage({ contractAddress });
        await testDappPage.checkPageIsLoaded();

        const ledgerDone = approveLedgerAfterSigningApdu(
          interaction,
          apduBridge,
        );

        await testDappPage.clickERC721SetApprovalForAllButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const setApprovalForAllConfirmation =
          new SetApprovalForAllTransactionConfirmation(driver);
        await setApprovalForAllConfirmation.checkSetApprovalForAllTitle();
        await setApprovalForAllConfirmation.checkSetApprovalForAllSubHeading();
        await setApprovalForAllConfirmation.clickScrollToBottomButton();
        await setApprovalForAllConfirmation.clickFooterConfirmButtonOrReconnect();

        await ledgerDone;

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkTransactionActivityByText(
          'Approve TDN with no spend limit',
        );
        await activityListPage.checkWaitForTransactionStatus('confirmed');
      },
    );
  });
});
