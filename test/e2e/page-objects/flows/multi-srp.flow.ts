import { Driver } from '../../webdriver/driver';
import { WALLET_PASSWORD } from '../../constants';
import AccountListPage from '../pages/accounts/list-page';
import TokensTab from '../pages/home/tokens-tab';
import HeaderNavbar from '../pages/home/header-navbar';
import HomePage from '../pages/home/homepage';
import RevealSrpPage from '../pages/reveal-srp-page';
import ManageWalletRecoverySettings from '../pages/settings/security-and-password/manage-wallet-recovery-settings';
import SecurityAndPasswordSettings from '../pages/settings/security-and-password/security-and-password-settings';
import { navigateToSecurityAndPassword, openRevealSrp } from './settings.flow';

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
  const tokensTab = new TokensTab(driver);
  await tokensTab.checkExpectedTokenBalanceIsDisplayed(expectedBalance, 'ETH');
}

export async function verifySrp(
  driver: Driver,
  srp: string,
  srpIndex: number,
): Promise<void> {
  await navigateToSecurityAndPassword(driver);
  await openRevealSrp(driver, srpIndex);

  const revealSrpPage = new RevealSrpPage(driver);
  await revealSrpPage.completeRevealSrpQuiz();
  await revealSrpPage.fillPasswordToRevealSrp(WALLET_PASSWORD);
  await revealSrpPage.checkSrpTextIsDisplayed(srp);
}

/**
 * Verifies that an account belongs to a given Secret Recovery Phrase by
 * navigating to the SRP list in Security & Privacy settings.
 *
 * @param driver - The webdriver instance.
 * @param options - Options for the verification.
 * @param options.accountName - The name of the account expected under the SRP.
 * @param options.srpIndex - The 1-based index of the Secret Recovery Phrase.
 */
export async function verifyAccountBelongsToSrp(
  driver: Driver,
  { accountName, srpIndex }: { accountName: string; srpIndex: number },
): Promise<void> {
  await navigateToSecurityAndPassword(driver);
  await new SecurityAndPasswordSettings(driver).openManageWalletRecovery();

  const manageWalletRecoverySettings = new ManageWalletRecoverySettings(driver);
  await manageWalletRecoverySettings.checkPageIsLoaded();
  await manageWalletRecoverySettings.checkAccountBelongsToSrp({
    accountName,
    srpIndex,
  });
}
