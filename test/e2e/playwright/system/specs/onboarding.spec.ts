import { test } from '../fixtures/metamask-state.fixture';
import { WelcomePage } from '../page-objects/welcome.page';
import { TermsPage } from '../page-objects/terms.page';
import { SrpImportPage } from '../page-objects/srp-import.page';
import { PasswordPage } from '../page-objects/password.page';
import { HomePage } from '../page-objects/home.page';

const TEST_SEED_PHRASE = 'civil blame ecology always elder brick admit foam fury bunker squirrel harsh';

test.describe('MetaMask Onboarding', () => {
  test('Imports an existing wallet, sets up a secure password, and completes the onboarding process', async ({ extensionPage }) => {
    const welcome = new WelcomePage(extensionPage);
    const terms = new TermsPage(extensionPage);
    const srp = new SrpImportPage(extensionPage);
    const password = new PasswordPage(extensionPage);
    const home = new HomePage(extensionPage);

    await welcome.clickGetStarted();
    await terms.accept();
    await welcome.chooseImportWallet();
    await srp.pasteSrp(TEST_SEED_PHRASE);
    await password.create('Test1234!');
    await home.waitForLoaded();
  });
});
