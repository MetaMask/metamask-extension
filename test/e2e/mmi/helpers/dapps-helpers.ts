import { BrowserContext, Page } from '@playwright/test';
import { ChromeExtensionPage } from '../pageObjects/mmi-extension-page';
import { MMISignUpPage } from '../pageObjects/mmi-signup-page';
import { MMIMainMenuPage } from '../pageObjects/mmi-mainMenu-page';
import { MMINetworkPage } from '../pageObjects/mmi-network-page';
import { CustodianTestClient } from '../custodian-hooks/hooks';
import { DummyAppPage } from '../pageObjects/mmi-dummyApp-page';
import { MMIAccountMenuPage } from '../pageObjects/mmi-accountMenu-page';
import { SEPOLIA_DISPLAY_NAME } from './utils';

export async function callTestDappBtn(
  page: Page,
  context: BrowserContext,
  client: CustodianTestClient,
  buttonId: string,
  isSign?: boolean,
) {
  // Getting extension id of MMI
  const extension = new ChromeExtensionPage(await context.newPage());
  const extensionId = await extension.initExtension();

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
  await networkPage.selectNetwork(process.env.MMI_E2E_TEST_NETWORK ?? SEPOLIA_DISPLAY_NAME);

  // get token to access saturn
  // changed to get it from Saturn endpoint to avoid calling Auth0 API
  // Get token to access saturn
  // const oauth = new OAuthAPIClient(context);
  // const token = await oauth.getToken();
  const accountFrom = await client.getAccountFrom();

  const accountsPopup = new MMIAccountMenuPage(page);
  await accountsPopup.accountsMenu();
  await accountsPopup.connectCustodian(
    process.env.MMI_E2E_CUSTODIAN_NAME as string,
  );
  await accountsPopup.selectCustodyAccount(accountFrom);

  // Load dummyApp for the test
  const dummyDApp = new DummyAppPage(await context.newPage());
  await dummyDApp.goto();
  await dummyDApp.connectMMI(context);
  const signedTransactionTime = new Date().getTime().toString();
  await dummyDApp.callTestDappButton(
    context,
    buttonId,
    isSign,
    signedTransactionTime,
  );
  return signedTransactionTime;
}
