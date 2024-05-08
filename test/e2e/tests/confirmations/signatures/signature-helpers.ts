import { strict as assert } from 'assert';
import { WINDOW_TITLES, getEventPayloads } from '../../../helpers';
import { Driver } from '../../../webdriver/driver';

export async function assertMetrics(
  driver: Driver,
  mockedEndpoints: any,
  type: string,
) {
  const events = await getEventPayloads(driver, mockedEndpoints);

  assert.deepStrictEqual(events[0].properties, {
    account_type: 'MetaMask',
    signature_type: type,
    category: 'inpage_provider',
    locale: 'en',
    chain_id: '0x539',
    environment_type: 'background',
    security_alert_reason: 'NotApplicable',
    security_alert_response: 'NotApplicable',
    ui_customizations: ['redesigned_confirmation'],
  });

  assert.deepStrictEqual(events[1].properties, {
    account_type: 'MetaMask',
    signature_type: type,
    category: 'inpage_provider',
    locale: 'en',
    chain_id: '0x539',
    environment_type: 'background',
    security_alert_reason: 'NotApplicable',
    security_alert_response: 'NotApplicable',
    ui_customizations: ['redesigned_confirmation'],
  });
}

export async function clickHeaderInfoBtn(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.clickElement('button[data-testid="header-info-button"]');
}

export async function assertHeaderInfoBalance(driver: Driver) {
  const headerBalanceEl = await driver.findElement(
    '[data-testid="header-balance"]',
  );
  await driver.waitForNonEmptyElement(headerBalanceEl);
  assert.equal(await headerBalanceEl.getText(), `${WALLET_ETH_BALANCE}\nETH`);
}

export async function copyAddressAndPasteWalletAddress(driver: Driver) {
  await driver.clickElement('[data-testid="address-copy-button-text"]');
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.findElement('#eip747ContractAddress');
  await driver.pasteFromClipboardIntoField('#eip747ContractAddress');
}

export async function assertPastedAddress(driver: Driver) {
  const formFieldEl = await driver.findElement('#eip747ContractAddress');
  assert.equal(await formFieldEl.getProperty('value'), WALLET_ADDRESS);
}

export const WALLET_ADDRESS = '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1';
export const WALLET_ETH_BALANCE = '25';
