import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { WALLET_PASSWORD as testPassword } from '../../constants';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { openAddWalletMenu } from '../../page-objects/flows/add-wallet.flow';
import {
  importAdditionalSecretRecoveryPhrase,
  SECOND_TEST_E2E_SRP,
  verifyAccountBelongsToSrp,
} from '../../page-objects/flows/multi-srp.flow';
import HeaderNavbar from '../../page-objects/pages/home/header-navbar';
import AccountListPage from '../../page-objects/pages/accounts/list-page';
import ChooseWalletTypePage from '../../page-objects/pages/accounts/add-wallet/choose-wallet-type-page';
import ImportSrpPage from '../../page-objects/pages/accounts/add-wallet/import-srp-page';
import HomePage from '../../page-objects/pages/home/homepage';
import AccountDetailsPage from '../../page-objects/pages/accounts/details-page';
import RevealSrpPage from '../../page-objects/pages/reveal-srp-page';
import { mockActiveNetworks } from './common-multi-srp';

const TEST_SRP_WORDS_FOR_UI_TEST = [
  'ghost',
  'label',
  'absorb',
  'waste',
  'chief',
  'faculty',
  'truth',
  'crystal',
  'belief',
  'actress',
  'season',
  'square',
];

describe('Multi SRP - Import SRP', function (this: Suite) {
  it('successfully imports a new srp', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockActiveNetworks,
      },
      async ({ driver }) => {
        await login(driver);
        await importAdditionalSecretRecoveryPhrase(driver);
        await verifyAccountBelongsToSrp(driver, {
          accountName: 'Account 1',
          srpIndex: 2,
        });
      },
    );
  });

  it('successfully imports a new srp and it matches the srp imported', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockActiveNetworks,
      },
      async ({ driver }) => {
        await login(driver);
        await importAdditionalSecretRecoveryPhrase(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.openMultichainAccountMenu({
          accountLabel: 'Account 1',
          srpIndex: 1,
        });
        await accountListPage.clickMultichainAccountMenuItem('Account details');
        const accountDetailsPage = new AccountDetailsPage(driver);
        await accountDetailsPage.clickRevealRow();
        const revealSrpPage = new RevealSrpPage(driver);
        await revealSrpPage.checkPageIsLoaded();
        await revealSrpPage.completeRevealSrpQuiz();
        await revealSrpPage.fillPasswordToRevealSrp(testPassword);
        await revealSrpPage.checkSrpTextIsDisplayed(SECOND_TEST_E2E_SRP);
      },
    );
  });

  it('should show one word once pasted in textarea', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        testSpecificMock: mockActiveNetworks,
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
      },
      async ({ driver }: { driver: Driver; mockServer?: Mockttp }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        await openAddWalletMenu(driver);
        await new ChooseWalletTypePage(driver).clickImportWallet();

        const importSrpPage = new ImportSrpPage(driver);
        await importSrpPage.checkPageIsLoaded();

        await importSrpPage.typeIntoSrpInput(TEST_SRP_WORDS_FOR_UI_TEST[0]);
        await importSrpPage.checkSrpInputValue(TEST_SRP_WORDS_FOR_UI_TEST[0]);
      },
    );
  });
});
