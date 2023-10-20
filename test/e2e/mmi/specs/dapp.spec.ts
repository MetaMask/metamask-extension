import { type Page, type BrowserContext } from '@playwright/test';
import { test } from '../helpers/extension-loader';
import { ChromeExtensionPage } from '../pageObjects/mmi-extension-page';
import { MMIMainMenuPage } from '../pageObjects/mmi-mainMenu-page';
import { MMINetworkPage } from '../pageObjects/mmi-network-page';
import { MMISignUpPage } from '../pageObjects/mmi-signup-page';
import { DummyAppPage } from '../pageObjects/mmi-dummyApp-page';
import { MMIMainPage } from '../pageObjects/mmi-main-page';
import { MMIAccountMenuPage } from '../pageObjects/mmi-accountMenu-page';
import { CustodianTestClient } from '../custodian-hooks/hooks';

const callTestDappBtn = async (
  page: Page,
  context: BrowserContext,
  buttonId: string,
  isSign?: boolean,
) => {
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

  const mainPage = new MMIMainPage(page);

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
  await networkPage.selectNetwork(process.env.MMI_E2E_TEST_NETWORK ?? 'Goerli');

  // get token to access saturn
  // changed to get it from Saturn endpoint to avoid calling Auth0 API
  // Get token to access saturn
  // const oauth = new OAuthAPIClient(context);
  // const token = await oauth.getToken();
  // Connect to Saturn API
  const client = new CustodianTestClient();
  await client.setup();
  const accountFrom = await client.getAccountFrom();

  const accountsPopup = new MMIAccountMenuPage(page);
  await accountsPopup.accountsMenu();
  await accountsPopup.connectCustodian(
    process.env.MMI_E2E_CUSTODIAN_NAME as string,
  );
  await accountsPopup.selectCustodyAccount(accountFrom);

  // Load dummyApp for the test
  const signedTransactionTime = new Date().getTime().toString();
  const dummyDApp = new DummyAppPage(await context.newPage());
  await dummyDApp.goto();
  await dummyDApp.connectMMI(context);
  await dummyDApp.callTestDappButton(
    context,
    buttonId,
    isSign,
    signedTransactionTime,
  );

  if (isSign ?? false) {
    if (buttonId === 'signTypedDataV4') {
      // Sign Typed Data V4
      await client.signEIP721MessageV4(signedTransactionTime);
    } else if (buttonId === 'signTypedDataV3') {
      // Sign Typed Data V3
      await client.signEIP721MessageV3(signedTransactionTime);
    } else {
      // Personal Sign
      await client.signPersonalSignature(signedTransactionTime);
    }
  } else {
    // Rest of the test dapp buttons
    await mainPage.bringToFront();
    await mainPage.openActivityTab();
    await mainPage.checkLastTransactionStatus(/created/iu);
    const custodianTxId = await mainPage.getCustodianTXId();

    // Sign and submit
    const statusName = await client.submitTransactionById(custodianTxId);
    if (buttonId === 'useSuperPowers_goerli') {
      await mainPage.checkLastTransactionStatus(/Failed/iu);
    } else {
      await mainPage.checkLastTransactionStatus(statusName);
    }
    // Mined status not check as it makes tests flaky and it is blockchain performance dependent
  }
};

test.describe('MMI dapps', () => {
  test('MMI connects to dapp, clicks "Show me the money" button and confirm from custody', async ({
    page,
    context,
  }) => {
    await callTestDappBtn(page, context, 'showMeTheMoneyButton_goerli');
  });

  test('MMI connects to dapp, clicks "Approve tokens" button and confirm from custody', async ({
    page,
    context,
  }) => {
    await callTestDappBtn(page, context, 'approveTokens');
  });

  test('MMI connects to dapp, clicks "Personal Sign" button and confirm from custody @custodian_sign', async ({
    page,
    context,
  }) => {
    await callTestDappBtn(page, context, 'personalSign', true);
  });

  test('MMI connects to dapp, clicks "Sign EIP712 V4" button and confirm from custody @custodian_signTypedData', async ({
    page,
    context,
  }) => {
    await callTestDappBtn(page, context, 'signTypedDataV4', true);
  });

  test('MMI connects to dapp, clicks "Sign EIP712 V3" button and confirm from custody @custodian_signTypedData', async ({
    page,
    context,
  }) => {
    await callTestDappBtn(page, context, 'signTypedDataV3', true);
  });

  test('MMI connects to dapp, clicks "Use Super Powers" button, confirm from custody and check that the TX has failed', async ({
    page,
    context,
  }) => {
    await callTestDappBtn(page, context, 'useSuperPowers_goerli');
  });
});
