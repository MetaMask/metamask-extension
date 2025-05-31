import {
  completeCreateNewWalletOnboardingFlow,
  completeImportSRPOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
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
