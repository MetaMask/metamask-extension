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
import type { SpeculosClient } from '../../../speculos/client';
import { SPECULOS_LEDGER_ADDRESS } from '../../../speculos/constants';
import { login } from '../../../page-objects/flows/login.flow';
import { switchToHardwareAccount } from '../../../page-objects/flows/account-list.flow';
import CreateContractModal from '../../../page-objects/pages/dialog/create-contract';
import WatchAssetConfirmation from '../../../page-objects/pages/confirmations/watch-asset-confirmation';
import HomePage from '../../../page-objects/pages/home/homepage';
import TokenTransferTransactionConfirmation from '../../../page-objects/pages/confirmations/token-transfer-confirmation';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import TransactionConfirmation from '../../../page-objects/pages/confirmations/transaction-confirmation';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';

const erc20 = SMART_CONTRACTS.HST;

const LEDGER_SEED_BALANCE = [
  { address: SPECULOS_LEDGER_ADDRESS, balance: '0x100000000000000000000' },
];

async function approveLedgerAfterSigningApdu(
  speculosClient: SpeculosClient,
  apduBridge: ApduBridge,
) {
  const apdu = await apduBridge.waitForSigningApdu(90000);

  // Wait for Speculos to show the blind signing confirmation screen
  await new Promise((r) => setTimeout(r, 1500));

  // Press "both" to accept the blind signing risk warning
  // Screen: "Blind signing ahead — To accept risk, press both buttons"
  await speculosClient.pressButton('both');
  await new Promise((r) => setTimeout(r, 1000));

  // Navigate through 4 review pages:
  //   Page 1: Recipient address
  //   Page 2: Network (1337)
  //   Page 3: Max fees
  //   Page 4: "Accept risk and sign transaction"
  for (let i = 0; i < 4; i++) {
    await speculosClient.pressButton('right');
    await new Promise((r) => setTimeout(r, 500));
  }

  // Press "both" to confirm signing (currently on "Accept risk and sign transaction")
  await speculosClient.pressButton('both');
  await new Promise((r) => setTimeout(r, 500));
}

describe('Ledger Hardware ERC20 @speculos', function (this: Suite) {
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
  // The hardcoded token address 0xcB17707... is deterministic for the default account,
  // not the Ledger account. Re-enable after implementing proper contract address detection.
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('can create an ERC20 token', async function () {
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
      async ({ driver, speculosClient, apduBridge }) => {
        const symbol = 'TST';
        await login(driver, { validateBalance: false });
        await switchToHardwareAccount(driver, 'Ledger 1');

        const ledgerDone = approveLedgerAfterSigningApdu(
          speculosClient,
          apduBridge,
        );

        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage();
        await testDappPage.clickERC20CreateTokenButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const createContractModal = new CreateContractModal(driver);
        await createContractModal.checkPageIsLoaded();
        await createContractModal.clickConfirm();

        await ledgerDone;

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDappPage.checkTokenAddressesValue(
          '0xcB17707e0623251182A654BEdaE16429C78A7424',
        );

        await testDappPage.clickERC20WatchAssetButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const watchAssetConfirmation = new WatchAssetConfirmation(driver);
        await watchAssetConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.goToTokensTab();
        await homePage.checkExpectedTokenBalanceIsDisplayed('10', symbol);
      },
    );
  });

  it('can transfer an ERC20 token', async function () {
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
            name: erc20,
            deployerOptions: {
              fromAddress: SPECULOS_LEDGER_ADDRESS,
            },
          },
        ],
      },
      async ({ driver, contractRegistry, speculosClient, apduBridge }) => {
        const symbol = 'TST';
        await login(driver, { validateBalance: false });
        await switchToHardwareAccount(driver, 'Ledger 1');

        const contractAddress = contractRegistry.getContractAddress(erc20);
        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage({ contractAddress });
        await testDappPage.checkPageIsLoaded();

        await testDappPage.clickERC20WatchAssetButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const watchAssetConfirmation = new WatchAssetConfirmation(driver);
        await watchAssetConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const ledgerDone = approveLedgerAfterSigningApdu(
          speculosClient,
          apduBridge,
        );

        await testDappPage.clickERC20TokenTransferButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const tokenTransferConfirmation =
          new TokenTransferTransactionConfirmation(driver);
        await tokenTransferConfirmation.checkPageIsLoaded();
        await tokenTransferConfirmation.clickConfirmButton();

        await ledgerDone;

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();
        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkTxAction({ action: `Sent ${symbol}` });
        await activityListPage.checkTxAmountInActivity(`-1.5 ${symbol}`);
      },
    );
  });

  it('can approve an ERC20 token', async function () {
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
            name: erc20,
            deployerOptions: {
              fromAddress: SPECULOS_LEDGER_ADDRESS,
            },
          },
        ],
      },
      async ({ driver, contractRegistry, speculosClient, apduBridge }) => {
        const symbol = 'TST';
        await login(driver, { validateBalance: false });
        await switchToHardwareAccount(driver, 'Ledger 1');

        const contractAddress = contractRegistry.getContractAddress(erc20);
        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage({ contractAddress });
        await testDappPage.checkPageIsLoaded();

        const ledgerDone = approveLedgerAfterSigningApdu(
          speculosClient,
          apduBridge,
        );

        await testDappPage.clickApproveTokens();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const txConfirmation = new TransactionConfirmation(driver);
        await txConfirmation.clickFooterConfirmButtonOrReconnect();

        await ledgerDone;

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkTransactionActivityByText(
          `Approve ${symbol} spending cap`,
        );
        await activityListPage.checkWaitForTransactionStatus('confirmed');
      },
    );
  });

  it('can increase token allowance', async function () {
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
            name: erc20,
            deployerOptions: {
              fromAddress: SPECULOS_LEDGER_ADDRESS,
            },
          },
        ],
      },
      async ({ driver, contractRegistry, speculosClient, apduBridge }) => {
        const symbol = 'TST';
        await login(driver, { validateBalance: false });
        await switchToHardwareAccount(driver, 'Ledger 1');

        const contractAddress = contractRegistry.getContractAddress(erc20);
        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage({ contractAddress });
        await testDappPage.checkPageIsLoaded();

        const ledgerDone = approveLedgerAfterSigningApdu(
          speculosClient,
          apduBridge,
        );

        await testDappPage.clickERC20IncreaseAllowanceButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const txConfirmation = new TransactionConfirmation(driver);
        await txConfirmation.clickFooterConfirmButtonOrReconnect();

        await ledgerDone;

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkTransactionActivityByText(
          `Increase ${symbol} spending cap`,
        );
        await activityListPage.checkWaitForTransactionStatus('confirmed');
      },
    );
  });
});
