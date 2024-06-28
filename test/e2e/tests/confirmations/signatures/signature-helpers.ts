import { strict as assert } from 'assert';
import { WINDOW_TITLES, getEventPayloads } from '../../../helpers';
import { Driver } from '../../../webdriver/driver';

export const WALLET_ADDRESS = '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1';
export const WALLET_ETH_BALANCE = '25';

export async function assertSignatureMetrics(
  driver: Driver,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockedEndpoints: any,
  type: string,
  primaryType: string = '',
  uiCustomizations = ['redesigned_confirmation'],
) {
  const events = await getEventPayloads(driver, mockedEndpoints);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const signatureEventProperty: any = {
    account_type: 'MetaMask',
    signature_type: type,
    category: 'inpage_provider',
    chain_id: '0x539',
    environment_type: 'background',
    locale: 'en',
    security_alert_response: 'NotApplicable',
    ui_customizations: uiCustomizations,
  };

  if (primaryType !== '') {
    signatureEventProperty.eip712_primary_type = primaryType;
  }

  assert.deepStrictEqual(
    events[0].properties,
    {
      ...signatureEventProperty,
      security_alert_reason: 'NotApplicable',
    },
    'Signature request event details do not match',
  );
  assert.deepStrictEqual(
    events[1].properties,
    signatureEventProperty,
    'Signature Accepted/Rejected event properties do not match',
  );
}

export async function assertAccountDetailsMetrics(
  driver: Driver,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockedEndpoints: any,
  type: string,
) {
  const events = await getEventPayloads(driver, mockedEndpoints);

  assert.equal(events[1].event, 'Account Details Opened');
  assert.deepStrictEqual(
    events[1].properties,
    {
      action: 'Confirm Screen',
      location: 'signature_confirmation',
      signature_type: type,
      category: 'Confirmations',
      locale: 'en',
      chain_id: '0x539',
      environment_type: 'notification',
    },
    'Account Details Metrics do not match',
  );
}

export async function clickHeaderInfoBtn(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.clickElementUsingMouseMove(
    'button[data-testid="header-info-button"]',
  );
}

export async function assertHeaderInfoBalance(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const headerBalanceEl = await driver.findElement(
    '[data-testid="header-balance"]',
  );
  await driver.waitForNonEmptyElement(headerBalanceEl);
  assert.equal(await headerBalanceEl.getText(), `${WALLET_ETH_BALANCE}\nETH`);
}

export async function copyAddressAndPasteWalletAddress(driver: Driver) {
  await driver.clickElement('[data-testid="address-copy-button-text"]');
  await driver.clickElement(
    '[data-testid="account-details-modal-close-button"]',
  );
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.findElement('#eip747ContractAddress');
  await driver.pasteFromClipboardIntoField('#eip747ContractAddress');
}

export async function assertPastedAddress(driver: Driver) {
  const formFieldEl = await driver.findElement('#eip747ContractAddress');
  assert.equal(await formFieldEl.getAttribute('value'), WALLET_ADDRESS);
}
