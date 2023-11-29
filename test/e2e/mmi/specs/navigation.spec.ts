import { test } from '../helpers/extension-loader';
import { ChromeExtensionPage } from '../pageObjects/mmi-extension-page';
import { MMISignUpPage } from '../pageObjects/mmi-signup-page';
import { checkLinkURL } from '../helpers/utils';
import { MMIMainMenuPage } from '../pageObjects/mmi-mainMenu-page';
import { Auth0Page } from '../pageObjects/mmi-auth0-page';

const portfolio = 'https://dev.metamask-institutional.io/portfolio';
const swap = 'https://dev.metamask-institutional.io/swap';
const stake = 'https://dev.metamask-institutional.io/stake';
const support = 'https://mmi-support.zendesk.com/hc/en-us';
const supportContactUs =
  'https://mmi-support.zendesk.com/hc/en-us/requests/new';
const mmiHomePage = 'https://metamask.io/institutions/';
const privacyAndPolicy = 'https://consensys.net/privacy-policy/';
const hwWalletPrivacyAndSecurity =
  'https://support.metamask.io/hc/en-us/articles/4408552261275';
const openSeaTermsOfUse = 'https://opensea.io/securityproviderterms';
const metamaskAttributions = 'https://metamask.io/attributions/';
const termsOfUse = 'https://consensys.net/terms-of-use/';

test.describe.skip('MMI Navigation', () => {
  test('MMI full navigation links', async ({ page, context }) => {
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
    await signUp.close();

    // This is removed to improve test performance
    // Signin auth0
    const auth0 = new Auth0Page(await context.newPage());
    await auth0.signIn();
    await auth0.page.close();

    // Check main page links
    await checkLinkURL(
      context,
      page,
      'MetaMask Institutional support',
      support,
    );
    await checkLinkURL(context, page, 'Stake', stake, 'button');
    // Check that portfolio link is correct - is done async to reduce test time
    await checkLinkURL(context, page, 'Portfolio', portfolio, 'button');
    await checkLinkURL(context, page, 'Swap', swap, 'button');

    // Check NFT and Activity tab links
    const mainMenuPage = new MMIMainMenuPage(page, extensionId as string);
    await mainMenuPage.goto();
    await mainMenuPage.activityTab.click();
    await checkLinkURL(
      context,
      page,
      'MetaMask Institutional support',
      support,
    );
    await mainMenuPage.NFTsTab.click();
    await checkLinkURL(
      context,
      page,
      'MetaMask Institutional support',
      support,
    );

    // Check main menu links
    await mainMenuPage.openMenu();
    await checkLinkURL(context, page, 'Support', support, 'button');

    await mainMenuPage.openMenu();
    await checkLinkURL(
      context,
      page,
      'Portfolio Dashboard',
      portfolio,
      'button',
    );

    // Check settings links
    await mainMenuPage.selectMenuOption('settings');

    await mainMenuPage.selectSettings('Advance');
    await checkLinkURL(context, page, 'learn more', hwWalletPrivacyAndSecurity);

    await mainMenuPage.selectSettings('Security & privacy');
    await checkLinkURL(context, page, 'Privacy policy', privacyAndPolicy);
    await checkLinkURL(context, page, 'Learn More', privacyAndPolicy);

    await mainMenuPage.selectSettings('Experimental');
    await checkLinkURL(context, page, 'learn more', openSeaTermsOfUse);

    await mainMenuPage.selectSettings('About');
    await checkLinkURL(context, page, 'Privacy policy', privacyAndPolicy);
    await checkLinkURL(context, page, 'Terms of use', termsOfUse);
    await checkLinkURL(context, page, 'Attributions', metamaskAttributions);
    await checkLinkURL(context, page, 'Visit our support center', support);
    await checkLinkURL(context, page, 'Visit our website', mmiHomePage);
    await checkLinkURL(context, page, 'Contact us', supportContactUs);
  });
});
