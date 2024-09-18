import { test } from '../helpers/extension-loader';
import { ChromeExtensionPage } from '../pageObjects/mmi-extension-page';
import { MMISignUpPage } from '../pageObjects/mmi-signup-page';
import {
  checkLinkURL,
  closePages,
  getPageAndCloseRepeated,
} from '../helpers/utils';
import { MMIMainMenuPage } from '../pageObjects/mmi-mainMenu-page';
import { MMIMainPage } from '../pageObjects/mmi-main-page';

const support = 'https://support.metamask-institutional.io';
const supportContactUs = 'https://support.metamask-institutional.io';
const mmiHomePage = 'https://metamask.io/institutions/';
const privacyAndNotice = 'https://consensys.io/privacy-notice';
const openSeaTermsOfUse = 'https://opensea.io/securityproviderterms';
const termsOfUse = 'https://consensys.io/terms-of-use';
const learnMoreArticles = 'https://support.metamask.io/';

test.describe('MMI Navigation', () => {
  test('MMI full navigation links', async ({ page, context }) => {
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
    await mainMenuPage.fillPassword();
    await mainMenuPage.finishOnboarding();
    await mainMenuPage.selectMenuOption('settings');
    await mainMenuPage.selectSettings('Advance');
    await mainMenuPage.switchTestNetwork();
    // await mainMenuPage.showIncomingTransactionsOff()
    await mainMenuPage.closeSettings();

    // // Close pages not used to remove data from logs
    await closePages(context, ['metamask-institutional.io']);
    const mainPage = new MMIMainPage(
      await getPageAndCloseRepeated(context, 'home.html'),
    );

    await checkLinkURL(
      context,
      mainPage.page,
      'MetaMask Institutional support',
      support,
    );

    // Check NFT and Activity tab links
    await mainPage.activityTab.click();
    await checkLinkURL(
      context,
      mainPage.page,
      'MetaMask Institutional support',
      support,
    );
    await mainPage.NFTsTab.click();
    await checkLinkURL(
      context,
      mainPage.page,
      'MetaMask Institutional support',
      support,
    );

    // Check main menu links
    await mainMenuPage.openMenu();
    await checkLinkURL(
      context,
      mainMenuPage.page,
      'Support',
      support,
      'button',
    );

    // Check settings links
    await mainMenuPage.selectMenuOption('settings');

    await mainMenuPage.selectSettings('Advance');
    await checkLinkURL(
      context,
      mainMenuPage.page,
      'learn more',
      'https://support.metamask.io',
    );

    await mainMenuPage.selectSettings('Security & privacy');
    await checkLinkURL(
      context,
      mainMenuPage.page,
      'Privacy policy',
      privacyAndNotice,
    );
    await checkLinkURL(
      context,
      mainMenuPage.page,
      'requests. Learn more',
      learnMoreArticles,
    );

    await mainMenuPage.selectSettings('Experimental');
    await checkLinkURL(
      context,
      mainMenuPage.page,
      'learn more',
      openSeaTermsOfUse,
    );

    await mainMenuPage.selectSettings('About');
    await checkLinkURL(
      context,
      mainMenuPage.page,
      'Privacy policy',
      privacyAndNotice,
    );
    await checkLinkURL(context, mainMenuPage.page, 'Terms of use', termsOfUse);
    await checkLinkURL(
      context,
      mainMenuPage.page,
      'Visit our support center',
      support,
    );
    await checkLinkURL(
      context,
      mainMenuPage.page,
      'Visit our website',
      mmiHomePage,
    );
    await checkLinkURL(
      context,
      mainMenuPage.page,
      'Contact us',
      supportContactUs,
    );
  });
});
