import { test } from '../helpers/extension-loader';
import { ChromeExtensionPage } from '../pageObjects/mmi-extension-page';
import { MMISignUpPage } from '../pageObjects/mmi-signup-page';
import {
  checkLinkURL,
  closePages,
  getPageAndCloseRepeated,
} from '../helpers/utils';
import { MMIMainMenuPage } from '../pageObjects/mmi-mainMenu-page';
import { Auth0Page } from '../pageObjects/mmi-auth0-page';
import { MMIMainPage } from '../pageObjects/mmi-main-page';

const portfolio = `${process.env.MMI_E2E_MMI_DASHBOARD_URL}/portfolio`;
const swap = `${process.env.MMI_E2E_MMI_DASHBOARD_URL}/swap`;
const stake = `${process.env.MMI_E2E_MMI_DASHBOARD_URL}/stake`;
const support = 'https://mmi-support.zendesk.com/hc/en-us';
const supportContactUs =
  'https://mmi-support.zendesk.com/hc/en-us/requests/new';
const mmiHomePage = 'https://metamask.io/institutions/';
const privacyAndPolicy = 'https://consensys.io/privacy-policy';
const hwWalletPrivacyAndSecurity =
  'https://support.metamask.io/hc/en-us/articles/4408552261275';
const openSeaTermsOfUse = 'https://opensea.io/securityproviderterms';
const metamaskAttributions = 'https://metamask.io/attributions/';
const termsOfUse = 'https://consensys.io/terms-of-use';

test.describe('MMI Navigation', () => {
  test('MMI full navigation links', async ({ context }) => {
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

    // This is removed to improve test performance
    // Signin auth0
    const auth0 = new Auth0Page(await context.newPage());
    await auth0.signIn();
    await auth0.page.close();

    // Close pages not used to remove data from logs
    await closePages(context, ['metamask-institutional.io']);
    const mainPage = new MMIMainPage(
      await getPageAndCloseRepeated(context, 'home.html'),
    );

    // Check main page links
    await checkLinkURL(
      context,
      mainPage.page,
      'Portfolio',
      portfolio,
      'button',
    );

    await checkLinkURL(context, mainPage.page, 'Stake', stake, 'button');

    await checkLinkURL(context, mainPage.page, 'Swap', swap, 'button');

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
    const mainMenuPage = new MMIMainMenuPage(
      mainPage.page,
      extensionId as string,
    );
    await mainMenuPage.openMenu();
    await checkLinkURL(
      context,
      mainMenuPage.page,
      'Support',
      support,
      'button',
    );

    await mainMenuPage.openMenu();
    await checkLinkURL(
      context,
      mainMenuPage.page,
      'Portfolio Dashboard',
      portfolio,
      'button',
    );

    // Check settings links
    await mainMenuPage.selectMenuOption('settings');

    await mainMenuPage.selectSettings('Advance');
    await checkLinkURL(
      context,
      mainMenuPage.page,
      'learn more',
      hwWalletPrivacyAndSecurity,
    );

    await mainMenuPage.selectSettings('Security & privacy');
    await checkLinkURL(
      context,
      mainMenuPage.page,
      'Privacy policy',
      privacyAndPolicy,
    );
    await checkLinkURL(
      context,
      mainMenuPage.page,
      'Learn More',
      privacyAndPolicy,
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
      privacyAndPolicy,
    );
    await checkLinkURL(context, mainMenuPage.page, 'Terms of use', termsOfUse);
    await checkLinkURL(
      context,
      mainMenuPage.page,
      'Attributions',
      metamaskAttributions,
    );
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
