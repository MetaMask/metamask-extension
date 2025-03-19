/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { MockedEndpoint } from 'mockttp';
import { veryLargeDelayMs } from '../../../helpers';
import { Ganache } from '../../../seeder/ganache';
import GanacheContractAddressRegistry from '../../../seeder/ganache-contract-address-registry';
import { Driver } from '../../../webdriver/driver';

const {
  logInWithBalanceValidation,
  openDapp,
  WINDOW_TITLES,
} = require('../../../helpers');
const { scrollAndConfirmAndAssertConfirm } = require('../helpers');

export type TestSuiteArguments = {
  driver: Driver;
  ganacheServer?: Ganache;
  contractRegistry?: GanacheContractAddressRegistry;
  mockedEndpoint?: MockedEndpoint | MockedEndpoint[];
};

export async function openDAppWithContract(
  driver: Driver,
  contractRegistry: GanacheContractAddressRegistry | undefined,
  smartContract: string,
) {
  const contractAddress = await (
    contractRegistry as GanacheContractAddressRegistry
  ).getContractAddress(smartContract);

  await logInWithBalanceValidation(driver);

  await openDapp(driver, contractAddress);
}

export async function createContractDeploymentTransaction(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement(`#deployButton`);
}

export async function confirmContractDeploymentTransaction(driver: Driver) {
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.waitForSelector({
    css: 'h2',
    text: 'Deploy a contract',
  });

  await scrollAndConfirmAndAssertConfirm(driver);

  await driver.delay(2000);
  await driver.waitUntilXWindowHandles(2);

  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  await driver.clickElement({ text: 'Activity', tag: 'button' });
  await driver.waitForSelector(
    '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
  );
}

export async function confirmRedesignedContractDeploymentTransaction(
  driver: Driver,
) {
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.waitForSelector({
    css: 'h2',
    text: 'Deploy a contract',
  });

  await driver.waitForSelector({
    css: 'p',
    text: 'This site wants you to deploy a contract',
  });

  await scrollAndConfirmAndAssertConfirm(driver);

  await driver.delay(2000);
  await driver.waitUntilXWindowHandles(2);

  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  await driver.clickElement({ text: 'Activity', tag: 'button' });
  await driver.waitForSelector(
    '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
  );
}

export async function createDepositTransaction(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement(`#depositButton`);
}

export async function confirmDepositTransaction(driver: Driver) {
  await driver.waitUntilXWindowHandles(3);

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.waitForSelector({
    css: 'h2',
    text: 'Transaction request',
  });

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await toggleAdvancedDetails(driver);

  await driver.waitForSelector({
    css: 'p',
    text: 'Nonce',
  });

  await driver.delay(veryLargeDelayMs);
  await scrollAndConfirmAndAssertConfirm(driver);
}

export async function confirmDepositTransactionWithCustomNonce(
  driver: Driver,
  customNonce: string,
) {
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.waitForSelector({
    css: 'h2',
    text: 'Transaction request',
  });

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.waitForSelector({
    css: 'p',
    text: 'Nonce',
  });

  await driver.clickElement('.edit-nonce-btn');
  await driver.fill('[data-testid="custom-nonce-input"]', customNonce);
  await driver.clickElement({
    text: 'Save',
    tag: 'button',
  });
  await driver.delay(veryLargeDelayMs);
  await scrollAndConfirmAndAssertConfirm(driver);

  // Confirm tx was submitted with the higher nonce
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  await driver.clickElement('[data-testid="account-overview__activity-tab"]');

  const sendTransactionListItem = await driver.findElement(
    '.transaction-list__pending-transactions .activity-list-item',
  );
  await sendTransactionListItem.click();

  await driver.waitForSelector({
    css: '.transaction-breakdown__value',
    text: customNonce,
  });
}

export async function toggleOnCustomNonce(driver: Driver) {
  // switch to metamask page and open the three dots menu
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  // Open settings menu button
  const accountOptionsMenuSelector =
    '[data-testid="account-options-menu-button"]';
  await driver.clickElement(accountOptionsMenuSelector);

  // Click settings from dropdown menu
  const globalMenuSettingsSelector = '[data-testid="global-menu-settings"]';
  await driver.waitForSelector(globalMenuSettingsSelector);
  await driver.clickElement(globalMenuSettingsSelector);

  // Click Advanced tab
  const advancedTabRawLocator = {
    text: 'Advanced',
    tag: 'div',
  };
  await driver.clickElement(advancedTabRawLocator);

  // Toggle on custom toggle setting (off by default)
  await driver.clickElement('.custom-nonce-toggle');

  // Close settings
  await driver.clickElement(
    '.settings-page__header__title-container__close-button',
  );
}

export async function toggleOnHexData(driver: Driver) {
  // switch to metamask page and open the three dots menu
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  // Open settings menu button
  const accountOptionsMenuSelector =
    '[data-testid="account-options-menu-button"]';
  await driver.clickElement(accountOptionsMenuSelector);

  // Click settings from dropdown menu
  const globalMenuSettingsSelector = '[data-testid="global-menu-settings"]';
  await driver.waitForSelector(globalMenuSettingsSelector);
  await driver.clickElement(globalMenuSettingsSelector);

  // Click Advanced tab
  const advancedTabRawLocator = {
    text: 'Advanced',
    tag: 'div',
  };
  await driver.clickElement(advancedTabRawLocator);

  // Toggle on custom toggle setting (off by default)
  await driver.clickElement('.hex-data-toggle');

  // Close settings
  await driver.clickElement(
    '.settings-page__header__title-container__close-button',
  );
}

export async function toggleAdvancedDetails(driver: Driver) {
  // TODO - Scroll button not shown in Firefox if advanced details enabled too fast.
  await driver.delay(1000);

  await driver.clickElement(`[data-testid="header-advanced-details-button"]`);
}

export async function assertAdvancedGasDetails(driver: Driver) {
  await driver.waitForSelector({ css: 'p', text: 'Network fee' });
  await driver.waitForSelector({ css: 'p', text: 'Speed' });
  await driver.waitForSelector({ css: 'p', text: 'Max fee' });
}

export async function assertAdvancedGasDetailsWithL2Breakdown(driver: Driver) {
  await driver.waitForSelector({ css: 'p', text: 'Network fee' });
  await driver.waitForSelector({ css: 'p', text: 'L1 fee' });
  await driver.waitForSelector({ css: 'p', text: 'L2 fee' });
  await driver.waitForSelector({ css: 'p', text: 'Speed' });
  await driver.waitForSelector({ css: 'p', text: 'Max fee' });
}
