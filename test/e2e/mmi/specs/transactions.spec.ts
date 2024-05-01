import { type Page, type BrowserContext } from '@playwright/test';
import { test } from '../helpers/extension-loader';
import { ChromeExtensionPage } from '../pageObjects/mmi-extension-page';
import { MMIMainMenuPage } from '../pageObjects/mmi-mainMenu-page';
import { MMINetworkPage } from '../pageObjects/mmi-network-page';
import { MMISignUpPage } from '../pageObjects/mmi-signup-page';
import { MMIMainPage } from '../pageObjects/mmi-main-page';
import { MMIAccountMenuPage } from '../pageObjects/mmi-accountMenu-page';
import { CustodianTestClient } from '../custodian-hooks/hooks';
import { SEPOLIA_DISPLAY_NAME } from '../helpers/utils';

const sendTransaction = async (
  page: Page,
  context: BrowserContext,
  client: CustodianTestClient,
) => {
  // Getting extension id of MMI
  const extensions = new ChromeExtensionPage(await context.newPage());
  await extensions.goto();
  await extensions.setDevMode();
  const extensionId = await extensions.getExtensionId();
  await extensions.close();

  const signUp = new MMISignUpPage(
    await context.newPage(),
    extensionId as string,
  );
  await signUp.goto();
  await signUp.start();
  await signUp.authentication();
  await signUp.info();
  await signUp.close();

  // Setup testnetwork in settings
  const mainMenuPage = new MMIMainMenuPage(page, extensionId as string);
  await mainMenuPage.goto();
  await mainMenuPage.selectMenuOption('settings');
  await mainMenuPage.selectSettings('Advance');
  await mainMenuPage.switchTestNetwork();
  // await mainMenuPage.showIncomingTransactionsOff()
  await mainMenuPage.closeSettings();

  // Check network
  const networkPage = new MMINetworkPage(page);
  await networkPage.open();
  await networkPage.selectNetwork(
    process.env.MMI_E2E_TEST_NETWORK || SEPOLIA_DISPLAY_NAME,
  );

  // Get account from and to name
  const accountFrom = await client.getAccountFrom();
  const accounTo = await client.getAccountTo();

  const accountsPopup = new MMIAccountMenuPage(page);
  await accountsPopup.accountsMenu();
  await accountsPopup.connectCustodian(
    process.env.MMI_E2E_CUSTODIAN_NAME as string,
  );
  await accountsPopup.selectCustodyAccount(accountFrom);

  const mainPage = new MMIMainPage(page);
  await mainPage.bringToFront();
  await mainPage.selectMainAction('Send');
  await mainPage.sendFunds(accounTo, '0');

  // Check that action took place
  await mainPage.bringToFront();
  await mainPage.openActivityTab();
  await mainPage.checkLastTransactionStatus(/created/iu);
  // Get custodianTxId to mine the transaction
  const custodianTxId = await mainPage.getCustodianTXId();
  return { mainPage, custodianTxId };
};

test.describe('MMI send', () => {
  test('Send a transaction from one account to another and confirm it from custody', async ({
    page,
    context,
  }) => {
    // Setup custodian and auth
    const client = new CustodianTestClient();
    await client.setup();
    const { mainPage, custodianTxId } = await sendTransaction(
      page,
      context,
      client,
    );

    // Sign and submit
    const statusName = await client.submitTransactionById(custodianTxId);
    await mainPage.checkLastTransactionStatus(statusName);
  });

  test('Send a transaction from one account to another and abort it from custody', async ({
    page,
    context,
  }) => {
    // Setup custodian and auth
    const client = new CustodianTestClient();
    await client.setup();
    const { mainPage, custodianTxId } = await sendTransaction(
      page,
      context,
      client,
    );

    // Abort the transaction
    const statusName = await client.rejectTransactionById(custodianTxId);
    await mainPage.checkLastTransactionStatus(statusName);
  });
});
