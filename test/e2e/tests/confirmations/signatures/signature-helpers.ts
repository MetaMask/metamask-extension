import { strict as assert } from 'assert';
import { MockedEndpoint } from 'mockttp';
import {
  WINDOW_TITLES,
  getEventPayloads,
  openDapp,
  unlockWallet,
} from '../../../helpers';
import { Driver } from '../../../webdriver/driver';

export const WALLET_ADDRESS = '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1';
export const WALLET_ETH_BALANCE = '25';
export enum SignatureType {
  PersonalSign = '#personalSign',
  Permit = '#signPermit',
  SignTypedDataV3 = '#signTypedDataV3',
  SignTypedDataV4 = '#signTypedDataV4',
  SignTypedData = '#signTypedData',
  SIWE = '#siwe',
  SIWE_BadDomain = '#siweBadDomain',
}

type AssertSignatureMetricsOptions = {
  driver: Driver;
  mockedEndpoints: MockedEndpoint[];
  signatureType: string;
  primaryType?: string;
  uiCustomizations?: string[];
  location?: string;
  expectedProps?: Record<string, unknown>;
};

type SignatureEventProperty = {
  account_type: 'MetaMask';
  category: 'inpage_provider';
  chain_id: '0x539';
  environment_type: 'background';
  locale: 'en';
  security_alert_reason: string;
  security_alert_response: 'NotApplicable';
  signature_type: string;
  eip712_primary_type?: string;
  ui_customizations?: string[];
  location?: string;
};

/**
 * Generates expected signature metric properties
 *
 * @param signatureType
 * @param primaryType
 * @param uiCustomizations
 */
function getSignatureEventProperty(
  signatureType: string,
  primaryType: string,
  uiCustomizations: string[],
): SignatureEventProperty {
  const signatureEventProperty: SignatureEventProperty = {
    account_type: 'MetaMask',
    signature_type: signatureType,
    category: 'inpage_provider',
    chain_id: '0x539',
    environment_type: 'background',
    locale: 'en',
    security_alert_reason: 'NotApplicable',
    security_alert_response: 'NotApplicable',
    ui_customizations: uiCustomizations,
  };

  if (primaryType !== '') {
    signatureEventProperty.eip712_primary_type = primaryType;
  }

  return signatureEventProperty;
}

function assertSignatureRequestedMetrics(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: any[],
  signatureEventProperty: SignatureEventProperty,
) {
  assert.equal(events[0].event, 'Signature Requested');
  assert.deepStrictEqual(
    events[0].properties,
    {
      ...signatureEventProperty,
      security_alert_reason: 'NotApplicable',
    },
    'Signature request event details do not match',
  );
}

export async function assertSignatureConfirmedMetrics({
  driver,
  mockedEndpoints,
  signatureType,
  primaryType = '',
  uiCustomizations = ['redesigned_confirmation'],
}: AssertSignatureMetricsOptions) {
  const events = await getEventPayloads(driver, mockedEndpoints);
  const signatureEventProperty = getSignatureEventProperty(
    signatureType,
    primaryType,
    uiCustomizations,
  );

  assertSignatureRequestedMetrics(events, signatureEventProperty);
  assert.equal(events[1].event, 'Signature Approved');
  assert.deepStrictEqual(
    events[1].properties,
    signatureEventProperty,
    'Signature Accepted event properties do not match',
  );
}

export async function assertSignatureRejectedMetrics({
  driver,
  mockedEndpoints,
  signatureType,
  primaryType = '',
  uiCustomizations = ['redesigned_confirmation'],
  location,
  expectedProps = {},
}: AssertSignatureMetricsOptions) {
  const events = await getEventPayloads(driver, mockedEndpoints);
  const signatureEventProperty = getSignatureEventProperty(
    signatureType,
    primaryType,
    uiCustomizations,
  );

  assertSignatureRequestedMetrics(events, signatureEventProperty);
  assert.equal(events[1].event, 'Signature Rejected');
  assert.deepStrictEqual(
    events[1].properties,
    {
      ...signatureEventProperty,
      location,
      ...expectedProps,
    },
    'Signature Rejected event properties do not match',
  );
}

export async function assertAccountDetailsMetrics(
  driver: Driver,
  mockedEndpoints: MockedEndpoint[],
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
  await driver.clickElement(
    'button[data-testid="header-info__account-details-button"]',
  );
}

export async function assertHeaderInfoBalance(driver: Driver) {
  const headerBalanceEl = await driver.findElement(
    '[data-testid="confirmation-account-details-modal__account-balance"]',
  );
  await driver.waitForNonEmptyElement(headerBalanceEl);
  assert.equal(await headerBalanceEl.getText(), `${WALLET_ETH_BALANCE}\nETH`);
}

export async function copyAddressAndPasteWalletAddress(driver: Driver) {
  await driver.clickElement('[data-testid="address-copy-button-text"]');
  await driver.delay(500); // Added delay to avoid error Element is not clickable at point (x,y) because another element obscures it, happens as soon as the mouse hovers over the close button
  await driver.clickElement(
    '[data-testid="confirmation-account-details-modal__close-button"]',
  );
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.findElement('#eip747ContractAddress');
  await driver.pasteFromClipboardIntoField('#eip747ContractAddress');
}

export async function assertPastedAddress(driver: Driver) {
  const formFieldEl = await driver.findElement('#eip747ContractAddress');
  assert.equal(await formFieldEl.getAttribute('value'), WALLET_ADDRESS);
}

export async function openDappAndTriggerSignature(
  driver: Driver,
  type: string,
) {
  await unlockWallet(driver);
  await openDapp(driver);
  await driver.clickElement(type);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
}
