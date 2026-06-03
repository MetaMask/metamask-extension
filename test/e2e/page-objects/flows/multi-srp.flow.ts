import { Driver } from '../../webdriver/driver';
import { WALLET_PASSWORD } from '../../constants';
import AccountListPage from '../pages/account-list-page';
import HeaderNavbar from '../pages/header-navbar';
import HomePage from '../pages/home/homepage';
import PrivacySettings from '../pages/settings/privacy-settings';
import SettingsPage from '../pages/settings/settings-page';

export const SECOND_TEST_E2E_SRP =
  'bench top weekend buyer spoon side resist become detect gauge eye feed';

/**
 * Imports an additional secret recovery phrase from the account list after unlock.
 *
 * @param driver - The webdriver instance.
 * @param options - Optional overrides.
 * @param options.srpWords - Space-separated recovery phrase words. Defaults to {@link SECOND_TEST_E2E_SRP}.
 * @param options.expectedBalance - Expected balance for Account 1 to verify after import. Defaults to '0'.
 */
export async function importAdditionalSecretRecoveryPhrase(
  driver: Driver,
  {
    srpWords = SECOND_TEST_E2E_SRP,
    expectedBalance = '0',
  }: { srpWords?: string; expectedBalance?: string } = {},
): Promise<void> {
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.openAccountMenu();
  const accountListPage = new AccountListPage(driver);
  await accountListPage.checkPageIsLoaded();
  await accountListPage.startImportSecretPhrase(srpWords);
  await homePage.checkNewSrpAddedToastIsDisplayed();
  await homePage.dismissSrpAddedToast();
  await homePage.checkPageIsLoaded();
  await homePage.checkExpectedTokenBalanceIsDisplayed(expectedBalance, 'ETH');
}

export async function verifySrp(
  driver: Driver,
  srp: string,
  srpIndex: number,
): Promise<void> {
  await new HeaderNavbar(driver).openSettingsPage();
  const settingsPage = new SettingsPage(driver);
  await settingsPage.checkPageIsLoaded();
  await settingsPage.goToSecurityAndPasswordSettings();

  const privacySettings = new PrivacySettings(driver);
  await privacySettings.checkSecurityAndPasswordPageIsLoaded();
  await privacySettings.openRevealSrpQuiz(srpIndex);
  await privacySettings.completeRevealSrpQuiz();
  await privacySettings.fillPasswordToRevealSrp(WALLET_PASSWORD);
  await privacySettings.checkSrpTextIsDisplayed(srp);
}
