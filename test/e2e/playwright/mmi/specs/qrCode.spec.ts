import { test } from '../helpers/extension-loader';
import { ChromeExtensionPage } from '../pageObjects/mmi-extension-page';
import { MMIMainMenuPage } from '../pageObjects/mmi-mainMenu-page';
import { MMINetworkPage } from '../pageObjects/mmi-network-page';
import { MMISignUpPage } from '../pageObjects/mmi-signup-page';
import { MMIMainPage } from '../pageObjects/mmi-main-page';
import { MMIAccountMenuPage } from '../pageObjects/mmi-accountMenu-page';
import { CustodianTestClient } from '../custodian-hooks/hooks';
import { SEPOLIA_DISPLAY_NAME } from '../helpers/utils';

test.describe('QR Code Connection Request', () => {
  // @TODO Follow up task to understand why this test fails more times than it passes
  test('run the extension and add custodian accounts using the QR Code feature', async ({
    page,
    context,
  }) => {
    const client = new CustodianTestClient();
    await client.setup();

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
    await mainMenuPage.fillPassword();
    await mainMenuPage.finishOnboarding();
    await mainMenuPage.selectMenuOption('settings');
    await mainMenuPage.selectSettings('Advance');
    await mainMenuPage.switchTestNetwork();
    await mainMenuPage.closeSettings();

    // Check network
    const networkPage = new MMINetworkPage(page);
    await networkPage.open();
    await networkPage.selectNetwork(
      process.env.MMI_E2E_TEST_NETWORK || SEPOLIA_DISPLAY_NAME,
    );

    // Get account from and to name
    const accountFrom = await client.getAccountFrom();

    const accountsPopup = new MMIAccountMenuPage(page);
    await accountsPopup.accountsMenu();
    await accountsPopup.connectCustodian('Neptune Custody', false, true);
    await accountsPopup.selectCustodyAccount(accountFrom);

    const mainPage = new MMIMainPage(page);
    await mainPage.bringToFront();
  });
});
