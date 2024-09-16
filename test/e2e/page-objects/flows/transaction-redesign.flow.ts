import { DAPP_URL, WINDOW_TITLES } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import TestDapp from '../pages/test-dapp';
import Dialog from '../pages/dialog';

export const createERC721SetApprovalForAllTransaction = async (
  driver: Driver,
  contractAddress: string,
) => {
  console.log('Create ERC721 setApprovalForAll transaction');

  const testDapp = new TestDapp(driver);

  await testDapp.open({ contractAddress, url: DAPP_URL });

  await testDapp.clickERC721SetApprovalForAllButton();
};

export const createERC1155SetApprovalForAllTransaction = async (
  driver: Driver,
  contractAddress: string,
) => {
  console.log('Create ERC1155 setApprovalForAll transaction');

  const testDapp = new TestDapp(driver);

  await testDapp.open({ contractAddress, url: DAPP_URL });

  await testDapp.clickERC1155SetApprovalForAllButton();
};

export const assertSetApprovalForAllTitle = async (driver: Driver) => {
  console.log('Assert contents of set approval for all title and subheading');

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const dialog = new Dialog(driver);

  await dialog.check_setApprovalForAllTitle();
  await dialog.check_setApprovalForAllSubHeading();
};

export const scrollToBottomOfConfirmationAndConfirm = async (
  driver: Driver,
) => {
  console.log('Scroll to the bottom of the confirmation and Confirm');

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const dialog = new Dialog(driver);

  await dialog.clickScrollToBottomButton();
  await dialog.clickFooterConfirmButton();
};
