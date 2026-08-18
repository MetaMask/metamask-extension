import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import { login } from './login.flow';
import { switchToNetworkFromNetworkSelect } from './network.flow';

export async function landOnTronHome(driver: Driver): Promise<void> {
  await login(driver);
  await switchToNetworkFromNetworkSelect(driver, 'Tron');
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.checkExpectedBalanceIsDisplayed('106.07');
}

export async function returnToTronHome(driver: Driver): Promise<void> {
  const homePage = new HomePage(driver);
  await homePage.navigateToHome();
  await homePage.checkExpectedBalanceIsDisplayed('106.07');
}
