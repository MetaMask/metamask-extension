import { expect } from '@playwright/test';
import { test } from '../helpers/extension-loader';
import { ChromeExtensionPage } from '../pageObjects/mmi-extension-page';
import { MMIMainMenuPage } from '../pageObjects/mmi-mainMenu-page';
import { MMINetworkPage } from '../pageObjects/mmi-network-page';
import { MMISignUpPage } from '../pageObjects/mmi-signup-page';
import { MMISaturnUIPage } from '../pageObjects/mmi-saturn-ui-page';
import { CustodianTestClient } from '../custodian-hooks/hooks';
import { MMIAccountMenuPage } from '../pageObjects/mmi-accountMenu-page';
import { SEPOLIA_DISPLAY_NAME } from '../helpers/utils';

test.describe('MMI extension', () => {
  test('Interactive token replacement', async ({ page, context }) => {
    test.slow();
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
    await networkPage.selectNetwork(SEPOLIA_DISPLAY_NAME);

    // get token to access saturn
    const client = new CustodianTestClient();
    await client.setup();
    const accountFrom = await client.getAccountFrom();

    const accountsPopup = new MMIAccountMenuPage(page);
    await accountsPopup.accountsMenu();
    await accountsPopup.connectCustodian(
      process.env.MMI_E2E_CUSTODIAN_NAME as string,
    );
    await accountsPopup.selectCustodyAccount(accountFrom);

    const saturnUIPage = new MMISaturnUIPage(await context.newPage());

    await saturnUIPage.goto();

    // 10 seconds is to allow enough time for the window to open - sometimes it takes up to 6 seconds

    const waitTime = 10;

    await saturnUIPage.issueNewToken(context, waitTime);

    await page.goto(`chrome-extension://${extensionId}/home.html`);
    await mainMenuPage.lockExtension();
    // token must have expired by this point in order for the warning to appear
    // so we delay by waitTime seconds
    await page.waitForTimeout(waitTime * 1000);

    await mainMenuPage.unlockExtension();
    await mainMenuPage.isInteractiveReplacementTokenNotificationVisible(
      accountFrom,
    );
  });

  test('Custodian token management', async ({ page, context }) => {
    // Define const to compare in assertions
    const arrayWithoutCustodianAccounts = ['Account 1'];
    const arrayWithCustodianAccounts = [
      'Account 1',
      'Custody Account A',
      'Custody Account B',
      'Custody Account C',
      'Custody Account D',
      'Custody Account E',
      'Custody Account F',
      'Custody Account G',
      'Custody Account H',
      'Custody Account I',
      'Custody Account J',
      'Custody Account K',
      'Custody Account L',
      'Custody Account M',
      'Custody Account N',
      'Custody Account O',
      'Custody Account P',
      'Custody Account Q',
      'Custody Account R',
      'Custody Account S',
      'Custody Account T',
    ];

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
    await networkPage.selectNetwork(SEPOLIA_DISPLAY_NAME);

    // get token to access saturn
    const client = new CustodianTestClient();
    await client.setup();
    const accountFrom = await client.getAccountFrom();

    const accountsPopup = new MMIAccountMenuPage(page);
    await accountsPopup.accountsMenu();
    await accountsPopup.connectCustodian(
      process.env.MMI_E2E_CUSTODIAN_NAME as string,
    );

    const accountNamesWithCustodian = await accountsPopup.getAccountNames();

    expect(
      JSON.stringify(accountNamesWithCustodian) ===
        JSON.stringify(arrayWithCustodianAccounts),
    ).toBeTruthy();

    await accountsPopup.selectCustodyAccount(accountFrom);
    // Check remove custodian token screen (aborted before removed)
    await accountsPopup.accountsMenu();
    await accountsPopup.removeCustodianToken('Custody Account A');

    // Assert custodian accounts are removed
    const accountNamesAfterRemove = await accountsPopup.getAccountNames();
    expect(
      JSON.stringify(accountNamesAfterRemove) ===
        JSON.stringify(arrayWithoutCustodianAccounts),
    ).toBeTruthy();
  });
});
