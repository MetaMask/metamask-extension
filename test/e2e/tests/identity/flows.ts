import {
  completeCreateNewWalletOnboardingFlow,
  completeImportSRPOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { Driver } from '../../webdriver/driver';
import { IDENTITY_TEAM_PASSWORD, IDENTITY_TEAM_SEED_PHRASE } from './constants';

export const completeOnboardFlowIdentity = async (
  driver: Driver,
  seedPhrase?: string,
) => {
  await completeImportSRPOnboardingFlow({
    driver,
    seedPhrase: seedPhrase ?? IDENTITY_TEAM_SEED_PHRASE,
    password: IDENTITY_TEAM_PASSWORD,
  });

  const homePage = new HomePage(driver);
  await homePage.check_pageIsLoaded();
  await homePage.check_expectedBalanceIsDisplayed('0');

  const header = new HeaderNavbar(driver);
  await header.check_pageIsLoaded();
  await homePage.check_hasAccountSyncingSyncedAtLeastOnce();
  return { homePage, header };
};

export const completeNewWalletFlowIdentity = async (driver: Driver) => {
  await completeCreateNewWalletOnboardingFlow({
    driver,
    password: IDENTITY_TEAM_PASSWORD,
  });

  const homePage = new HomePage(driver);
  await homePage.check_pageIsLoaded();
  await homePage.check_expectedBalanceIsDisplayed('0');

  const header = new HeaderNavbar(driver);
  await header.check_pageIsLoaded();
  return { homePage, header };
};

export const getSRP = async (driver: Driver) => {
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.check_pageIsLoaded();
  await headerNavbar.openSettingsPage();
  const settingsPage = new SettingsPage(driver);
  await settingsPage.check_pageIsLoaded();
  await settingsPage.goToPrivacySettings();

  const privacySettings = new PrivacySettings(driver);
  await privacySettings.check_pageIsLoaded();
  await privacySettings.openRevealSrpQuiz();
  await privacySettings.completeRevealSrpQuiz();
  await privacySettings.fillPasswordToRevealSrp(IDENTITY_TEAM_PASSWORD);
  const srp = await privacySettings.getSrpInRevealSrpDialog();
  return srp;
};
